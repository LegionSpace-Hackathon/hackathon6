/**
 * Markdown自定义渲染工具
 */
import React, { ReactElement } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { formSubmitEvent } from './formSubmitEvent';

// 定义插件类型
type PluginType = 'custom' | 'buildIn';

// 检测是否为移动端设备
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// HTML实体解码函数
const decodeHTMLEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

// 解析选项数组
const parseOptions = (optionsString: string): string[] => {
  if (!optionsString) return [];
  
  // 先解码HTML实体编码
  const decodedOptions = decodeHTMLEntities(optionsString);
  
  // 尝试多种方法解析选项
  try {
    // 尝试解析为JSON
    return JSON.parse(decodedOptions);
  } catch (e) {
    try {
      // 尝试替换引号后解析
      return JSON.parse(decodedOptions.replace(/'/g, '"'));
    } catch (innerError) {
      try {
        // 尝试移除转义字符再解析
        return JSON.parse(decodedOptions.replace(/\\"/g, '"'));
      } catch (escapeError) {
        // 最后尝试作为逗号分隔的字符串处理
        return decodedOptions.split(',').map(item => item.trim());
      }
    }
  }
};

// 定义可以支持DOM解析的Markdown插件配置
export const domPlugins = [
  {
    remarkPlugin: remarkGfm,
    rehypePlugin: rehypeRaw,
    type: 'custom' as PluginType,
    id: 'html-parser'
  },
  {
    rehypePlugin: rehypeSanitize,
    type: 'custom' as PluginType,
    id: 'html-sanitizer'
  }
];

// 表单组件映射
export const formComponents = {
  form: (props: any) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data: Record<string, any> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      // 记录提交的数据
      console.log('表单提交数据:', data);
      
      // 触发表单提交事件，通知聊天界面发送消息
      formSubmitEvent.publish(data);
      
      // 提供用户反馈
      const form = e.target as HTMLFormElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        const originalText = submitButton.textContent || '提交';
        submitButton.disabled = true;
        submitButton.textContent = '已提交 ✓';
        
        // 1秒后重置按钮状态
        setTimeout(() => {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }, 1000);
      }
    };
    
    return React.createElement('form', {
      ...props,
      onSubmit: handleSubmit,
      className: `md-form ${props.className || ''}`
    }, props.children);
  },
  
  input: (props: any) => {
    // 如果是select类型，改用我们的自定义选择组件
    if (props.type === 'select') {
      const options = parseOptions(props['data-options'] || '[]');
      return createCustomSelect(props, options);
    }
    
    // 处理value属性，确保它不会导致input变成受控组件
    const inputProps = { ...props };
    
    // 如果value是空字符串或未定义，则删除它，使用defaultValue替代
    if (inputProps.value === '' || inputProps.value === undefined) {
      delete inputProps.value;
    } else if (inputProps.value !== null) {
      // 如果有值但不是null，则使用defaultValue
      inputProps.defaultValue = inputProps.value;
      delete inputProps.value;
    }
    
    // 默认渲染为input元素
    return React.createElement('input', {
      ...inputProps,
      className: `md-input ${inputProps.className || ''}`
    });
  },
  
  // 添加textarea组件支持
  textarea: (props: any) => {
    // 处理value属性，确保它不会导致textarea变成受控组件
    const textareaProps = { ...props };
    
    // 如果value是空字符串、None或未定义，则删除它
    if (textareaProps.value === '' || textareaProps.value === undefined || textareaProps.value === 'None') {
      delete textareaProps.value;
    } else if (textareaProps.value !== null) {
      // 如果有值但不是null，则使用defaultValue
      textareaProps.defaultValue = textareaProps.value;
      delete textareaProps.value;
    }
    
    return React.createElement('textarea', {
      ...textareaProps,
      className: `md-textarea ${textareaProps.className || ''}`
    });
  },
  
  select: (props: any) => {
    // 解析选项或使用现有子元素
    const options = parseOptions(props['data-options'] || '[]');
    let optionValues: string[] = [];
    
    if (props.children && Array.isArray(props.children)) {
      // 如果有子元素，从子元素中提取选项值
      optionValues = (props.children as ReactElement[]).map((option: any) => 
        option.props?.value || option.props?.children
      );
    } else {
      optionValues = options;
    }
    
    // 使用自定义选择组件
    return createCustomSelect(props, optionValues);
  },
  
  button: (props: any) => {
    return React.createElement('button', {
      ...props,
      className: `md-button ${props.className || ''}`
    }, props.children);
  }
};

/**
 * 创建自定义下拉选择组件
 * 完全使用div模拟select行为，避免移动端原生select的样式问题
 */
const createCustomSelect = (props: any, options: string[]) => {
  const isMobile = isMobileDevice();
  
  // 创建一个纯div实现的自定义下拉选择器
  const customSelectProps = {
    className: `md-custom-select ${isMobile ? 'md-custom-select-mobile' : ''} ${props.className || ''}`,
    'data-name': props.name || '',
    'data-value': options[0] || '',
    'data-options': JSON.stringify(options),
    'data-placeholder': props.placeholder || '请选择',
    onClick: (e: MouseEvent) => {
      // 防止事件冒泡
      e.stopPropagation();
      
      // 切换下拉状态
      const target = e.currentTarget as HTMLElement;
      const dropdown = target.querySelector('.md-dropdown-options');
      
      if (dropdown) {
        const isOpen = dropdown.classList.contains('md-dropdown-open');
        if (isOpen) {
          dropdown.classList.remove('md-dropdown-open');
        } else {
          // 关闭所有其他打开的下拉框
          document.querySelectorAll('.md-dropdown-open').forEach(elem => {
            elem.classList.remove('md-dropdown-open');
          });
          
          dropdown.classList.add('md-dropdown-open');
          
          // 点击外部关闭下拉
          setTimeout(() => {
            const closeDropdown = () => {
              dropdown.classList.remove('md-dropdown-open');
              document.removeEventListener('click', closeDropdown);
            };
            document.addEventListener('click', closeDropdown);
          }, 0);
        }
      }
    }
  };
  
  // 创建隐藏的真实select用于表单提交
  const hiddenSelectProps = {
    name: props.name || '',
    style: { display: 'none' },
    defaultValue: options[0] || ''
  };
  
  // 创建选项DOM
  const optionElements = options.map((option, index) => {
    return React.createElement('div', {
      key: index,
      className: 'md-option',
      'data-value': option,
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        
        // 更新当前选中值
        const dropdown = (e.currentTarget as HTMLElement).closest('.md-custom-select');
        if (dropdown) {
          // 更新显示值
          const displayElem = dropdown.querySelector('.md-selected-text');
          if (displayElem) {
            displayElem.textContent = option;
          }
          
          // 更新隐藏input值
          const hiddenInput = dropdown.querySelector('select');
          if (hiddenInput) {
            (hiddenInput as HTMLSelectElement).value = option;
          }
          
          // 更新data-value属性
          (dropdown as HTMLElement).dataset.value = option;
          
          // 关闭下拉
          const optionsContainer = dropdown.querySelector('.md-dropdown-options');
          if (optionsContainer) {
            optionsContainer.classList.remove('md-dropdown-open');
          }
        }
      }
    }, option);
  });
  
  // 创建下拉图标
  const dropdownIcon = React.createElement('div', {
    className: 'md-dropdown-icon'
  }, '▾');
  
  // 创建真实隐藏的select
  const hiddenSelect = React.createElement('select', hiddenSelectProps, 
    options.map((option, idx) => 
      React.createElement('option', { key: idx, value: option }, option)
    )
  );
  
  // 创建显示的当前选择文本
  const selectedText = React.createElement('div', {
    className: 'md-selected-text'
  }, options[0] || props.placeholder || '请选择');
  
  // 创建下拉选项容器
  const dropdownOptions = React.createElement('div', {
    className: 'md-dropdown-options'
  }, optionElements);
  
  // 组装最终的自定义下拉组件
  return React.createElement('div', customSelectProps, [
    hiddenSelect,
    selectedText,
    dropdownIcon,
    dropdownOptions
  ]);
};

// 完整的DOM解析配置
export const domParserPlugin = {
  remarkPlugin: remarkGfm,
  rehypePlugin: rehypeRaw,
  type: 'custom' as PluginType,
  id: 'dom-parser',
  components: formComponents
}; 