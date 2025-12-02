interface PerformanceIssue {
  type: string;
  message: string;
  value: number;
  timestamp: number;
}

const reportedIssues: PerformanceIssue[] = [];

export const reportPerformanceIssue = (message: string, value: number) => {
  const issue = {
    type: 'performance',
    message,
    value,
    timestamp: Date.now(),
  };
  
  reportedIssues.push(issue);
  
  // 开发环境下仅控制台输出
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[性能监控] 检测到问题: ${message} (${value})`);
    return;
  }
  
  // 生产环境上报到监控平台
  // sendToAnalytics(issue);
};

export const collectPerformanceData = () => {
  return {
    issues: [...reportedIssues],
  };
};

// 生产环境发送到监控后端
const sendToAnalytics = (data: any) => {
  if (typeof window === 'undefined') return;
  
  // 替换为实际的监控API端点
  const endpoint = 'https://your-analytics-api.example.com/collect';
  
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
  } else {
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // 错误处理
    });
  }
}; 