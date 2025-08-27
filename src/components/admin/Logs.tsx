import React, { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

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

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>(() => {
    const v = localStorage.getItem(storageKey);
    return v ? JSON.parse(v) : [];
  });
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter(l =>
      l.actor.toLowerCase().includes(query) ||
      l.action.toLowerCase().includes(query) ||
      (l.detail || '').toLowerCase().includes(query)
    );
  }, [q, logs]);

  const clearLogs = () => {
    if (!confirm('确定清空所有日志吗？')) return;
    localStorage.setItem(storageKey, JSON.stringify([]));
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">操作日志</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">搜索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索用户、动作或详情"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <div className="flex items-end justify-end">
          <button onClick={clearLogs} className="inline-flex items-center px-3 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">
            <Trash2 size={16} className="mr-1" /> 清空日志
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map(l => (
          <div key={l.id} className="p-4 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div className="text-gray-500">{new Date(l.ts).toLocaleString()}</div>
              <div className="font-medium">{l.actor}</div>
              <div className="font-medium text-blue-600">{l.action}</div>
              <div className="text-gray-600 dark:text-gray-300">{l.target || '-'}</div>
            </div>
            {l.detail && (
              <div className="text-sm text-gray-600 dark:text-gray-300">{l.detail}</div>
            )}
            {l.changes && Object.keys(l.changes).length > 0 && (
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">字段变化：</div>
                <div className="space-y-1">
                  {Object.entries(l.changes).map(([field, change]) => (
                    <div key={field} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-600 dark:text-gray-400">{field}:</span>
                      <span className="text-red-600 dark:text-red-400 line-through">{String(change.from || '空')}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 dark:text-green-400">{String(change.to || '空')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {l.metadata && Object.keys(l.metadata).length > 0 && (
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">详细信息：</div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(l.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">暂无日志</div>
        )}
      </div>
    </div>
  );
};


