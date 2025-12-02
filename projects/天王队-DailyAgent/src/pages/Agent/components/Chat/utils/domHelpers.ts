// DOM操作辅助函数
import { isMobileDevice } from './deviceDetection';

/**
 * 从可编辑div中获取纯文本内容
 */
export const getPlainTextContent = (element: HTMLDivElement): string => {
  return element.textContent || '';
};

/**
 * 移动端设备焦点处理
 */
export const focusEditableDiv = (editableElement: HTMLDivElement, preventKeyboard: boolean = false) => {
  if (!isMobileDevice()) {
    editableElement.focus();
    return;
  }

  // 移动端特殊处理
  try {
    // 确保元素可聚焦
    if (editableElement.getAttribute('contentEditable') !== 'true') {
      editableElement.setAttribute('contentEditable', 'true');
    }

    // 设置readonly来防止键盘弹出
    if (preventKeyboard) {
      editableElement.setAttribute('readonly', 'true');
    }

    // 聚焦元素
    editableElement.focus();

    // 触发焦点事件
    const focusEvent = new FocusEvent('focus', { bubbles: true });
    editableElement.dispatchEvent(focusEvent);

    // 移除readonly
    if (preventKeyboard) {
      setTimeout(() => {
        editableElement.removeAttribute('readonly');
        editableElement.focus();
      }, 100);
    }

    // 移动光标到末尾
    setTimeout(() => {
      const range = document.createRange();
      const selection = window.getSelection();
      
      // 设置在容器末尾
      range.selectNodeContents(editableElement);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 150);

  } catch (error) {
    console.warn('移动端焦点处理失败:', error);
    // 回退到简单聚焦
    editableElement.focus();
  }
}; 