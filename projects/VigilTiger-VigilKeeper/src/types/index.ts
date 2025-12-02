export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  createdBy: string;
  createdAt: number;
  file?: File; // 保留原始文件对象用于显示
}

export interface Message {
  id: number;
  text?: string;
  displayText?: string; // 用于流式显示的文本
  files?: File[];
  uploadedFiles?: UploadedFile[];
  timestamp: Date;
  type: 'user' | 'assistant';
  isStreaming?: boolean; // 是否正在流式渲染
  status?: 'pending' | 'streaming' | 'completed' | 'error'; // 消息状态
  // 失败消息的原始请求数据，用于重新发送
  retryData?: {
    msg: string;
    fileId?: string;
    extension?: string;
    files: File[];
  };
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  onSend: (text: string, files: File[]) => void;
  onFileUpload?: (file: File) => Promise<UploadedFile>;
  onFileRemove?: (fileName: string) => void;
  isUploading?: boolean;
  isSending?: boolean; // 是否正在发送消息
  onStop?: () => void; // 停止发送回调
}

export interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onRetry?: (messageId: number) => void; // 重新发送回调
}

// 历史文件接口（用于持久化存储）
export interface HistoryFile {
  id: string;
  name: string; // 显示用的文件名（原始文件名）
  originalName?: string; // 原始文件名（用户选择的文件名）
  serverName?: string; // 服务器返回的文件名
  size: number;
  extension: string;
  mimeType: string;
  createdBy: string;
  createdAt: number;
  uploadTimestamp: number; // 上传时间戳
}


