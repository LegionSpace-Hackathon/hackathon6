import React from 'react';
import './FileAttachment.scss';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type?: string;
  url?: string;
  filename?: string;
  previewUrl?: string;
  belongs_to?: string;
}

interface FileAttachmentProps {
  file: FileInfo;
  onRemove?: () => void;
  isPreview?: boolean;
}

/**
 * 文件附件展示组件
 */
const FileAttachment: React.FC<FileAttachmentProps> = ({ file, onRemove, isPreview = false }) => {
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // 获取文件图标
  const getFileIcon = (type: string, filename: string): string => {
    // 添加空值检查
    if (!type) {
      // 如果type为空，尝试从文件名判断类型
      const ext = getFileExtension(filename);
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
        return 'file-image';
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
        return 'file-video';
      } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
        return 'file-audio';
      } else if (ext === 'pdf') {
        return 'file-pdf';
      } else if (['doc', 'docx'].includes(ext)) {
        return 'file-word';
      } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return 'file-excel';
      } else if (['ppt', 'pptx'].includes(ext)) {
        return 'file-ppt';
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return 'file-archive';
      } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) {
        return 'file-text';
      }
      return 'file-alt';
    }
    
    // 根据文件类型返回对应的图标类名
    if (type.startsWith('image/')) return 'file-image';
    if (type.startsWith('video/')) return 'file-video';
    if (type.startsWith('audio/')) return 'file-audio';
    if (type.includes('pdf')) return 'file-pdf';
    if (type.includes('word') || type.includes('document')) return 'file-word';
    if (type.includes('excel') || type.includes('sheet')) return 'file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'file-ppt';
    if (type.includes('zip') || type.includes('compressed')) return 'file-archive';
    if (type.includes('text/')) return 'file-text';
    return 'file-alt';
  };

  const isImage = file.type && file.type.startsWith('image/');
  const isVideo = file.type && file.type.startsWith('video/');
  const isAudio = file.type && file.type.startsWith('audio/');
  const iconClass = getFileIcon(file.type || '', file.name);

  // 判断是否为base64数据
  const isBase64 = (url?: string): boolean => {
    return !!url && url.startsWith('data:');
  };
  
  // 获取图标颜色
  const getIconColor = (iconClass: string): string => {
    switch (iconClass) {
      case 'file-pdf': return '#e53935'; // 红色
      case 'file-word': return '#1565c0'; // 蓝色
      case 'file-excel': return '#2e7d32'; // 绿色
      case 'file-ppt': return '#ff8f00'; // 橙色
      case 'file-archive': return '#6d4c41'; // 棕色
      case 'file-text': return '#616161'; // 灰色
      case 'file-audio': return '#7b1fa2'; // 紫色
      case 'file-video': return '#0097a7'; // 青色
      default: return '#757575'; // 默认灰色
    }
  };

  // 文件下载函数
  const downloadFile = (url?: string, filename?: string) => {
    if (!url) return;
    
    const a = document.createElement('a');
    a.href = url.startsWith('http') ? url : `https://dify.tongfudun.com${url}`;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="file-attachment">
      <div className="file-preview">
        {(isImage && file.url) ? (
          <img src={file.url} alt={file.name} className="file-thumbnail" />
        ) : isVideo && file.url && !isBase64(file.url) ? (
          <video 
            className="file-thumbnail" 
            controls 
            preload="metadata"
            poster="">
            <source src={file.url} type={file.type} />
            您的浏览器不支持视频播放
          </video>
        ) : isAudio && file.url && !isBase64(file.url) ? (
          <audio 
            className="file-audio-player" 
            controls 
            preload="metadata">
            <source src={file.url} type={file.type} />
            您的浏览器不支持音频播放
          </audio>
        ) : (
          <div className="file-icon" style={{backgroundColor: getIconColor(iconClass) + '20'}}>
            {/* 展示大的分类图标 */}
            {/* <div className="file-icon-large">
              <i className={`fa fa-${iconClass}`} style={{color: getIconColor(iconClass)}}></i>
            </div> */}
            <i className={`fa fa-${iconClass}`} style={{color: getIconColor(iconClass)}}>{getFileExtension(file.name).toUpperCase()}</i>
            <span className="file-extension">{getFileExtension(file.name).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="file-info">
        <div className="file-name" title={file.name}>
          {file.name.length > 5 ? file.name.slice(0, 5) + '...' : file.name}
        </div>
        <div className="file-size">{formatFileSize(file.size)}</div>
      </div>
      {!isPreview && onRemove && (
        <button type="button" className="file-remove" onClick={onRemove} title="移除文件">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

export default FileAttachment;
