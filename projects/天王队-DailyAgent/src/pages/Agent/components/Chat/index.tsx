// 导出主组件
export { default } from './ChatInterface';

// 导入和导出原始组件
import MessageActions from './MessageActions';
import { uploadFile, formatFilesForDifyAPI, getUserIdentifier } from '../../api/difyStream';

// 直接导出这些导入的组件和函数
export { MessageActions, uploadFile, formatFilesForDifyAPI, getUserIdentifier };

// 从ChatInterface导出其他组件
export {
  MessageBubble,
  StreamRenderer,
  StaticMessage,
  ChatInput,
  SuggestedQuestions,
  isMobileDevice,
  isAndroidDevice,
  isIOSDevice
} from './ChatInterface';
