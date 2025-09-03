// 存储管理工具

/**
 * 检查localStorage可用空间
 */
export const checkStorageQuota = (): { available: number; used: number; total: number } => {
  try {
    // 尝试存储一个测试字符串来估算可用空间
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(1024); // 1KB测试数据
    
    let available = 0;
    let used = 0;
    
    // 计算已使用的存储空间
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    // 尝试存储测试数据来估算可用空间
    try {
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      available = 5 * 1024 * 1024 - used; // 假设5MB总空间
    } catch (error) {
      available = 0;
    }
    
    return {
      available: Math.max(0, available),
      used,
      total: 5 * 1024 * 1024 // 5MB
    };
  } catch (error) {
    console.error('检查存储空间失败:', error);
    return { available: 0, used: 0, total: 0 };
  }
};

/**
 * 估算Base64数据大小
 */
export const estimateBase64Size = (fileSize: number): number => {
  // Base64编码会增加约33%的大小
  return Math.ceil(fileSize * 1.33);
};

/**
 * 检查文件是否会导致存储超限
 */
export const willExceedStorage = (fileSize: number): boolean => {
  const { available } = checkStorageQuota();
  const estimatedSize = estimateBase64Size(fileSize);
  return estimatedSize > available;
};

/**
 * 清理过期的临时数据
 */
export const cleanupExpiredData = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // 检查并清理过期的数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('temp_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`清理了 ${keysToRemove.length} 个临时数据项`);
    }
  } catch (error) {
    console.error('清理过期数据失败:', error);
  }
};

/**
 * 清理大型数据项
 */
export const cleanupLargeData = (maxSize: number = 1024 * 1024): void => {
  try {
    const items: Array<{ key: string; size: number }> = [];
    
    // 收集所有数据项及其大小
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = key.length + value.length;
          if (size > maxSize) {
            items.push({ key, size });
          }
        }
      }
    }
    
    // 按大小排序，优先清理最大的
    items.sort((a, b) => b.size - a.size);
    
    // 清理最大的几项
    const itemsToRemove = items.slice(0, Math.min(3, items.length));
    itemsToRemove.forEach(item => {
      localStorage.removeItem(item.key);
      console.log(`清理大型数据项: ${item.key} (${Math.round(item.size / 1024)}KB)`);
    });
    
  } catch (error) {
    console.error('清理大型数据失败:', error);
  }
};

/**
 * 获取存储使用统计
 */
export const getStorageStats = (): { 
  totalItems: number; 
  totalSize: number; 
  largestItem: { key: string; size: number } | null;
  recommendations: string[];
} => {
  try {
    const items: Array<{ key: string; size: number }> = [];
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = key.length + value.length;
          items.push({ key, size });
          totalSize += size;
        }
      }
    }
    
    // 按大小排序
    items.sort((a, b) => b.size - a.size);
    
    const largestItem = items[0] || null;
    const recommendations: string[] = [];
    
    if (totalSize > 4 * 1024 * 1024) { // 超过4MB
      recommendations.push('存储空间接近限制，建议清理不必要的数据');
    }
    
    if (largestItem && largestItem.size > 1024 * 1024) { // 超过1MB
      recommendations.push(`发现大型数据项: ${largestItem.key}，建议检查是否需要`);
    }
    
    const base64Items = items.filter(item => 
      item.key.includes('role_resources') && item.size > 100 * 1024
    );
    
    if (base64Items.length > 0) {
      recommendations.push('发现多个大型Base64数据项，建议压缩或清理');
    }
    
    return {
      totalItems: items.length,
      totalSize,
      largestItem,
      recommendations
    };
  } catch (error) {
    console.error('获取存储统计失败:', error);
    return {
      totalItems: 0,
      totalSize: 0,
      largestItem: null,
      recommendations: ['无法获取存储统计信息']
    };
  }
};

/**
 * 智能存储清理
 */
export const smartCleanup = (): { cleaned: number; freedSpace: number } => {
  let cleaned = 0;
  let freedSpace = 0;
  
  try {
    // 1. 清理过期数据
    cleanupExpiredData();
    
    // 2. 清理大型数据项
    const beforeSize = getStorageStats().totalSize;
    cleanupLargeData(512 * 1024); // 清理超过512KB的数据
    const afterSize = getStorageStats().totalSize;
    
    freedSpace = beforeSize - afterSize;
    
    // 3. 如果还是空间不足，清理更多数据
    if (checkStorageQuota().available < 1024 * 1024) { // 少于1MB可用空间
      cleanupLargeData(100 * 1024); // 清理超过100KB的数据
      const finalSize = getStorageStats().totalSize;
      freedSpace = beforeSize - finalSize;
    }
    
    return { cleaned, freedSpace };
  } catch (error) {
    console.error('智能清理失败:', error);
    return { cleaned: 0, freedSpace: 0 };
  }
};

/**
 * 存储警告提示
 */
export const getStorageWarning = (): string | null => {
  const { available, used } = checkStorageQuota();
  const usedPercent = (used / (5 * 1024 * 1024)) * 100;
  
  if (usedPercent > 90) {
    return '存储空间严重不足，建议立即清理数据';
  } else if (usedPercent > 80) {
    return '存储空间不足，建议清理不必要的数据';
  } else if (usedPercent > 70) {
    return '存储空间使用较多，注意管理数据';
  }
  
  return null;
};
