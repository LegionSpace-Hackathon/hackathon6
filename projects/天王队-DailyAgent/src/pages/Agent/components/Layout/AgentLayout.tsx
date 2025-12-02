import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SwipeAction } from 'antd-mobile';
import './AgentLayout.scss';
import {
  getConversations,
  getConversationMessages,
  getUserIdentifier,
  deleteConversation,
  setCurrentConversation,
  getCurrentConversation,
  clearCurrentConversation,
} from '../../api/difyStream';
import { OptimizedImage } from '../../../../components';
import { useAppSelector } from '../../../../stores/hooks';
import defaultAvatar from '../../../../assets/images/default.png';
import OpenInApp from '../../../../globalComponents/openInApp';
import { isApp } from '../../../../utils/uaHelper';
import { parseShareInfo, ShareInfo } from '../../../../utils/shareUtils';

interface AgentLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  onToggleSidebar?: (isCollapsed: boolean) => void;
  currentAgent?: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
  } | null;
  onShowOpenInApp?: () => void;
  onStartNewChat?: () => void; // 开始新对话的回调函数
}

interface Conversation {
  id: string;
  title: string;
  name?: string;
  created_at: string; // API 返回的是字符串格式的时间戳
}

/**
 * 智能体页面专用布局组件
 */
const AgentLayout = memo(forwardRef<{ toggleSidebar: (show?: boolean) => void }, AgentLayoutProps>(
  ({ children, showSidebar = true, onToggleSidebar, currentAgent, onShowOpenInApp, onStartNewChat }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [searchParams] = useSearchParams();
    const agentId = searchParams.get('id');
    const conversationParam = searchParams.get('conversation');
    // 从Redux获取认证状态和用户信息
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    // 控制会话操作菜单
      const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  // 手风琴展开状态管理 - 默认都展开
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  // 分享相关状态
  const [shareInfo, setShareInfo] = useState<ShareInfo>({ isShared: false, isOwner: true });
  
  // 使用useMemo缓存用户标识，避免不必要的重新计算
  const currentUserId = React.useMemo(() => getUserIdentifier(), []);
  
  // 获取基础用户标识（不包含智能体ID），用于判断是否为访客
  const baseUserId = React.useMemo(() => {
    try {
      const userInfoStr = localStorage.getItem('user');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo.mobileOld) {
          return userInfo.mobileOld;
        } else if (userInfo.email) {
          return userInfo.email;
        }
      }
      return '-1';
    } catch (error) {
      return '-1';
    }
  }, []);

    // 检测屏幕尺寸变化
    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);

        // 如果从移动端切换到桌面端，关闭移动端的侧边栏
        if (!mobile && showMobileSidebar) {
          setShowMobileSidebar(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [showMobileSidebar]);

    // 从URL参数中获取会话ID并设置选中状态
    useEffect(() => {
      if (conversationParam) {
        setSelectedConversationId(conversationParam);
      }
    }, [conversationParam]);

    // 解析分享信息
    useEffect(() => {
      const info = parseShareInfo(searchParams, currentUserId);
      setShareInfo(info);
    }, [searchParams, currentUserId]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      toggleSidebar: (show?: boolean) => {
        if (isMobile) {
          const newState = show !== undefined ? show : !showMobileSidebar;
          setShowMobileSidebar(newState);
          if (onToggleSidebar) {
            onToggleSidebar(newState);
          }
        } else {
          const newState = show !== undefined ? show : !isSidebarCollapsed;
          setIsSidebarCollapsed(newState);
          if (onToggleSidebar) {
            onToggleSidebar(newState);
          }
        }
      },
    }));

    const handleSidebarToggle = () => {
      if (isMobile) {
        const newState = !showMobileSidebar;
        setShowMobileSidebar(newState);
        if (onToggleSidebar) {
          onToggleSidebar(newState);
        }
      } else {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        if (onToggleSidebar) {
          onToggleSidebar(newState);
        }
      }
    };

    // 获取会话列表
    const fetchConversations = async () => {
      // 防重复调用检查
      if (loadingConversationsRef.current) {
        console.log('会话列表正在加载中，跳过重复请求');
        return;
      }

      try {
        loadingConversationsRef.current = true;
        setLoading(true);
        
        // 使用URL参数中的agentId
        const apiAgentId = agentId || undefined;
        
        const response = await getConversations(apiAgentId);
        setConversations(response || []);
        setHasLoadedConversations(true); // 标记已加载
        setLoading(false);
        console.log(`成功加载 ${(response || []).length} 个会话`);
      } catch (error) {
        console.error('获取会话列表失败:', error);
        setLoading(false);
      } finally {
        loadingConversationsRef.current = false;
      }
    };

  // 添加防重复调用的状态
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);
  const loadingConversationsRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  // 获取会话列表
  useEffect(() => {
    // 访客不调用列表接口
    if (baseUserId === '-1') {
      return;
    }

    // 防重复调用：如果已经加载过或正在加载，则跳过
    // if (hasLoadedConversations || loadingConversationsRef.current) {
    //   console.log('会话列表已加载或正在加载，跳过重复请求');
    //   return;
    // }

    // 防止组件重复挂载时的重复调用
    // if (mountedRef.current) {
    //   console.log('组件已挂载过，跳过重复请求');
    //   return;
    // }

    mountedRef.current = true;
    console.log('开始加载会话列表');
    fetchConversations();
  }, [searchParams.get('conversation')]); // 移除hasLoadedConversations依赖，避免循环调用

    // 切换会话操作菜单
    const toggleConversationMenu = (conversationId: string, event: React.MouseEvent) => {
      event.stopPropagation(); // 阻止事件冒泡，避免触发会话选择
      setActiveMenuId(activeMenuId === conversationId ? null : conversationId);
    };

    const naParams = (conversationId: string, shared: boolean = false) => {
      // 原路径：构建URL参数，保持分享相关参数
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();

      // 保持必要的参数
      newParams.set('id', agentId || '');
      newParams.set('conversation', conversationId);
      newParams.set('hasHistory', 'true');
      newParams.set('chainmeetShare', shared ? currentParams.get('chainmeetShare') || localStorage.getItem('agent_share_str_url') || '' : localStorage.getItem('agent_share_str_url') || '');

      // 保持分享相关参数
      if (currentParams.get('shareUserId')) {
        newParams.set('shareUserId', currentParams.get('shareUserId') || '');
      }
      if (currentParams.get('isShared')) {
        newParams.set('isShared', currentParams.get('isShared') || '');
      }
      
      // 获取会话消息历史
      navigate(`/agent?${newParams.toString()}`);
    };
    useEffect(() => {
      // 执行会话重定向逻辑
      const conversation = getCurrentConversation();
      if (conversation && !conversationParam) {
        naParams(conversation, true);
      }
    }, []);

    // 处理删除会话
    const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
      event.stopPropagation(); // 阻止事件冒泡，避免触发会话选择
      try {
        // 关闭菜单
        setActiveMenuId(null);

        // 调用删除API
        await deleteConversation(conversationId, agentId || undefined);

        // 如果删除的是当前选中的会话，清除选择状态并导航到新会话页面
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
          localStorage.removeItem('agent_current_conversation');
          
          // 导航到agent页面
          navigate(`/agent?id=${agentId}`);
        }

        // 重置加载状态并重新加载会话列表
        setHasLoadedConversations(false);
        loadingConversationsRef.current = false;
        fetchConversations();
      } catch (error) {
        console.error('删除会话失败:', error);
        // 这里可以添加错误提示
      }
    };

    // 点击页面其他区域关闭菜单
    useEffect(() => {
      const handleClickOutside = () => {
        if (activeMenuId) {
          setActiveMenuId(null);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [activeMenuId]);

    // 选择会话
    const handleSelectConversation = async (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setCurrentConversation(conversationId);

      try {
        naParams(conversationId);
        // 在移动设备上，选择会话后自动关闭侧边栏
        if (isMobile) {
          setShowMobileSidebar(false);
        }
      } catch (error) {
        console.error('获取会话历史失败:', error);
        // 发生错误时仍然导航，但不传递历史状态
        naParams(conversationId);
      }
    };

    // 开始新会话
    const handleStartNewChat = () => {
      // 检查是否在APP内且是分享对话
      const isInApp = isApp();
      const isSharedConversation = shareInfo.isShared;

      // 如果不在APP内且是分享对话，显示OpenInApp引导
      if (!isInApp && isSharedConversation) {
        // 调用父组件的回调函数来显示OpenInApp
        onShowOpenInApp?.();
        return;
      }

      // 调用父组件的回调函数来清空消息
      onStartNewChat?.();

      // 重置选中状态
      setSelectedConversationId(null);
      localStorage.removeItem('agent_current_conversation');
      // 清除当前智能体的会话记录
      clearCurrentConversation();

      // 原路径：构建URL参数，保持分享相关参数
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();

      // 保持必要的参数
      newParams.set('id', agentId || '');
      newParams.set('chainmeetShare', localStorage.getItem('agent_share_str_url') || '');
      // 保持分享相关参数（如果存在）

      // 直接导航到不带会话ID的页面，表示这是新会话
      navigate(`/agent?${newParams.toString()}`);

      // 在移动设备上，开始新会话后自动关闭侧边栏
      if (isMobile) {
        setShowMobileSidebar(false);
      }
    };

      // 统一分组到"历史"下
  const groupConversations = () => {
    const groups: Record<string, Conversation[]> = {};
    
    if (conversations.length > 0) {
      groups[t('agent.history')] = conversations;
    }

    return groups;
  };

  const conversationGroups = groupConversations();

  // 初始化展开状态 - 默认都展开
  useEffect(() => {
    // 只有当会话列表不为空且展开状态为空时才初始化
    if (conversations.length > 0 && Object.keys(expandedGroups).length === 0) {
      const groups = Object.keys(conversationGroups);
      const initialExpandedState: Record<string, boolean> = {};
      groups.forEach(group => {
        initialExpandedState[group] = true; // 默认展开
      });
      setExpandedGroups(initialExpandedState);
    }
  }, [conversations, conversationGroups, expandedGroups]);

  // 切换手风琴展开状态
  const toggleGroupExpanded = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

    // 获取用户显示名称
    const getUserDisplayName = () => {
      if (!user) return t('agent.visitor');
      return user.username || user.name || user.mobile || user.email || t('agent.visitor');
    };

    // 获取用户联系信息
    const getUserContact = () => {
      if (!user) return 'info@tongfudun.com';
      return user.mobile || user.email || '';
    };

    // 关闭侧边栏的背景遮罩点击处理
    const handleOverlayClick = () => {
      if (isMobile && showMobileSidebar) {
        setShowMobileSidebar(false);
        if (onToggleSidebar) {
          onToggleSidebar(false);
        }
      }
    };

    return (
      <div
        className={`agent-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile-layout' : ''}`}
      >
        {/* 移动端背景遮罩 */}
        {isMobile && showMobileSidebar && (
          <div className="mobile-overlay" onClick={handleOverlayClick}></div>
        )}

        {showSidebar && (
          <div
            className={`agent-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${showMobileSidebar ? 'show-mobile' : ''}`}
          >
            <div className="sidebar-header">
              <div className="logo">
                {currentAgent && currentAgent.avatar ? (
                  <div className="agent-avatar">
                    <OptimizedImage
                      src={currentAgent.avatar}
                      alt={currentAgent.name}
                      style={{borderRadius: '50%', minWidth: '32px', minHeight: '32px'}}
                      width={32}
                      height={32}
                    />
                  </div>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2V22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 7H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {!isSidebarCollapsed && (
                  <span style={{fontSize: '18px'}}>{currentAgent ? currentAgent.name : 'AI Assistant'}</span>
                )}
              </div>
              <button className="toggle-button" onClick={handleSidebarToggle}>
                {isSidebarCollapsed ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                )}
              </button>
            </div>

            <div className="sidebar-content">
              {/* 会话列表区域 */}
              <div className="conversation-list">
                <div className="new-chat-button" onClick={handleStartNewChat}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  {(!isSidebarCollapsed || (isMobile && showMobileSidebar)) && (
                    <span>{t('agent.beginNewChat')}</span>
                  )}
                </div>

                {loading ? (
                  <div className="loading-conversations">加载中...</div>
                ) : (
                  <>
                    {Object.entries(conversationGroups).map(([dateGroup, convos]) => (
                      <div key={dateGroup} className="conversation-group">
                        {(!isSidebarCollapsed || (isMobile && showMobileSidebar)) && (
                          <div 
                            className="date-header accordion-header" 
                            onClick={() => toggleGroupExpanded(dateGroup)}
                          >
                            <span>{dateGroup}</span>
                            <svg
                              className={`accordion-icon ${expandedGroups[dateGroup] ? 'expanded' : ''}`}
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        )}

                        <div className={`conversation-items ${expandedGroups[dateGroup] ? 'expanded' : 'collapsed'}`}>
                          {convos.map((conversation) => {
                          const conversationItem = (
                            <div
                              className={`conversation-item ${selectedConversationId === conversation.id ? 'selected' : ''}`}
                            >
                              <div
                                className="conversation-content"
                                onClick={() => handleSelectConversation(conversation.id)}
                              >
                                <div className="conversation-icon">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                  </svg>
                                </div>
                                {(!isSidebarCollapsed || (isMobile && showMobileSidebar)) && (
                                  <div className="conversation-details">
                                    <div className="conversation-title">
                                      {conversation.name || t('agent.newChat')}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {(!isSidebarCollapsed || (isMobile && showMobileSidebar))  &&
                                !isMobile && (
                                  <div className={`conversation-actions ${selectedConversationId === conversation.id ? 'conversation-actions-selected' : ''}`}>
                                    <button
                                      className="more-button"
                                      onClick={(e) => toggleConversationMenu(conversation.id, e)}
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                      </svg>
                                    </button>

                                    {activeMenuId === conversation.id && (
                                      <div className="conversation-menu">
                                        <button
                                          className="delete-button"
                                          onClick={(e) =>
                                            handleDeleteConversation(conversation.id, e)
                                          }
                                        >
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                          </svg>
                                          <span>删除</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          );

                          // 移动端使用SwipeAction，PC端直接返回原有的组件
                          if (isMobile) {
                            return (
                              <SwipeAction
                                key={conversation.id}
                                rightActions={[
                                  {
                                    key: 'delete',
                                    text: '删除',
                                    color: 'danger',
                                  },
                                ]}
                                onAction={(action) => {
                                  if (action.key === 'delete') {
                                    // 创建一个模拟的MouseEvent对象
                                    const mockEvent = {
                                      stopPropagation: () => {},
                                    } as React.MouseEvent;
                                    handleDeleteConversation(conversation.id, mockEvent);
                                  }
                                }}
                              >
                                {conversationItem}
                              </SwipeAction>
                            );
                          } else {
                            return <div key={conversation.id}>{conversationItem}</div>;
                          }
                        })}
                        </div>
                      </div>
                    ))}

                    {conversations.length === 0 && (
                      <div className="empty-conversations">
                        {(!isSidebarCollapsed || (isMobile && showMobileSidebar)) && (
                          <span>{t('agent.noChat')}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 导航菜单部分隐藏，以后需要时可以恢复 */}
            </div>

           
          </div>
        )}

        <main className="agent-content">{children}</main>
      </div>
    );
  }
));

AgentLayout.displayName = 'AgentLayout';

export default AgentLayout;
