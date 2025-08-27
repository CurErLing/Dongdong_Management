import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { logResourceAction } from '../../utils/logger';

// 直接复用 RoleManager 的本地存储结构与键值
const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';

import type { Role, ResourceItem, RoleResourcesStore } from '../../types';

const selectedRoleKey = 'upload_center_selected_role';
const selectedTabKey = 'upload_center_selected_tab';

export const UploadCenter: React.FC = () => {
  // 角色列表与选择
  const [roles] = useState<Role[]>(() => {
    const v = localStorage.getItem(storageKey);
    return v ? JSON.parse(v) : [];
  });
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => {
    const saved = localStorage.getItem(selectedRoleKey);
    return saved || '';
  });

  // 资源存储
  const [roleResources, setRoleResources] = useState<RoleResourcesStore>(() => {
    const v = localStorage.getItem(roleResKey);
    const data = v ? JSON.parse(v) : {};
    console.log('文件上传：从localStorage读取资源数据', data);
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

  const [activeTab, setActiveTab] = useState<'eat' | 'gift' | 'travel' | 'standby' | 'moments'>(() => {
    const saved = localStorage.getItem(selectedTabKey) as any;
    return (saved === 'eat' || saved === 'gift' || saved === 'travel' || saved === 'standby' || saved === 'moments') ? saved : 'eat';
  });

  const [form, setForm] = useState<{ name: string; dialogue?: string; timeDetail?: string }>({ name: '', dialogue: '', timeDetail: '' });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [standbyType, setStandbyType] = useState<'long' | 'short' | 'moyu'>('long');
  const [errors, setErrors] = useState<{ name?: string; video?: string }>({});
  
  // 旅行资源的三个视频文件
  const [travelVideo1, setTravelVideo1] = useState<File | null>(null);
  const [travelVideo2, setTravelVideo2] = useState<File | null>(null);
  const [travelVideo3, setTravelVideo3] = useState<File | null>(null);

  // 监听 localStorage 变化，同步资源数据
  useEffect(() => {
    const handleStorageChange = () => {
      const v = localStorage.getItem(roleResKey);
      const data = v ? JSON.parse(v) : {};
      console.log('文件上传：检测到localStorage变化，更新资源数据', data);
      setRoleResources(data);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 初始化角色选择
  useEffect(() => {
    console.log('文件上传：角色列表', roles, '当前选中角色:', selectedRoleId);
    if (roles.length > 0) {
      // 如果当前选中的角色不存在于角色列表中，或者没有选中角色，则设置默认角色
      const currentRoleExists = roles.some(r => r.id === selectedRoleId);
      if (!currentRoleExists) {
        const saved = localStorage.getItem(selectedRoleKey);
        const defaultRoleId = saved || roles[0]?.id || '';
        console.log('文件上传：设置默认角色', defaultRoleId);
        if (defaultRoleId && roles.some(r => r.id === defaultRoleId)) {
          setSelectedRoleId(defaultRoleId);
        } else if (roles[0]?.id) {
          setSelectedRoleId(roles[0].id);
        }
      }
    }
  }, [roles]);

  // Persist selections
  useEffect(() => {
    if (selectedRoleId) {
      console.log('文件上传：保存选中的角色', selectedRoleId);
      localStorage.setItem(selectedRoleKey, selectedRoleId);
    }
  }, [selectedRoleId]);
  useEffect(() => {
    console.log('文件上传：页签变化', activeTab);
    localStorage.setItem(selectedTabKey, activeTab);
  }, [activeTab]);

  // Reset inputs when role/tab change to avoid误操作
  useEffect(() => {
    setForm({ name: '', dialogue: '', timeDetail: '' });
    setVideoFile(null);
    setIconFile(null);
    setCoverFile(null);
    setStandbyType('long');
    setErrors({});
    setTravelVideo1(null);
    setTravelVideo2(null);
    setTravelVideo3(null);
  }, [selectedRoleId, activeTab]);

  const onSave = () => {
    if (!selectedRoleId || !form.name.trim()) return;
    console.log('保存资源到角色:', selectedRoleId, '页签:', activeTab, '资源名称:', form.name.trim());
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = '请输入名称';
    if (activeTab === 'standby' && !videoFile) nextErrors.video = '待机资源需上传视频';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const roleRes = ensureRoleRes(selectedRoleId);
    console.log('当前角色资源:', roleRes);
    const item: ResourceItem = { id: `${Date.now()}`, name: form.name.trim() };

    if (['eat', 'gift', 'travel', 'moments'].includes(activeTab)) {
      item.dialogue = form.dialogue?.trim();
      item.timeDetail = form.timeDetail || undefined;
      if (videoFile) item.videoUrl = URL.createObjectURL(videoFile);
      if (coverFile) item.coverUrl = URL.createObjectURL(coverFile);
      if (iconFile && (activeTab === 'eat' || activeTab === 'gift')) item.iconUrl = URL.createObjectURL(iconFile);
      
      // 旅行资源的三个视频
      if (activeTab === 'travel') {
        if (travelVideo1) item.travelVideo1 = URL.createObjectURL(travelVideo1);
        if (travelVideo2) item.travelVideo2 = URL.createObjectURL(travelVideo2);
        if (travelVideo3) item.travelVideo3 = URL.createObjectURL(travelVideo3);
      }
    }
    if (activeTab === 'standby') {
      item.standbyType = standbyType;
      if (videoFile) item.videoUrl = URL.createObjectURL(videoFile);
    }

    const next: RoleResourcesStore = {
      ...roleResources,
      [selectedRoleId]: {
        ...roleRes,
        [activeTab]: (roleRes as any)[activeTab].concat(item)
      }
    } as RoleResourcesStore;
    console.log('保存后的资源数据:', next);
    persistRes(next);
    
    const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
    const resourceTypeMap = { eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any;
    const resourceType = resourceTypeMap[activeTab];
    
    logResourceAction('新增资源', roleName, resourceType, item.name, undefined, {
      roleId: selectedRoleId,
      resourceId: item.id,
      hasVideo: !!item.videoUrl,
      hasIcon: !!item.iconUrl,
      hasCover: !!item.coverUrl,
      hasDialogue: !!item.dialogue,
      timeDetail: item.timeDetail,
      standbyType: item.standbyType,
      // 旅行视频信息
      hasTravelVideo1: !!item.travelVideo1,
      hasTravelVideo2: !!item.travelVideo2,
      hasTravelVideo3: !!item.travelVideo3
    });

    // reset
    setForm({ name: '', dialogue: '', timeDetail: '' });
    setVideoFile(null);
    setIconFile(null);
    setCoverFile(null);
    setStandbyType('long');
    setTravelVideo1(null);
    setTravelVideo2(null);
    setTravelVideo3(null);
  };

  const currentList: ResourceItem[] = useMemo(() => {
    console.log('计算currentList - selectedRoleId:', selectedRoleId, 'activeTab:', activeTab, 'roleResources:', roleResources);
    if (!selectedRoleId) {
      console.log('没有选择角色');
      return [];
    }
    const r = roleResources[selectedRoleId];
    if (!r) {
      console.log('角色资源不存在:', selectedRoleId);
      return [];
    }
    const list = (r as any)[activeTab] || [];
    console.log('当前资源列表:', selectedRoleId, activeTab, list);
    return list;
  }, [roleResources, selectedRoleId, activeTab]);

  const canSave = selectedRoleId && form.name.trim() && !(activeTab === 'standby' && !videoFile);

  // 展开/折叠已添加资源
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleItem = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // 删除资源
  const deleteResource = (resourceId: string) => {
    if (!selectedRoleId || !confirm('确定删除该资源吗？')) return;
    const roleRes = ensureRoleRes(selectedRoleId);
    const arr: ResourceItem[] = (roleRes as any)[activeTab] || [];
    const nextArr = arr.filter(item => item.id !== resourceId);
    const next: RoleResourcesStore = { ...roleResources, [selectedRoleId]: { ...roleRes, [activeTab]: nextArr } } as RoleResourcesStore;
    persistRes(next);
    
    const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
    const resourceTypeMap = { eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any;
    const resourceType = resourceTypeMap[activeTab];
    const deletedResource = arr.find(item => item.id === resourceId);
    
    logResourceAction('删除资源', roleName, resourceType, deletedResource?.name || '', undefined, {
      roleId: selectedRoleId,
      resourceId,
      deletedResource: deletedResource
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">文件上传中心</h2>
      </div>

      {/* 角色选择 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* 上传表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            placeholder="资源名称"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          />
          {['eat','gift','travel','moments'].includes(activeTab) ? (
            <input
              type="datetime-local"
              value={form.timeDetail || ''}
              onChange={e => setForm(s => ({ ...s, timeDetail: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
            />
          ) : (
            <div />
          )}
        </div>
        {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}

        {['eat','gift','travel','moments'].includes(activeTab) && (
          <div className="space-y-3">
            {activeTab === 'travel' ? (
              // 旅行资源的三个视频上传
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2">
                    <span className="w-20 text-sm text-gray-600 dark:text-gray-300">视频1</span>
                    <input type="file" accept="video/*" onChange={e => setTravelVideo1(e.target.files?.[0] || null)} className="text-sm" />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-20 text-sm text-gray-600 dark:text-gray-300">视频2</span>
                    <input type="file" accept="video/*" onChange={e => setTravelVideo2(e.target.files?.[0] || null)} className="text-sm" />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-20 text-sm text-gray-600 dark:text-gray-300">视频3</span>
                    <input type="file" accept="video/*" onChange={e => setTravelVideo3(e.target.files?.[0] || null)} className="text-sm" />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <span className="w-20 text-sm text-gray-600 dark:text-gray-300">展示图上传</span>
                    <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="text-sm" />
                  </label>
                  <div />
                </div>
              </div>
            ) : (
              // 其他资源的视频上传
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">视频上传</span>
                  <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="text-sm" />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">展示图上传</span>
                  <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="text-sm" />
                </label>
              </div>
            )}
            {['eat','gift'].includes(activeTab) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">图标上传</span>
                  <input type="file" accept="image/*" onChange={e => setIconFile(e.target.files?.[0] || null)} className="text-sm" />
                </label>
                <div />
              </div>
            )}
            <div>
              <textarea
                value={form.dialogue || ''}
                onChange={e => setForm(s => ({ ...s, dialogue: e.target.value }))}
                placeholder={activeTab === 'moments' ? '文案（可选）' : '对白（可选）'}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'standby' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-600 dark:text-gray-300">待机类型</span>
              <select
                value={standbyType}
                onChange={e => setStandbyType(e.target.value as 'long' | 'short' | 'moyu')}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="long">长待机</option>
                <option value="short">短待机</option>
                <option value="moyu">摸鱼待机</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-600 dark:text-gray-300">视频上传</span>
              <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="text-sm" />
            </label>
            {errors.video && <div className="text-xs text-red-600 md:col-span-3">{errors.video}</div>}
          </div>
        )}



        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={!canSave}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white ${!canSave ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            上传资源
          </button>
          {activeTab === 'standby' && (
            <span className="text-xs text-gray-500">提示：待机资源需选择视频后才能保存</span>
          )}
        </div>
      </div>

      {/* 最近添加列表预览 */}
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
          {currentList.map(item => {
            const isOpen = !!expanded[item.id];
            return (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
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
                    <span className="text-xs text-gray-500 ml-3">{isOpen ? '收起' : '展开'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteResource(item.id);
                    }}
                    className="ml-3 p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="删除资源"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isOpen && (item.iconUrl || item.coverUrl || item.videoUrl || item.travelVideo1 || item.travelVideo2 || item.travelVideo3) && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                    {/* 图标 (非旅行资源) */}
                    {activeTab !== 'travel' && item.iconUrl && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">图标</p>
                        <img src={item.iconUrl} alt="icon" className="w-[30%] h-60 object-cover rounded border border-gray-200 dark:border-gray-700" />
                      </div>
                    )}
                    
                    {/* 展示图 */}
                    {item.coverUrl && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">展示图</p>
                        <img src={item.coverUrl} alt="cover" className="w-[30%] h-60 object-cover rounded border border-gray-200 dark:border-gray-700" />
                      </div>
                    )}
                    
                    {/* 视频1 */}
                    {activeTab === 'travel' && item.travelVideo1 ? (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">视频1</p>
                        <video src={item.travelVideo1} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                      </div>
                    ) : item.videoUrl ? (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">视频</p>
                        <video src={item.videoUrl} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                      </div>
                    ) : null}
                    
                    {/* 视频2 (仅旅行资源) */}
                    {activeTab === 'travel' && item.travelVideo2 && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">视频2</p>
                        <video src={item.travelVideo2} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                      </div>
                    )}
                    
                    {/* 视频3 (仅旅行资源) */}
                    {activeTab === 'travel' && item.travelVideo3 && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">视频3</p>
                        <video src={item.travelVideo3} controls className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {currentList.length === 0 && (
            <div className="p-6 text-center text-gray-500">暂无资源</div>
          )}
        </div>
      </div>
    </div>
  );
};


