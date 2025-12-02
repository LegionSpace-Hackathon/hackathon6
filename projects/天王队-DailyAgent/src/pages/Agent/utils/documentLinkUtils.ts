export interface DocumentLinkInfo {
  fileName: string;
  filePath: string;
  timestamp?: string;
  nonce?: string;
  sign?: string;
  fullUrl: string;
}
import { openWindowWithChianPal } from '../../../utils';
/**
 * 文档链接正则表达式
 * 匹配格式：[文件名.扩展名](/files/tools/xxx.扩展名?参数)
 */
const DOCUMENT_LINK_REGEX = /\[([^\]]+\.(docx?|xlsx?|pptx?|pdf|txt|csv))\]\(([^)]+)\)/gi;
import fileIcon from '@/assets/images/agent/file.png';
/**
 * 解析文档链接信息
 * @param url 完整的文档URL
 * @returns 解析后的文档信息
 */
export function parseDocumentUrl(url: string): DocumentLinkInfo | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    const searchParams = urlObj.searchParams;

    return {
      fileName: url.split('/').pop()?.split('?')[0] || '',
      filePath: urlObj.pathname,
      timestamp: searchParams.get('timestamp') || undefined,
      nonce: searchParams.get('nonce') || undefined,
      sign: searchParams.get('sign') || undefined,
      fullUrl: url,
    };
  } catch (error) {
    console.error('解析文档URL失败:', error);
    return null;
  }
}

/**
 * 从markdown内容中提取所有文档链接
 * @param content markdown内容
 * @returns 文档链接信息数组
 */
export function extractDocumentLinks(content: string): DocumentLinkInfo[] {
  const links: DocumentLinkInfo[] = [];
  let match;

  // 重置正则表达式的lastIndex
  DOCUMENT_LINK_REGEX.lastIndex = 0;

  while ((match = DOCUMENT_LINK_REGEX.exec(content)) !== null) {
    const [fullMatch, fileName, extension, url] = match;
    const linkInfo = parseDocumentUrl(url);

    if (linkInfo) {
      // 使用markdown中的文件名覆盖解析出的文件名
      linkInfo.fileName = fileName;
      links.push(linkInfo);
    }
  }

  return links;
}

/**
 * 替换markdown中的文档链接为特殊标记
 * @param content markdown内容
 * @returns 处理后的内容和文档链接映射
 */
export function processDocumentLinks(content: string): {
  processedContent: string;
  documentLinks: Map<string, DocumentLinkInfo>;
} {
  const documentLinks = new Map<string, DocumentLinkInfo>();
  let processedContent = content;
  let linkIndex = 0;

  // 重置正则表达式的lastIndex
  DOCUMENT_LINK_REGEX.lastIndex = 0;

  processedContent = content.replace(DOCUMENT_LINK_REGEX, (match, fileName, extension, url) => {
    const linkInfo = parseDocumentUrl(url);

    if (linkInfo) {
      linkInfo.fileName = fileName;
      const linkId = `doc-link-${linkIndex++}`;
      documentLinks.set(linkId, linkInfo);

      // 替换为特殊的HTML标记，后续会被拦截处理
      return `<div class="document-link-container">
      <span class="document-link" data-link-id="${linkId}" data-file-name="${fileName}"><span class="document-link-text-icon">
       <svg t="1753671556346" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7957" width="28" height="28"><path d="M640 0L938.666667 298.666667V938.666667a85.333333 85.333333 0 0 1-85.333334 85.333333H170.666667a85.333333 85.333333 0 0 1-85.333334-85.333333V85.333333a85.333333 85.333333 0 0 1 85.333334-85.333333h469.333333zM597.333333 85.333333H170.666667v853.333334h682.666666V341.333333H597.333333V85.333333z m85.333334 341.333334H256v85.333333h426.666667V426.666667zM512 682.666667H256v85.333333h256V682.666667z" fill="#333333" p-id="7958"></path></svg>
       </span>${fileName}</span>
      <span class="document-link-text">
       文件已存至链上文档
      </span>
      </div>`;
    }

    return match;
  });

  return {
    processedContent,
    documentLinks,
  };
}

/**
 * 处理文档下载/跳转
 * @param linkInfo 文档链接信息
 * @param customHandler 自定义处理函数（用户提供）
 */
export function handleDocumentLink(
  linkInfo: DocumentLinkInfo,
  customHandler?: (linkInfo: DocumentLinkInfo) => void
): void {
  if (customHandler) {
    customHandler(linkInfo);
  } else {
    // 默认处理：在新窗口打开
    openWindowWithChianPal(linkInfo.fullUrl);
  }
}

/**
 * 为容器元素添加文档链接点击事件监听器
 * @param container 容器元素
 * @param documentLinks 文档链接映射
 * @param customHandler 自定义处理函数
 */
export function addDocumentLinkListeners(
  container: HTMLElement,
  documentLinks: Map<string, DocumentLinkInfo>,
  customHandler?: (linkInfo: DocumentLinkInfo) => void
): void {
  const documentLinkElements = container.querySelectorAll('.document-link');

  documentLinkElements.forEach((element) => {
    const linkId = element.getAttribute('data-link-id');
    if (linkId && documentLinks.has(linkId)) {
      const linkInfo = documentLinks.get(linkId)!;

      // 添加样式
      element.classList.add('clickable-document-link');

      // 添加点击事件
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDocumentLink(linkInfo, customHandler);
      });

      // 添加鼠标悬浮效果
      element.addEventListener('mouseenter', () => {
        element.classList.add('hover');
      });

      element.addEventListener('mouseleave', () => {
        element.classList.remove('hover');
      });
    }
  });
}
