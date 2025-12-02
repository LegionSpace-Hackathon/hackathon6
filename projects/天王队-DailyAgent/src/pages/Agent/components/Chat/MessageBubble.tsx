import React, { useState, useEffect, useRef } from 'react';
import { Markdown } from 'ds-markdown';
import classNames from 'classnames';
import * as echarts from 'echarts';
import DynamicChart from '../Charts/DynamicChart';
import EChartsRenderer from '../Charts/EChartsRenderer';
import { extractCodeBlocks, extractChartConfigs } from '../../utils/streamUtils';
import { parseChartBlocks, initCharts } from '../Charts/markdownChartPlugin';
import {
  extractEchartsConfigs,
  processEchartsBlocks,
  getChartConfig,
  renderEchartsPlaceholders,
  disposeChartsInContainer,
} from '../../utils/echartsPlugin';
import {
  processDocumentLinks,
  addDocumentLinkListeners,
  DocumentLinkInfo,
} from '../../utils/documentLinkUtils';
import { OptimizedImage } from '../../../../components';
import { Toast } from 'antd-mobile';
import { FileInfo } from './FileAttachment';
import { filePreview } from '../../api/difyStream';
import MessageActions from './MessageActions';
import { domPlugins, domParserPlugin } from '../../utils/markdownUtils';
import './MessageBubble.scss';
import tfdLogo from '../../../../assets/images/logo/tfd_logo.png';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
  className?: string;
  error?: string | null;
  files?: FileInfo[];
  agentAvatar?: string;
  messageId?: string; // 消息ID，用于反馈API
  userId?: string; // 用户ID，用于反馈API
  isLatest?: boolean; // 是否为最新消息
}

/**
 * 消息气泡组件
 * 支持Markdown、代码高亮、图表渲染
 * 专用于显示用户消息和当前流式消息
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  isUser,
  isStreaming = false,
  className = '',
  error = null,
  files = [],
  agentAvatar,
  messageId = '',
  userId = '',
  isLatest = false,
}) => {
  const [hasCodeBlock, setHasCodeBlock] = useState(false);
  const [hasChart, setHasChart] = useState(false);
  const [chartConfigs, setChartConfigs] = useState<Array<Record<string, any>>>([]);
  const [echartsConfigs, setEchartsConfigs] = useState<Array<Record<string, any>>>([]);
  const [chartIds, setChartIds] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [processedMarkdown, setProcessedMarkdown] = useState<string>('');
  const [documentLinks, setDocumentLinks] = useState<Map<string, DocumentLinkInfo>>(new Map());
  const [shouldShowDocumentLinks, setShouldShowDocumentLinks] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const messageRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const chartInstancesRef = useRef<Map<string, echarts.ECharts>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const {t} = useTranslation()

  // 检测内容中的特殊元素
  useEffect(() => {
    setHasCodeBlock(extractCodeBlocks(content).length > 0);

    const configs = extractChartConfigs(content);
    setHasChart(configs.length > 0);
    setChartConfigs(configs);

    // 提取ECharts配置
    const echartConfigs = extractEchartsConfigs(content);
    setEchartsConfigs(echartConfigs);

    console.log('提取到echarts配置数量:', echartConfigs.length);

    // 处理Markdown内容
    let result = content;

    // 只有在非流式状态时才处理文档链接，避免在流式传输过程中过早显示文件
    if (!isStreaming) {
      // 处理文档链接
      const documentLinkResult = processDocumentLinks(result);
      result = documentLinkResult.processedContent;
      setDocumentLinks(documentLinkResult.documentLinks);
      setShouldShowDocumentLinks(true); // 允许显示文档链接
    } else {
      // 流式传输时，清空文档链接状态，避免中间状态的文件显示
      setDocumentLinks(new Map());
      setShouldShowDocumentLinks(false); // 禁止显示文档链接
      
      // 在流式传输过程中，过滤掉文档链接的HTML标记，避免中间显示
      result = result.replace(/<div class="document-link-container">[\s\S]*?<\/div>/g, '');
    }

    // 处理常规图表
    if (configs.length > 0) {
      result = parseChartBlocks(result);
    }

    // 处理ECharts图表
    if (echartConfigs.length > 0) {
      console.log('处理echarts占位符');
      const processed = processEchartsBlocks(result);
      result = processed.content;
      setChartIds(processed.chartIds);
      console.log('处理后的Markdown内容:', result);
    }

    setProcessedMarkdown(result);

    // 断开之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, [content, isStreaming]); // 添加isStreaming作为依赖项

  // 处理流式传输完成后的文档链接
  useEffect(() => {
    // 当流式传输完成时（isStreaming从true变为false），重新处理文档链接
    if (!isStreaming && content) {
      console.log('流式传输完成，处理文档链接');
      const documentLinkResult = processDocumentLinks(content);
      setDocumentLinks(documentLinkResult.documentLinks);
      setShouldShowDocumentLinks(true); // 允许显示文档链接
      
      // 更新处理后的Markdown内容
      let result = content;
      result = documentLinkResult.processedContent;
      
      // 重新处理图表
      const configs = extractChartConfigs(content);
      if (configs.length > 0) {
        result = parseChartBlocks(result);
      }
      
      const echartConfigs = extractEchartsConfigs(content);
      if (echartConfigs.length > 0) {
        const processed = processEchartsBlocks(result);
        result = processed.content;
        setChartIds(processed.chartIds);
      }
      
      setProcessedMarkdown(result);
    }
  }, [isStreaming, content]);

  // 处理常规图表
  useEffect(() => {
    if (messageRef.current && hasChart) {
      // 初始化图表
      initCharts(messageRef.current);
    }
  }, [hasChart, messageRef.current]);

  // 设置DOM变化观察器来检测Markdown渲染完成
  useEffect(() => {
    // 断开之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // 如果没有图表配置或消息容器还没准备好，不需要观察
    if (chartIds.length === 0 || !messageRef.current) return;

    // 创建一个新的MutationObserver
    const observer = new MutationObserver((mutations) => {
      // 检查是否有占位符元素被添加到DOM中
      const placeholders = messageRef.current?.querySelectorAll('.echarts-placeholder');
      const hasPlaceholders = placeholders && placeholders.length > 0;

      if (hasPlaceholders) {
        console.log('检测到占位符元素在DOM中，准备渲染图表');

        // 延迟执行，确保DOM已经完全渲染
        setTimeout(() => {
          if (messageRef.current) {
            // 使用新的渲染函数
            renderEchartsPlaceholders(messageRef.current, echarts);

            // 渲染完成后断开观察器
            observer.disconnect();
          }
        }, 300);
      }
    });

    // 配置观察器
    observer.observe(messageRef.current, {
      childList: true, // 监视直接子节点的添加或移除
      subtree: true, // 监视所有后代节点
      attributes: false,
      characterData: false,
    });

    // 保存观察器引用
    observerRef.current = observer;

    // 组件卸载时断开观察器
    return () => {
      observer.disconnect();
    };
  }, [chartIds, messageRef.current]);

  // 处理文档链接事件监听器
  useEffect(() => {
    if (messageRef.current && documentLinks.size > 0 && shouldShowDocumentLinks) {
      // 延迟执行，确保DOM已经渲染完成
      const timer = setTimeout(() => {
        if (messageRef.current) {
          addDocumentLinkListeners(messageRef.current, documentLinks, (linkInfo) => {
            // 文档链接点击处理
            console.log('MessageBubble: 文档链接点击:', linkInfo);
            const filePath = linkInfo.filePath?.split('/').pop(); // "2dc14be3-a8cc-4fcd-8412-66d9d813ea3e.docx"
            if (!filePath) return;
            filePreview(filePath, linkInfo.fileName).then((res: any) => {
              console.log('StaticMessage: 文档链接点击:', res);
              if (res?.data) {
                window.location.href = res?.data;
              } else {
                Toast.show({
                  content: res?.message || '文档链接获取失败',
                  icon: 'fail',
                });
              }
            });
            // TODO: 用户需要在这里实现自定义跳转逻辑
            // customDocumentHandler(linkInfo);
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [documentLinks, processedMarkdown, shouldShowDocumentLinks]);

  // 处理普通链接点击，使用 iframe 弹窗预览
  useEffect(() => {
    if (!markdownRef.current || isUser) return;

    const container = markdownRef.current;
    const linkElements = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href]'));

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.href;
      if (!href) return;

      setPreviewUrl(href);
      setPreviewTitle(target.textContent || href);
    };

    linkElements.forEach((link) => {
      // 避免重复绑定：先移除再添加
      link.removeEventListener('click', handleClick as any);
      link.addEventListener('click', handleClick as any);
      // 为可点击链接增加统一样式
      link.classList.add('md-link-preview');
    });

    return () => {
      linkElements.forEach((link) => {
        link.removeEventListener('click', handleClick as any);
      });
    };
  }, [processedMarkdown, isUser]);

  // 在组件卸载时清理图表实例
  useEffect(() => {
    return () => {
      // 清理本地图表实例
      chartInstancesRef.current.forEach((chart) => {
        if (chart && !chart.isDisposed()) {
          chart.dispose();
        }
      });
      chartInstancesRef.current.clear();

      // 清理容器内的ECharts实例
      if (messageRef.current) {
        disposeChartsInContainer(messageRef.current);
      }

      // 断开观察器
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 格式化时间戳
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  function downloadByLink(url: string | undefined, filename: string) {
    const a = document.createElement('a');
    a.href = 'https://dify.tongfudun.com' + url;
    a.download = filename || 'file'; // 指定下载文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 渲染文件附件
  const renderFiles = () => {
    if (!files || files.length === 0) return null;
    return (
      <div className="message-files">
        {files.map((file) =>
          file.belongs_to !== 'assistant' ? (
            <div key={file.id} className="file-attachment-item">
              {file.type && file.type.includes('image') && (file.previewUrl || file.url) ? (
                <div className="img-box">
                  <img
                    src={
                      // 优先使用服务器URL，如果没有则使用本地预览URL
                      file?.url ? `https://dify.tongfudun.com${file.url}` : 
                      (file?.previewUrl || '')
                    }
                    alt={file.name}
                    className="file-thumbnail"
                    onError={(e) => {
                      // 如果服务器图片加载失败，尝试使用本地预览
                      const imgElement = e.target as HTMLImageElement;
                      if (file?.previewUrl && imgElement.src !== file.previewUrl) {
                        imgElement.src = file.previewUrl;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="file-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  <span className="file-extension">{file.name}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              key={file.id}
              className="file-attachment-item"
              onClick={() => downloadByLink(file.url, file.name)}
            >
              <div className="file-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </div>
              <div className="file-name">{file.name}</div>
            </div>
          )
        )}
      </div>
    );
  };

  // 检测是否处于思考状态
  const isInThinkingState = processedMarkdown === t('agent.inThink');

  // 决定是否显示操作按钮
  // 条件：不是用户消息 且 (是最新消息或鼠标悬浮) 且 不是流式加载中 且 不在思考状态
  const shouldShowActions = (isLatest || isHovered) && !isStreaming && !isInThinkingState;

  // 决定是否显示免责声明
  // 条件：不是用户消息 且 不是流式加载中 且 不在思考状态 且 有内容
  const shouldShowDisclaimer = !isUser && !isStreaming && !isInThinkingState && processedMarkdown && processedMarkdown.trim().length > 0;

  return (
    <div
      className={classNames(
        'message-bubble-container',
        { 'user-message': isUser, 'assistant-message': !isUser },
        { 'error-message': !!error },
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={messageRef}
        className={classNames('message-bubble', {
          'code-block': hasCodeBlock,
          streaming: isStreaming,
          thinking: isInThinkingState,
          error: !!error,
          'has-files': files && files.length > 0,
          'has-charts': chartIds.length > 0,
        })}
      >
        {/* 显示文件附件 */}
        {renderFiles()}

        {isUser && <div className="message-content">{processedMarkdown}</div>}
        {!isUser && (
          <>
            <div className="message-logo">
              <OptimizedImage
                src={agentAvatar || tfdLogo}
                alt="Agent Avatar"
                width={42}
                height={42}
                style={{ margin: '0', borderRadius: '50%' }}
              />
            </div>
            <div ref={markdownRef}>
              {isInThinkingState ? (
                // 思考状态特殊显示
                <div className="markdown-content">
                  <div className="thinking-status">{t('agent.inThink')}</div>
                </div>
              ) : (
                // 正常Markdown内容
                <Markdown
                  interval={18}
                  answerType="answer"
                  plugins={[
                    // 添加DOM解析插件
                    domParserPlugin,
                    // 其他内置插件可以在这里添加
                  ]}
                  codeBlock={{
                    headerActions: true, // 启用代码块头部操作按钮
                  }}
                  disableTyping={!isStreaming} // 只有正在流式传输的消息才启用打字机效果
                  autoStartTyping={isStreaming} // 只有正在流式传输的消息才自动开始打字效果
                >
                  {processedMarkdown || (isStreaming ? t('agent.inanalysis') : '')}
                </Markdown>
              )}
            </div>
          </>
        )}

        {/* 动态渲染图表 */}
        {chartConfigs.map((config, index) => (
          <DynamicChart
            key={`chart-${index}`}
            config={config}
            height="300px"
            className="message-chart"
          />
        ))}

        {/* 显示错误信息 */}
        {error && (
          <div className="message-error">
            <p>连接错误: {error}</p>
          </div>
        )}

        {/* AI生成内容免责声明 */}
        {shouldShowDisclaimer && (
          <div className="ai-disclaimer">
            {t('agent.aiDisclaimer')}
          </div>
        )}

        {/* 链接 iframe 预览弹窗 */}
        {previewUrl && (
          <div className="link-preview-modal">
            <div
              className="link-preview-backdrop"
              onClick={() => setPreviewUrl(null)}
            />
            <div className="link-preview-dialog">
              <div className="link-preview-header">
                <div className="link-preview-title" title={previewTitle}>
                  {previewTitle}
                </div>
                <div className="link-preview-actions">
                  <button
                    className="link-preview-open-external"
                    onClick={() => {
                      window.open(previewUrl, '_blank');
                    }}
                  >
                    {t('agent.openInNewTab') || '在新窗口打开'}
                  </button>
                  <button
                    className="link-preview-close"
                    onClick={() => setPreviewUrl(null)}
                    aria-label="close"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="link-preview-body">
                <iframe
                  src={previewUrl}
                  title={previewTitle}
                  className="link-preview-iframe"
                />
              </div>
            </div>
          </div>
        )}

        {shouldShowActions && (
          <MessageActions
            content={content}
            isUser={isUser}
            messageId={messageId}
            userId={userId}
            isStreaming={true}
          />
        )}
      </div>
    </div>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export default React.memo(MessageBubble, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return (
    prevProps.content === nextProps.content &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.error === nextProps.error &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.userId === nextProps.userId &&
    prevProps.isLatest === nextProps.isLatest &&
    prevProps.agentAvatar === nextProps.agentAvatar &&
    // 比较files数组
    JSON.stringify(prevProps.files) === JSON.stringify(nextProps.files)
  );
});
