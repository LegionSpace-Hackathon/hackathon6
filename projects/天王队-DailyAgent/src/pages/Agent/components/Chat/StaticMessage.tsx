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
import { FileInfo } from './FileAttachment';
import MessageActions from './MessageActions';
import { domPlugins, domParserPlugin } from '../../utils/markdownUtils';
import './MessageBubble.scss';
import tfdLogo from '../../../../assets/images/logo/tfd_logo.png';
import { filePreview } from '../../api/difyStream';
import { Toast } from 'antd-mobile';
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
}) => {
  const [hasCodeBlock, setHasCodeBlock] = useState(false);
  const [hasChart, setHasChart] = useState(false);
  const [chartConfigs, setChartConfigs] = useState<Array<Record<string, any>>>([]);
  const [echartsConfigs, setEchartsConfigs] = useState<Array<Record<string, any>>>([]);
  const [chartIds, setChartIds] = useState<string[]>([]);
  const [processedMarkdown, setProcessedMarkdown] = useState<string>('');
  const [documentLinks, setDocumentLinks] = useState<Map<string, DocumentLinkInfo>>(new Map());
  const messageRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const chartInstancesRef = useRef<Map<string, echarts.ECharts>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);

  const { t } = useTranslation()

  // 检测内容中的特殊元素
  useEffect(() => {
    setHasCodeBlock(extractCodeBlocks(content).length > 0);

    const configs = extractChartConfigs(content);
    setHasChart(configs.length > 0);
    setChartConfigs(configs);

    // 提取ECharts配置
    const echartConfigs = extractEchartsConfigs(content);
    setEchartsConfigs(echartConfigs);

    console.log('StaticMessage: 提取到echarts配置数量:', echartConfigs.length);

    // 处理Markdown内容
    let result = content;

    // 处理文档链接
    const documentLinkResult = processDocumentLinks(result);
    result = documentLinkResult.processedContent;
    setDocumentLinks(documentLinkResult.documentLinks);

    // 处理常规图表
    if (configs.length > 0) {
      result = parseChartBlocks(result);
    }

    // 处理ECharts图表
    if (echartConfigs.length > 0) {
      console.log('StaticMessage: 处理echarts占位符');
      const processed = processEchartsBlocks(result);
      result = processed.content;
      setChartIds(processed.chartIds);
      console.log('StaticMessage: 处理后的Markdown内容:', result);
    }

    setProcessedMarkdown(result);

    // 断开之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, [content]);

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
        console.log('StaticMessage: 检测到占位符元素在DOM中，准备渲染图表');

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
    if (messageRef.current && documentLinks.size > 0) {
      // 延迟执行，确保DOM已经渲染完成
      const timer = setTimeout(() => {
        if (messageRef.current) {
          addDocumentLinkListeners(messageRef.current, documentLinks, (linkInfo) => {
            // 文档链接点击处理
            console.log('StaticMessage: 文档链接点击:', linkInfo);
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
  }, [documentLinks, processedMarkdown]);

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
    if (!url) return;
    const a = document.createElement('a');
    a.href = 'https://dify.tongfudun.com' + url;
    a.download = filename || 'file'; // 指定下载文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // // 渲染文件附件
  // const renderFiles = () => {
  //   if (!files || files.length === 0) return null;
  //   console.log('StaticMessage files', files);
  //   debugger
  //   return (
  //     <div className="message-files">
  //       {files.map((file) =>
  //       (
  //         <div key={file.id} className="file-attachment-item">
  //           {file.type && file.type.includes('image') ? (
  //             <div className="img-box">
  //               <img
  //                 src={
  //                   file?.url ? `https://dify.tongfudun.com${file.url}` : file?.previewUrl || ''
  //                 }
  //                 alt={file.name}
  //                 className="file-thumbnail"
  //               />
  //             </div>
  //           ) : (
  //             <div className="file-icon" onClick={() => downloadByLink(file.url, file.filename || '')}>
  //               <svg
  //                 width="18"
  //                 height="18"
  //                 viewBox="0 0 24 24"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 strokeWidth="2"
  //               >
  //                 <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
  //                 <polyline points="13 2 13 9 20 9"></polyline>
  //               </svg>
  //               <div className="file-name">{file.filename}</div>
  //             </div>
  //           )}
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  // 决定是否显示免责声明
  // 条件：不是用户消息 且 不是流式加载中 且 有内容
  const shouldShowDisclaimer = !isUser && !isStreaming && processedMarkdown && processedMarkdown.trim().length > 0;

  return (
    <div
      className={classNames(
        'message-bubble-container',
        { 'user-message': isUser, 'assistant-message': !isUser },
        { 'error-message': !!error },
        className
      )}
    >
      <div
        ref={messageRef}
        className={classNames('message-bubble', {
          'code-block': hasCodeBlock,
          streaming: isStreaming,
          error: !!error,
          'has-files': files && files.length > 0,
          'has-charts': chartIds.length > 0,
        })}
      >
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
              <Markdown
                interval={20}
                answerType="answer"
                plugins={[
                  // 添加DOM解析插件
                  domParserPlugin,
                  // 其他内置插件可以在这里添加
                ]}
                codeBlock={{
                  headerActions: true, // 启用代码块头部操作按钮
                }}
                disableTyping={true} // 始终禁用打字机效果
                autoStartTyping={false} // 不自动开始打字效果
              >
                {processedMarkdown || t('agent.errorAnswer')}
              </Markdown>
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
        {/* 显示文件附件 */}
        {/* {renderFiles()} */}
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

        {/* 使用MessageActions组件 */}
        <MessageActions content={content} isUser={isUser} messageId={messageId} userId={userId} />
      </div>
    </div>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export default React.memo(MessageBubble, (prevProps, nextProps) => {
  // 静态消息一旦渲染就不应该改变，所以可以更激进地缓存
  return (
    prevProps.content === nextProps.content &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.isUser === nextProps.isUser &&
    JSON.stringify(prevProps.files) === JSON.stringify(nextProps.files)
  );
});
