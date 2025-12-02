// 文件上传管理钩子
import { useState, useRef } from 'react';
import { uploadFile } from '../../../api/difyStream';
import { FileInfo } from '../FileAttachment';
import blobManager from '../../../../../utils/blobManager';

// 扩展FileInfo接口，添加本地预览和上传状态
export interface ExtendedFileInfo extends FileInfo {
  previewUrl?: string; // 本地预览URL，可以是base64或blob URL
  isUploading?: boolean; // 是否正在上传
  uploadProgress?: number; // 上传进度 (0-100)
}

/**
 * 文件上传管理钩子
 * 
 * @param agentId 智能体ID
 */
const useFileUpload = (agentId: string) => {
  const [attachments, setAttachments] = useState<ExtendedFileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadProgressIntervals = useRef<{[key: string]: NodeJS.Timeout}>({});
  
  // 将文件转换为本地预览URL（使用blob管理器）
  const createFilePreview = async (file: File, fileId: string): Promise<string> => {
    return new Promise((resolve) => {
      // 对于图片文件，创建临时URL而不是base64
      if (file.type.startsWith('image/')) {
        // 检查文件大小，如果超过1MB则不创建预览
        if (file.size > 1024 * 1024) {
          console.warn('图片文件过大，跳过预览生成');
          resolve('');
          return;
        }
        
        try {
          // 使用 blob 管理器创建预览链接
          const previewUrl = blobManager.createBlobUrl(file, fileId);
          resolve(previewUrl);
        } catch (error) {
          console.error('创建预览URL失败:', error);
          resolve('');
        }
      } else {
        // 对于非图片文件，不生成预览
        resolve('');
      }
    });
  };

  // 模拟上传进度
  const simulateUploadProgress = (
    fileId: string,
    onProgress: (progress: number) => void,
    onComplete: () => void
  ): NodeJS.Timeout => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onComplete();
      }
      onProgress(progress);
    }, 200);

    // 保存interval引用以便后续清除
    uploadProgressIntervals.current[fileId] = interval;
    return interval;
  };

  // 清除所有上传进度模拟
  const clearAllProgressIntervals = () => {
    Object.values(uploadProgressIntervals.current).forEach(interval => {
      clearInterval(interval);
    });
    uploadProgressIntervals.current = {};
  };

  // 触发文件选择对话框
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 移除已上传的文件
  const handleRemoveFile = (fileId: string) => {
    // 查找要删除的文件
    const fileToRemove = attachments.find(file => file.id === fileId);
    
    // 使用 blob 管理器释放引用
    if (fileToRemove?.previewUrl && fileToRemove.previewUrl.startsWith('blob:')) {
      blobManager.releaseBlobUrl(fileId);
    }
    
    setAttachments(prev => prev.filter(file => file.id !== fileId));
    
    // 如果文件正在上传，清除进度模拟
    if (uploadProgressIntervals.current[fileId]) {
      clearInterval(uploadProgressIntervals.current[fileId]);
      delete uploadProgressIntervals.current[fileId];
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);

    try {
      const files = Array.from(e.target.files);

      // 先创建临时文件对象，用于显示上传进度
      const tempFiles: ExtendedFileInfo[] = files.map((file: File) => ({
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        isUploading: true,
        uploadProgress: 0,
      }));

      // 添加临时文件到附件列表
      setAttachments((prev) => [...prev, ...tempFiles]);

      // 为每个文件处理预览和上传
      const filePromises = files.map(async (file: File, index: number) => {
        const tempId = tempFiles[index].id;

        // 创建预览
        const previewUrl = await createFilePreview(file, tempId);

        // 更新临时文件的预览
        setAttachments((prev) =>
          prev.map((item) => (item.id === tempId ? { ...item, previewUrl } : item))
        );

        // 模拟上传进度
        const progressInterval = simulateUploadProgress(
          tempId,
          (progress) => {
            setAttachments((prev) =>
              prev.map((item) =>
                item.id === tempId ? { ...item, uploadProgress: progress } : item
              )
            );
          },
          () => {}
        );

        try {
          // 上传到服务器
          const uploadedFile = await uploadFile(file, agentId);

          // 清除进度模拟
          clearInterval(progressInterval);
          delete uploadProgressIntervals.current[tempId];

          // 返回合并后的文件信息
          return {
            ...uploadedFile,
            previewUrl: previewUrl || undefined,
            isUploading: false,
            uploadProgress: 100,
          };
        } catch (error) {
          // 清除进度模拟
          clearInterval(progressInterval);
          delete uploadProgressIntervals.current[tempId];
          throw error;
        }
      });

      // 等待所有文件上传完成
      const processedFiles = await Promise.all(filePromises);

      // 替换临时文件为实际上传的文件
      setAttachments((prev) =>
        prev.filter((file) => !file.id.startsWith('temp_')).concat(processedFiles)
      );
    } catch (error) {
      console.error('文件上传失败:', error);
      // 显示错误提示
      alert('文件上传失败，请重试');

      // 移除所有临时文件
      setAttachments((prev) => prev.filter((file) => !file.id.startsWith('temp_')));
    } finally {
      setIsUploading(false);
      // 清空文件输入，允许重新上传相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 创建上传进度条的数据，而不是直接返回JSX
  const getUploadProgressData = (progress: number = 0) => {
    return {
      progress
    };
  };

  // 清除所有附件（但不立即释放blob URL）
  const clearAttachments = () => {
    // 减少blob引用计数，但不立即释放（因为消息中可能还在使用）
    attachments.forEach(file => {
      if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
        blobManager.releaseBlobUrl(file.id);
      }
    });
    
    clearAllProgressIntervals();
    setAttachments([]);
  };

  // 获取已准备好的附件（过滤掉仍在上传的文件）
  const getReadyAttachments = () => {
    return attachments.filter(file => !file.isUploading);
  };

  // 检查是否有文件正在上传
  const hasUploadingFiles = () => {
    return attachments.some(file => file.isUploading);
  };

  // 组件卸载时清理资源
  const cleanup = () => {
    // 减少所有blob引用计数
    attachments.forEach(file => {
      if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
        blobManager.releaseBlobUrl(file.id);
      }
    });
    
    clearAllProgressIntervals();
  };

  return {
    attachments,
    isUploading,
    fileInputRef,
    handleAttachClick,
    handleRemoveFile,
    handleFileUpload,
    getUploadProgressData,
    clearAttachments,
    getReadyAttachments,
    hasUploadingFiles,
    cleanup
  };
};

export default useFileUpload; 