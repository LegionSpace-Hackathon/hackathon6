import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.scss';
import ChatInterface from './components/Chat';
import { MessageProvider } from './stores/messageStore';
import {
  getDifyAgentInfo,
  getConversationMessages,
  ConversationMessage,
  mapAgentIdToType,
  getCurrentAgentId,
  getUserIdentifier,
  clearCurrentConversation,
} from './api/difyStream';
import { getPluginAddInfo } from '../../api/chainmeet';
import AgentLayout from './components/Layout';
import customerAvatar from '../../assets/images/agent/customer.png';
import dailyAvatar from '../../assets/images/agent/daily.png';
import salesAvatar from '../../assets/images/agent/sales.png';
import LoginModal from '../../components/LoginModal/LoginModal';
import { useAppSelector, useAppDispatch } from '../../stores/hooks';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { parseShareInfo, ShareInfo } from '../../utils/shareUtils';
import ShareButton from './components/Chat/components/ShareButton';
import OpenInApp from '../../globalComponents/openInApp';
import { isApp } from '../../utils/uaHelper';
import classnames from 'classnames';
import { disposeAllCharts } from './utils/echartsPlugin';
import { toggleLightDark } from '../../stores/slices/themeSlice';
import { getEffectiveTheme } from '../../theme/utils';

const mockConversations = [
  {
    id: 'conv-1',
    agentId: 'customer-service',
    title: '关于产品功能的咨询',
    lastMessage: '请问如何使用这个功能？',
    timestamp: '2023-05-20T10:30:00',
  },
  {
    id: 'conv-2',
    agentId: 'sales-assistant',
    title: '产品价格咨询',
    lastMessage: '你们的企业版多少钱？',
    timestamp: '2023-05-19T14:20:00',
  },
];

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

interface Conversation {
  id: string;
  agentId: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

/**
 * Agent 智能体页面
 * 首页展示智能体列表，创建会话后进入聊天界面
 * 销售智能体需要登录，客服智能体可以访客身份访问
 */
const AgentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  // 从URL参数获取智能体ID
  const agentId = searchParams.get('id');
  const conversationId = searchParams.get('conversation');
  const chainmeetShare = searchParams.get('chainmeetShare');
  const hasHistory = searchParams.get('hasHistory') === 'true';
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  // 获取主题状态
  const themeMode = useAppSelector((state) => state.theme.mode);
  const currentTheme = getEffectiveTheme(themeMode);
  
  // 添加状态来跟踪会话ID，用于处理URL更新后的状态同步
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);

  // 同步URL参数变化到状态
  useEffect(() => {
    console.log(conversationId, 'conversationId11222');
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  // 处理会话ID更新
  const handleConversationIdUpdate = (newConversationId: string) => {
    setCurrentConversationId(newConversationId);
  };

  // Mock 数据
  const mockAgents = [
    {
      id: 'customer-service', // 映射到请求头 agentType: 'Cuse'
      name: t('agent.serviceAgent'),
      description: '解答产品相关问题，提供技术支持',
      avatar: customerAvatar,
    },
    {
      id: 'sales-assistant', // 映射到请求头 agentType: 'Towin'
      name: t('agent.salesAgent'),
      description: '介绍产品功能，提供销售方案',
      avatar: salesAvatar,
    },
  ];

  const [agents, setAgents] = useState<AgentInfo[]>(mockAgents);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [currentAgent, setCurrentAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [pluginAddInfo, setPluginAddInfo] = useState<any>(null);
  const [firstUserMessage, setFirstUserMessage] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);
  
  // 添加防重复调用的状态
  const [lastLoadedConversationId, setLastLoadedConversationId] = useState<string | null>(null);
  const loadingHistoryRef = useRef<boolean>(false);

  // 测试ECharts功能
  const [showEchartsTest, setShowEchartsTest] = useState<boolean>(false);
  const toggleEchartsTest = () => setShowEchartsTest(!showEchartsTest);

  // 登录弹窗状态
  const [loginModalVisible, setLoginModalVisible] = useState<boolean>(false);
  // 从Redux获取认证状态
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // 分享相关状态
  const [shareInfo, setShareInfo] = useState<ShareInfo>({ isShared: false, isOwner: true });
  const currentUserId = getUserIdentifier();

  // OpenInApp组件引用
  const openInAppRef = useRef<any>(null);

  // 用于引用AgentLayout组件实例
  const layoutRef = useRef<any>(null);
  const [isEnglish, setIsEnglish] = useState<boolean>(false);
  
  // 消息管理器引用
  const messageManagerRef = useRef<any>(null);

  // 处理开始新对话
  const handleStartNewChat = () => {
    // 清空消息管理器的显示消息
    if (messageManagerRef.current && messageManagerRef.current.resetMessageState) {
      messageManagerRef.current.resetMessageState();
    }

    // 检查是否在APP内且是分享对话
    const isInApp = isApp();
    const isSharedConversation = shareInfo.isShared;

    // 如果不在APP内且是分享对话，直接调用OpenInApp功能
    if (!isInApp && isSharedConversation) {
      // 直接调用OpenInApp组件的handleOpenInApp方法
      if (openInAppRef.current && openInAppRef.current.handleOpenInApp) {
        openInAppRef.current.handleOpenInApp();
      }
      return;
    }

    // 重置选中状态
    localStorage.removeItem('agent_current_conversation');
    // 清除当前智能体的会话记录
    clearCurrentConversation();

    // 构建URL参数
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();

    // 保持必要的参数
    newParams.set('id', agentId || '');
    newParams.set('chainmeetShare', localStorage.getItem('agent_share_str_url') || '');

    // 直接导航到不带会话ID的页面，表示这是新会话
    navigate(`/agent?${newParams.toString()}`);
  };

  // 处理消息管理器准备就绪
  const handleMessageManagerReady = (messageManager: any) => {
    messageManagerRef.current = messageManager;
  };

  // 检测屏幕尺寸
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 页面卸载时清理所有ECharts实例
  useEffect(() => {
    return () => {
      disposeAllCharts();
    };
  }, []);

  // 解析分享信息
  useEffect(() => {
    const info = parseShareInfo(searchParams, currentUserId);
    console.log('分享信息:', info);
    setShareInfo(info);

    console.log('分享信息:', info);
  }, [searchParams, currentUserId]);

  // 检查是否需要登录（销售智能体且未登录）
  // 注释掉强制登录逻辑，让销售智能体和客服智能体保持一致
  // useEffect(() => {
  //   if (agentId === 'sales-assistant' && !isAuthenticated) {
  //     setLoginModalVisible(true);
  //   } else {
  //     setLoginModalVisible(false);
  //   }
  // }, [agentId, isAuthenticated]);

  const shareUrl = (title: string, name: string, description: string, icon: string) => {
    const shareStr = {
      title: document.title,
      desc: description,
      icon:
        icon || agentId === 'customer-service'
          ? 'https://prove-image.tongfudun.com/customer.png'
          : 'https://prove-image.tongfudun.com/sales.png',
    };
    const shareStrUrl = window.btoa(unescape(window.encodeURIComponent(JSON.stringify(shareStr))));
    localStorage.setItem('agent_share_str_url', shareStrUrl);
    // if (isApp()) {
    const reg = new RegExp('chainmeetShare=[^&]*', 'gi');
    const url =
      window.location.search.indexOf('chainmeetShare') > -1
        ? window.location.search.replace(reg, `chainmeetShare=${shareStrUrl}`)
        : `${window.location.search}${!window.location.search ? '?' : '&'
        }chainmeetShare=${shareStrUrl}`;
    window.history.replaceState('', '', url);
    // }
  };
  useEffect(() => {
    if (conversationId) {
      // 原路径：构建URL参数，保持分享相关参数
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();

      // 保持必要的参数
      newParams.set('id', agentId || '');
      newParams.set('conversation', conversationId);
      newParams.set('chainmeetShare', chainmeetShare || '');
      newParams.set('hasHistory', 'true');

      // 保持分享相关参数
      if (currentParams.get('shareUserId')) {
        newParams.set('shareUserId', currentParams.get('shareUserId') || '');
      }
      if (currentParams.get('isShared')) {
        newParams.set('isShared', currentParams.get('isShared') || '');
      }

      navigate(`/agent?${newParams.toString()}`);
    }
  }, []);

  useEffect(() => {
    // 获取默认title，HTML中已经设置了正确的初始title，这里只需要获取用于分享
    let title = t('agent.serviceDesc');
    let agentName = t('agent.serviceName');
    let agentDescription = t('agent.serviceIntro');
    let avatar = dailyAvatar;
    
    // 根据智能体ID设置
    if (agentId === 'customer-service') {
      title = t('agent.serviceDesc');
      agentName = t('agent.serviceName');
      agentDescription = t('agent.serviceIntro');
      avatar = dailyAvatar;
    } else if (agentId === 'sales-assistant') {
      title = t('agent.salesDesc');
      agentName = t('agent.salesName');
      agentDescription = t('agent.salesIntro');
      avatar = dailyAvatar;
    }
    document.title = title;
    
    
    
    const loadData = async () => {
      setLoading(true);
      // 如果有agentId，加载智能体信息
      if (agentId) {
        try {
          const info = await getDifyAgentInfo(agentId);
          
          // 设置智能体信息
          let finalAgentName = agentName;
          let finalAgentDescription = agentDescription;
          let finalAvatar = avatar;
          
          setCurrentAgent({
            id: agentId,
            name: finalAgentName,
            description: finalAgentDescription,
            avatar: finalAvatar,
          });
          shareUrl(title, title, finalAgentDescription,finalAvatar || '');
        } catch (err) {
          setError(err instanceof Error ? err.message : '加载智能体失败');
        }
      }

      setLoading(false);
    };
    loadData();
  }, [agentId, currentLanguage]);

  useEffect(() => {
    // 没有conversationId时清空历史消息，表示这是新会话
    if (!conversationId) {
      setHistoryMessages([]);
      setLastLoadedConversationId(null);
      loadingHistoryRef.current = false;
      return;
    }

    // 只有当有会话ID且标记有历史记录时才加载历史消息
    if (!conversationId || !hasHistory) {
      return;
    }

    // 防重复调用：如果正在加载或已经加载过相同的会话ID，则跳过
    if (loadingHistoryRef.current || lastLoadedConversationId === conversationId) {
      console.log('会话历史消息正在加载或已加载，跳过重复请求');
      return;
    }

    const loadHistoryMessages = async () => {
      loadingHistoryRef.current = true;
      setLoadingHistory(true);
      try {
        // 如果是分享模式，需要传递解密后的用户ID
        let shareUserIdForAPI: string | undefined = undefined;
       const shareInfo = parseShareInfo(searchParams, currentUserId)
        if (shareInfo.isShared && shareInfo.originalUserId) {
          shareUserIdForAPI = shareInfo.originalUserId;
        }
        console.log('shareUserIdForAPI', shareUserIdForAPI,shareInfo);
        const messages = await getConversationMessages(
          conversationId,
          agentId || undefined,
          shareUserIdForAPI
        );
        console.log(messages);
        setHistoryMessages(messages);
        setLastLoadedConversationId(conversationId); // 记录已加载的会话ID
        console.log(`成功加载 ${messages.length} 条历史消息`);
      } catch (err) {
        console.error('加载历史消息失败', err);
        setError(err instanceof Error ? err.message : t('agent.failLoad'));
      } finally {
        setLoadingHistory(false);
        loadingHistoryRef.current = false;
      }
    };
    
    loadHistoryMessages();
  }, [conversationId, hasHistory, shareInfo.isShared, shareInfo.originalUserId, agentId, t]);

  // 处理登录模态框的关闭
  const handleLoginModalCancel = () => {
    setLoginModalVisible(false);
    // 注释掉销售智能体的重定向逻辑
    // if (agentId === 'sales-assistant' && !isAuthenticated) {
    //   navigate('/agent');
    // }
  };

  const handleCreateConversation = (agent: AgentInfo) => {
    // 注释掉销售智能体的登录检查，让所有智能体都可以直接访问
    // if (agent.id === 'sales-assistant' && !isAuthenticated) {
    //   setLoginModalVisible(true);
    //   return;
    // }
    
    // 直接导航到新会话页面
    navigate(`/agent?id=${agent.id}`);
  };

  // 处理用户发送的第一条消息
  const handleFirstUserMessage = (message: string) => {
    setFirstUserMessage(message);
  };

  // 获取要显示的标题内容
  const getHeaderContent = () => {
    console.log(historyMessages, 'historyMessages11222', firstUserMessage, 'firstUserMessage',conversationId, 'conversationId');
    if (!conversationId) {
      return t('agent.newChat');
    }

  
    
    // 如果有历史消息，显示第一条用户消息

    if (historyMessages.length > 0) {
      // 找到第一条用户消息
      const firstMessage = historyMessages.find((msg) => msg.role === 'user');
      if (firstMessage) {
        return firstMessage.content;
      }
    }

    // 如果有用户发送的第一条消息，显示它
    if (firstUserMessage) {
      return firstUserMessage;
    }

    // 如果都没有，显示"新对话"
    return t('agent.newChat');
  };

  // 处理侧边栏切换
  const handleToggleSidebar = () => {
    // 更新本地状态
    const newState = !showMobileSidebar;
    setShowMobileSidebar(newState);

    // 直接调用AgentLayout组件的方法
    if (layoutRef.current && layoutRef.current.toggleSidebar) {
      layoutRef.current.toggleSidebar(newState);
    }

    console.log('切换侧边栏状态:', newState);
  };

  // 处理侧边栏状态更新（从AgentLayout组件传回）
  const handleSidebarToggle = (isOpen: boolean) => {
    console.log('侧边栏状态更新:', isOpen);
    setShowMobileSidebar(isOpen);
  };

  // 获取AgentLayout组件引用
  const setLayoutRef = (ref: any) => {
    if (ref && ref.toggleSidebar) {
      layoutRef.current = ref;
    }
  };

  //中英文切换
  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };


  // 处理分享模式下的开始新对话
  const handleStartNewChatFromShare = () => {
    // 检查是否在APP内且是分享对话
    const isInApp = isApp();
    const isSharedConversation = shareInfo.isShared;

    // 如果不在APP内且是分享对话，直接调用OpenInApp功能
    if (!isInApp && isSharedConversation) {
      // 直接调用OpenInApp组件的handleOpenInApp方法
      if (openInAppRef.current && openInAppRef.current.handleOpenInApp) {
        openInAppRef.current.handleOpenInApp();
      }
      return;
    }

    // 确保智能体信息已加载，如果没有则先设置默认值
    if (!currentAgent && agentId) {
      const avatar = agentId === 'customer-service' ? customerAvatar : salesAvatar;
      setCurrentAgent({
        id: agentId,
        name: agentId === 'customer-service' ? t('agent.serviceName') : t('agent.salesName'),
        description: agentId === 'customer-service' ? t('agent.serviceIntro') : t('agent.salesIntro'),
        avatar: avatar,
      });
    }

    // 跳转到正常的新会话页面
    navigate(`/agent?id=${agentId}`);
  };

  // 处理AgentLayout中的OpenInApp显示请求
  const handleShowOpenInApp = () => {
    // 直接调用OpenInApp组件的handleOpenInApp方法
    if (openInAppRef.current && openInAppRef.current.handleOpenInApp) {
      openInAppRef.current.handleOpenInApp();
    }
  };

  //切换语言
  const handleLanguageChange = () => {
    const lang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(lang);
    localStorage.setItem('i18n_lang', lang)
    setCurrentLanguage(lang);
    // 暂时移除Redux状态同步，统一使用i18n.language
    // 更新URL参数
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', lang);
    window.history.replaceState('', '', currentUrl.toString());
    // navigate(currentUrl.toString().split(location.host)[1], {replace: true})
  };

  // 切换主题（只在 light 和 dark 之间切换）
  const handleThemeToggle = () => {
    dispatch(toggleLightDark());
  };

  // 渲染加载状态 - 使用统一的AgentLayout，避免重复挂载
  const renderContent = () => {
    if (loading || loadingHistory) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="ml-3">{loading ? t('loading') : t('agent.loadMore')}</p>
        </div>
      );
    }

    if (agentId) {
      return (
        <div className="flex-grow flex flex-col">
          <div className="agent_header">
            {/* 移动端菜单按钮 */}
            {isMobile && (
              <button className="mobile-menu-button" onClick={handleToggleSidebar}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}

            <div className="agent_header_desc" id="agent_header_desc">
              {getHeaderContent()}
            </div>
            <div
              className={classnames([
                'lg-switch',
                { 'lg-switch-en': currentLanguage === 'en' },
                { 'lg-switch-cn': currentLanguage === 'zh-CN' },
              ])}
              onClick={() => handleLanguageChange()}
            >
              <span className={classnames('cn')}>
                <em>中</em>
              </span>
              <span className={classnames('en')}>
                <em>A</em>
              </span>
            </div>
            <div
              className={classnames([
                'theme-switch',
                { 'theme-switch-dark': currentTheme === 'dark' },
                { 'theme-switch-light': currentTheme === 'light' },
              ])}
              onClick={() => handleThemeToggle()}
            >
              <div className="theme-switch-track">
                <div className="theme-switch-thumb">
                  {currentTheme === 'light' ? '☀' : '🌙'}
                </div>
              </div>
            </div>
            {/* 分享按钮 - 只有在正常模式且有会话时显示 */}
            {/* {currentConversationId && (
              <ShareButton
                agentId={agentId}
                originalUserId={shareInfo?.originalUserId}
                conversationId={currentConversationId}
                agentName={currentAgent?.name}
                agentLogo={currentAgent?.avatar}
                agentAvatar={currentAgent?.avatar}
                currentAgent={currentAgent}
                className="header-share-button"
              />
            )} */}

            

            {/* 移动端新建会话按钮 */}
            {isMobile && (
              <button className="new-chat-button-mobile" onClick={handleStartNewChat}>
                <svg
                  width="24"
                  height="24"
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
              </button>
            )}
          </div>

          {currentAgent && (
            <MessageProvider initialConversationId={conversationId || ''}>
              <ChatInterface
                agentId={agentId}
                historyMessages={historyMessages}
                onFirstUserMessage={handleFirstUserMessage}
                onConversationIdUpdate={handleConversationIdUpdate}
                currentAgent={currentAgent}
                scenarioType={agentId === 'sales-assistant' ? 'sales' : 'general'}
                shareInfo={shareInfo}
                onStartNewChatFromShare={handleStartNewChatFromShare}
                pluginAddInfo={pluginAddInfo}
                onMessageManagerReady={handleMessageManagerReady}
              />
            </MessageProvider>
          )}
        </div>
      );
    }

    // 如果没有智能体ID，显示智能体选择页面
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{t('agent.chooseAgent')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCreateConversation(agent)}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-content-center mr-4">
                  {agent.avatar ? (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">{agent.name.charAt(0)}</div>
                  )}
                </div>
                <h2 className="text-xl font-semibold">{agent.name}</h2>
              </div>
              <button className="mt-4 w-full py-2 bg-primary-500 text-white rounded-md transition-colors">
                {t('agent.beginChat')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 使用统一的AgentLayout，避免重复挂载
  return (
    <ErrorBoundary>
      <AgentLayout
        onToggleSidebar={handleSidebarToggle}
        ref={setLayoutRef}
        currentAgent={currentAgent}
        onShowOpenInApp={handleShowOpenInApp}
        onStartNewChat={handleStartNewChat}
      >
        {renderContent()}
      </AgentLayout>

      {/* 登录弹窗 */}
      <LoginModal visible={loginModalVisible} onCancel={handleLoginModalCancel} />

      {/* 隐藏的OpenInApp组件，用于直接调用API */}
      <OpenInApp ref={openInAppRef} />
    </ErrorBoundary>
  );
};

export default AgentPage;
