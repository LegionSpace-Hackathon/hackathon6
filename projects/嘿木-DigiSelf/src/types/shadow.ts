export interface ShadowIdentity {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  isActive: boolean;
  settings: ShadowSettings;
  createdAt: Date;
  lastActiveAt?: Date;
}

export interface ShadowSettings {
  // 启用模式
  enableMode: 'manual' | 'scheduled';
  
  // 手动模式设置
  manualEnabled: boolean;
  
  // 定时模式设置
  scheduleEnabled: boolean;
  scheduleStartTime: string; // HH:MM 格式
  scheduleEndTime: string;   // HH:MM 格式
  scheduleDays: string[];    // ['monday', 'tuesday', ...]
  
  // 数据权限
  dataPermissions: {
    chatHistory: boolean;
    meetings: boolean;
    documents: boolean;
    calendar: boolean;
  };
  
  // 回复设置
  autoReply: boolean;
  replyDelay: number; // 秒
  replyStyle: 'formal' | 'casual' | 'professional' | 'friendly';
}

export interface ChatMessage {
  id: string;
  shadowId: string;
  content: string;
  sender: 'user' | 'shadow' | 'system';
  timestamp: Date;
  isAutoReply?: boolean;
}

export interface ChatSession {
  id: string;
  shadowId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}