/**
 * 表单提交事件总线
 * 用于在表单提交后触发消息发送
 */

type EventCallback = (data: Record<string, any>) => void;

class FormSubmitEventBus {
  private subscribers: EventCallback[] = [];

  // 订阅表单提交事件
  subscribe(callback: EventCallback): () => void {
    this.subscribers.push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // 发布表单提交事件
  publish(formData: Record<string, any>): void {
    // 将表单数据转换为格式化字符串
    const formattedData = this.formatFormData(formData);
    
    // 调用所有订阅者
    this.subscribers.forEach(callback => callback({ 
      rawData: formData, 
      formattedMessage: formattedData 
    }));
  }

  // 将表单数据格式化为可读字符串
  private formatFormData(data: Record<string, any>): string {
    const entries = Object.entries(data);
    if (entries.length === 0) return '表单已提交，但没有数据';

    const lines = entries.map(([key, value]) => `${key}: ${value}`);
    return `${lines.join('\n')}`;
  }
}

// 导出单例实例
export const formSubmitEvent = new FormSubmitEventBus(); 