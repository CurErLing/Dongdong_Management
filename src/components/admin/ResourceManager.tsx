import React, { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';

import { appendLog } from '../../utils/logger';
import type { Role, ResourceItem, RoleResourcesStore } from '../../types';

export const ResourceManager: React.FC = () => {
  const [roles] = useState<Role[]>(() => {
    const v = localStorage.getItem(storageKey);
    return v ? JSON.parse(v) : [];
  });
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => roles[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'eat' | 'gift' | 'travel' | 'standby' | 'moments'>('eat');
  const [q, setQ] = useState('');

  const [roleResources, setRoleResources] = useState<RoleResourcesStore>(() => {
    const v = localStorage.getItem(roleResKey);
    const data = v ? JSON.parse(v) : {};
    console.log('资源管理：从localStorage读取的数据', data);
    return data;
  });

  const persistRes = (next: RoleResourcesStore) => {
    setRoleResources(next);
    localStorage.setItem(roleResKey, JSON.stringify(next));
  };

  const ensureRoleRes = (rid: string) => {
    if (roleResources[rid]) return roleResources[rid];
    const next = { ...roleResources, [rid]: { eat: [], gift: [], travel: [], standby: [], moments: [] } };
    persistRes(next);
    return next[rid];
  };

  const list = useMemo(() => {
    if (!selectedRoleId) {
      console.log('资源管理：没有选择角色');
      return [] as ResourceItem[];
    }
    const r = ensureRoleRes(selectedRoleId);
    const arr = (r as any)[activeTab] as ResourceItem[];
    console.log('资源管理：当前资源列表', selectedRoleId, activeTab, arr);
    const query = q.trim().toLowerCase();
    if (!query) return arr;
    return arr.filter(it =>
      it.name.toLowerCase().includes(query) ||
      (it.note || '').toLowerCase().includes(query) ||
      (it.dialogue || '').toLowerCase().includes(query)
    );
  }, [roleResources, selectedRoleId, activeTab, q]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleItem = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // 编辑状态与表单
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; note?: string; dialogue?: string; timeDetail?: string }>({ name: '', note: '', dialogue: '', timeDetail: '' });
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  // 旅行资源的三个视频编辑状态
  const [editTravelVideo1, setEditTravelVideo1] = useState<File | null>(null);
  const [editTravelVideo2, setEditTravelVideo2] = useState<File | null>(null);
  const [editTravelVideo3, setEditTravelVideo3] = useState<File | null>(null);
  const startEdit = (item: ResourceItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, note: item.note || '', dialogue: item.dialogue || '', timeDetail: item.timeDetail || '' });
    setEditVideoFile(null);
    setEditCoverFile(null);
    setEditIconFile(null);
    setEditTravelVideo1(null);
    setEditTravelVideo2(null);
    setEditTravelVideo3(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
  };
  const saveEdit = () => {
    if (!editingId || !selectedRoleId) return;
    const r = ensureRoleRes(selectedRoleId);
    const arr: ResourceItem[] = (r as any)[activeTab] || [];
    const nextArr = arr.map(it => {
      if (it.id !== editingId) return it;
      const updated: ResourceItem = { ...it, name: editForm.name.trim(), note: (editForm.note || '').trim(), dialogue: (editForm.dialogue || '').trim(), timeDetail: editForm.timeDetail || undefined };
      if (editVideoFile) updated.videoUrl = URL.createObjectURL(editVideoFile);
      if (editCoverFile) updated.coverUrl = URL.createObjectURL(editCoverFile);
      if (editIconFile) updated.iconUrl = URL.createObjectURL(editIconFile);
      
      // 旅行资源的三个视频
      if (activeTab === 'travel') {
        if (editTravelVideo1) updated.travelVideo1 = URL.createObjectURL(editTravelVideo1);
        if (editTravelVideo2) updated.travelVideo2 = URL.createObjectURL(editTravelVideo2);
        if (editTravelVideo3) updated.travelVideo3 = URL.createObjectURL(editTravelVideo3);
      }
      return updated;
    });
    const next: RoleResourcesStore = { ...roleResources, [selectedRoleId]: { ...r, [activeTab]: nextArr } } as RoleResourcesStore;
    persistRes(next);
    appendLog('修改资源', `${(roles.find(r => r.id === selectedRoleId)?.name) || ''} · ${(
      { eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any
    )[activeTab]} · ${editForm.name}`);
    setEditingId(null);
  };

  // 删除资源
  const deleteResource = (item: ResourceItem) => {
    if (!selectedRoleId) return;
    if (!confirm(`确定要删除资源"${item.name}"吗？此操作不可撤销！`)) return;
    
    const r = ensureRoleRes(selectedRoleId);
    const arr: ResourceItem[] = (r as any)[activeTab] || [];
    const nextArr = arr.filter(it => it.id !== item.id);
    const next: RoleResourcesStore = { ...roleResources, [selectedRoleId]: { ...r, [activeTab]: nextArr } } as RoleResourcesStore;
    persistRes(next);
    
    const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
    const resourceType = ({ eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any)[activeTab];
    appendLog('删除资源', `${roleName} · ${resourceType} · ${item.name}`);
    
    // 如果正在编辑被删除的资源，取消编辑状态
    if (editingId === item.id) {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">资源管理（读取现有配置）</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">选择角色</label>
          <select
            value={selectedRoleId}
            onChange={e => setSelectedRoleId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">选择页签</label>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as any)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          >
            <option value="eat">吃东西资源</option>
            <option value="gift">送礼物资源</option>
            <option value="travel">旅行资源</option>
            <option value="standby">待机资源</option>
            <option value="moments">朋友圈资源</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">搜索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索名称、备注或对白/文案"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="font-medium">{roles.find(r => r.id === selectedRoleId)?.name || '未选择角色'} · {(
            {
              eat: '吃东西资源',
              gift: '送礼物资源',
              travel: '旅行资源',
              standby: '待机资源',
              moments: '朋友圈资源'
            } as any
          )[activeTab]}</p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {list.map(item => {
            const isOpen = !!expanded[item.id];
            return (
              <div key={item.id} className="p-4 space-y-2">
                <button onClick={() => toggleItem(item.id)} className="w-full flex items-center justify-between text-left">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.note && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.note}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.timeDetail && <span>时间：{item.timeDetail}</span>}
                      {item.standbyType && <span>待机类型：{item.standbyType === 'long' ? '长待机' : item.standbyType === 'short' ? '短待机' : '摸鱼待机'}</span>}
                      {item.dialogue && (
                        <span className="text-blue-600 dark:text-blue-400">
                          {activeTab === 'moments' ? '文案' : '对白'}：{item.dialogue.length > 20 ? item.dialogue.substring(0, 20) + '...' : item.dialogue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {isOpen && editingId === item.id ? (
                      <>
                        <button onClick={saveEdit} className="px-2 py-1 rounded-md text-white text-xs bg-green-600 hover:bg-green-700">保存</button>
                        <button onClick={cancelEdit} className="px-2 py-1 rounded-md text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">取消</button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(item);
                          }} 
                          className="px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => deleteResource(item)} 
                          className="px-2 py-1 rounded-md text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                        <span className="text-xs text-gray-500">{isOpen ? '收起' : '展开'}</span>
                      </>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <>
                    <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-3">
                      {editingId === item.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            value={editForm.name}
                            onChange={e => setEditForm(s => ({ ...s, name: e.target.value }))}
                            placeholder="名称"
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          />
                          <input
                            value={editForm.note || ''}
                            onChange={e => setEditForm(s => ({ ...s, note: e.target.value }))}
                            placeholder="备注"
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          />
                          <input
                            type="datetime-local"
                            value={editForm.timeDetail || ''}
                            onChange={e => setEditForm(s => ({ ...s, timeDetail: e.target.value }))}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          />
                          <div className="md:col-span-4">
                            <textarea
                              value={editForm.dialogue || ''}
                              onChange={e => setEditForm(s => ({ ...s, dialogue: e.target.value }))}
                              placeholder={activeTab === 'moments' ? '文案' : '对白'}
                              rows={3}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                            />
                          </div>
                          <div className="md:col-span-4" />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      {/* 图标 (非旅行资源) */}
                      {activeTab !== 'travel' && item.iconUrl && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">图标</p>
                            {editingId === item.id && (
                              <input type="file" accept="image/*" onChange={e => setEditIconFile(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <img src={item.iconUrl} alt="icon" className="w-[30%] h-60 object-cover rounded border border-gray-200 dark:border-gray-700" />
                        </div>
                      )}
                      
                      {/* 展示图 */}
                      {item.coverUrl && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">展示图</p>
                            {editingId === item.id && (
                              <input type="file" accept="image/*" onChange={e => setEditCoverFile(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <img src={item.coverUrl} alt="cover" className="w-[30%] h-60 object-cover rounded border border-gray-200 dark:border-gray-700" />
                        </div>
                      )}
                      
                      {/* 视频1 */}
                      {activeTab === 'travel' && item.travelVideo1 ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">视频1</p>
                            {editingId === item.id && (
                              <input type="file" accept="video/*" onChange={e => setEditTravelVideo1(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <video src={item.travelVideo1} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                        </div>
                      ) : item.videoUrl ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">视频</p>
                            {editingId === item.id && (
                              <input type="file" accept="video/*" onChange={e => setEditVideoFile(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <video src={item.videoUrl} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                        </div>
                      ) : null}
                      
                      {/* 视频2 (仅旅行资源) */}
                      {activeTab === 'travel' && item.travelVideo2 && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">视频2</p>
                            {editingId === item.id && (
                              <input type="file" accept="video/*" onChange={e => setEditTravelVideo2(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <video src={item.travelVideo2} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                        </div>
                      )}
                      
                      {/* 视频3 (仅旅行资源) */}
                      {activeTab === 'travel' && item.travelVideo3 && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">视频3</p>
                            {editingId === item.id && (
                              <input type="file" accept="video/*" onChange={e => setEditTravelVideo3(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <video src={item.travelVideo3} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="p-6 text-center text-gray-500">暂无资源</div>
          )}
        </div>
      </div>
    </div>
  );
};


