// 手机号脱敏函数：中间四位显示为****
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length !== 11) {
    return phoneNumber;
  }
  // 格式：138****8000（前3位 + **** + 后4位）
  return phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7);
}

export function getGreeting(phoneNumber?: string): string {
  const hour = new Date().getHours();
  // 使用手机号，如果没有则使用默认值
  // 如果提供了手机号，进行脱敏处理
  const name = phoneNumber ? maskPhoneNumber(phoneNumber) : 'VigilKeeper Agent';

  if (hour >= 5 && hour < 12) {
    return `上午好，${name}`;
  } else if (hour >= 12 && hour < 18) {
    return `下午好，${name}`;
  } else if (hour >= 18 && hour < 22) {
    return `晚上好，${name}`;
  } else {
    return `夜深了，${name}`;
  }
}


