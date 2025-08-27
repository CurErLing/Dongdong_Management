type LogItem = {
  id: string;
  ts: string; // ISO string
  actor: string; // 用户名或ID
  action: string; // 动作名
  detail?: string; // 详情
  target?: string; // 操作目标（如角色ID、用户ID等）
  changes?: Record<string, { from: any; to: any }>; // 具体字段变化
  metadata?: Record<string, any>; // 额外元数据
};

const storageKey = 'admin_action_logs_v1';

export const appendLog = (
  action: string, 
  detail?: string, 
  target?: string, 
  changes?: Record<string, { from: any; to: any }>,
  metadata?: Record<string, any>
) => {
  try {
    const v = localStorage.getItem(storageKey);
    const arr: LogItem[] = v ? JSON.parse(v) : [];
    const logItem: LogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      ts: new Date().toISOString(),
      actor: 'admin',
      action,
      detail,
      target,
      changes,
      metadata
    };
    arr.unshift(logItem);
    localStorage.setItem(storageKey, JSON.stringify(arr.slice(0, 500)));
  } catch (error) {
    console.error('Failed to append log:', error);
  }
};

// 辅助函数：比较两个对象并生成变化记录
export const generateChanges = (oldData: any, newData: any, fields: string[]): Record<string, { from: any; to: any }> => {
  const changes: Record<string, { from: any; to: any }> = {};
  
  fields.forEach(field => {
    const oldValue = oldData?.[field];
    const newValue = newData?.[field];
    
    if (oldValue !== newValue) {
      changes[field] = { from: oldValue, to: newValue };
    }
  });
  
  return changes;
};

// 辅助函数：记录用户操作
export const logUserAction = (action: string, target: string, changes?: Record<string, { from: any; to: any }>, metadata?: Record<string, any>) => {
  appendLog(action, undefined, target, changes, metadata);
};

// 辅助函数：记录资源操作
export const logResourceAction = (action: string, roleName: string, resourceType: string, resourceName: string, changes?: Record<string, { from: any; to: any }>, metadata?: Record<string, any>) => {
  const detail = `${roleName} · ${resourceType} · ${resourceName}`;
  appendLog(action, detail, undefined, changes, metadata);
};
