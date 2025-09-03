import { willExceedStorage, smartCleanup } from './storageManager';

// 文件存储工具函数

/**
 * 将File对象转换为Base64字符串
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  // 检查存储空间
  if (willExceedStorage(file.size)) {
    // 尝试清理存储空间
    smartCleanup();
    
    if (willExceedStorage(file.size)) {
      throw new Error(`文件过大，无法存储。当前可用空间不足，建议清理一些数据或使用更小的文件。`);
    }
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
  });
};

/**
 * 将多个文件转换为Base64字符串
 */
export const filesToBase64 = async (files: (File | null)[]): Promise<(string | null)[]> => {
  // 计算总文件大小
  const totalSize = files.reduce((total, file) => total + (file?.size || 0), 0);
  
  // 检查存储空间
  if (willExceedStorage(totalSize)) {
    // 尝试清理存储空间
    smartCleanup();
    
    if (willExceedStorage(totalSize)) {
      throw new Error(`文件总大小过大，无法存储。当前可用空间不足，建议清理一些数据或使用更小的文件。`);
    }
  }
  
  const promises = files.map(async (file) => {
    if (!file) return null;
    try {
      return await fileToBase64(file);
    } catch (error) {
      console.error('Error converting file to base64:', error);
      return null;
    }
  });
  
  return Promise.all(promises);
};

/**
 * 检查文件大小是否超过限制
 */
export const checkFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 获取文件类型
 */
export const getFileType = (file: File): 'image' | 'video' | 'unknown' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'unknown';
};

/**
 * 压缩图片文件（如果过大）
 */
export const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 验证文件类型
 */
export const validateFileType = (file: File, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.some(type => file.type.startsWith(type));
};

/**
 * 生成文件预览URL（用于临时显示）
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * 清理预览URL
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * 清理多个预览URL
 */
export const revokePreviewUrls = (urls: string[]): void => {
  urls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

/**
 * 文件存储配置
 */
export const FILE_STORAGE_CONFIG = {
  IMAGE: {
    maxSizeMB: 1, // 进一步降低到1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
    maxWidth: 600, // 降低最大宽度
    quality: 0.6 // 进一步降低质量
  },
  VIDEO: {
    maxSizeMB: 10, // 降低到10MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'] as const,
    maxDuration: 180 // 降低到3分钟
  }
} as const;

/**
 * 处理文件上传前的预处理
 */
export const preprocessFile = async (file: File, type: 'image' | 'video'): Promise<File> => {
  if (type === 'image') {
    const config = FILE_STORAGE_CONFIG.IMAGE;
    
    // 检查文件大小
    if (!checkFileSize(file, config.maxSizeMB)) {
      throw new Error(`图片文件大小不能超过${config.maxSizeMB}MB`);
    }
    
    // 检查文件类型
    if (!validateFileType(file, config.allowedTypes)) {
      throw new Error(`不支持的图片类型: ${file.type}`);
    }
    
    // 压缩图片
    return await compressImage(file, config.maxWidth, config.quality);
  } else {
    const config = FILE_STORAGE_CONFIG.VIDEO;
    
    // 检查文件大小
    if (!checkFileSize(file, config.maxSizeMB)) {
      throw new Error(`视频文件大小不能超过${config.maxSizeMB}MB`);
    }
    
    // 检查文件类型
    if (!validateFileType(file, config.allowedTypes)) {
      throw new Error(`不支持的视频类型: ${file.type}`);
    }
    
    return file;
  }
};

/**
 * 批量处理文件
 */
export const preprocessFiles = async (files: (File | null)[], types: ('image' | 'video')[]): Promise<(File | null)[]> => {
  const promises = files.map(async (file, index) => {
    if (!file) return null;
    const type = types[index] || 'image';
    try {
      return await preprocessFile(file, type);
    } catch (error) {
      console.error('Error preprocessing file:', error);
      return null;
    }
  });
  
  return Promise.all(promises);
};
