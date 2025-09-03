import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Search } from 'lucide-react';
import { appendLog } from '../../utils/logger';
import { fileToBase64, preprocessFile } from '../../utils/fileStorage';
import { storeRoleResourcesHybrid } from '../../utils/hybridStorage';
import { dbManager, checkIndexedDBStatus } from '../../utils/indexedDBStorage';
import { getFileChunked, initChunkedStorage, getStorageStatsChunked } from '../../utils/chunkedStorage';
import type { Role, ResourceItem, RoleResourcesStore } from '../../types';

const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';

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

  // 从混合存储获取角色资源
  const fetchRoleResources = async (roleId: string) => {
    try {
      // 检查IndexedDB状态
      const status = await checkIndexedDBStatus();
      console.log('ResourceManager IndexedDB状态:', status);
      
      if (!status.isInitialized) {
        console.error('ResourceManager IndexedDB未正确初始化:', status.error);
        return;
      }

      // 强制使用IndexedDB获取数据
      const result = await dbManager.get('roleResources', roleId);
      console.log('ResourceManager 获取到的角色资源:', result);
      const resources = (result as any)?.resources;
      if (resources) {
        setRoleResources(prev => ({
          ...prev,
          [roleId]: resources
        }));
      }
    } catch (error) {
      console.error('ResourceManager 从IndexedDB获取角色资源失败:', error);
    }
  };

  // 当选择角色变化时，从混合存储获取数据
  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleResources(selectedRoleId);
    }
  }, [selectedRoleId]);

  // 获取文件内容用于显示
  const getFileContent = async (fileId: string): Promise<string | null> => {
    try {
      console.log('ResourceManager: 正在获取文件内容:', fileId);
      
      // 尝试从分片存储获取
      const chunkedResult = await getFileChunked(fileId);
      if (chunkedResult) {
        console.log('ResourceManager: 从分片存储获取文件成功:', chunkedResult.metadata.fileName);
        return chunkedResult.data;
      }
      
      // 如果分片存储没有，尝试从IndexedDB获取
      const status = await checkIndexedDBStatus();
      console.log('ResourceManager IndexedDB状态:', status);
      
      if (!status.isInitialized) {
        console.error('ResourceManager IndexedDB未正确初始化:', status.error);
        return null;
      }
      
      // 强制使用IndexedDB获取文件
      const fileRecord = await dbManager.get('files', fileId);
      console.log('ResourceManager: 获取到的文件记录:', fileRecord);
      
      if (!fileRecord) {
        console.log('ResourceManager: 文件记录不存在:', fileId);
        return null;
      }
      
      if (!(fileRecord as any).data) {
        console.log('ResourceManager: 文件记录中没有数据字段:', fileRecord);
        return null;
      }
      
      const data = (fileRecord as any).data;
      console.log('ResourceManager: 文件数据长度:', typeof data === 'string' ? data.length : '非字符串');
      console.log('ResourceManager: 文件数据类型:', typeof data);
      
      if (typeof data !== 'string') {
        console.error('ResourceManager: 文件数据不是字符串类型:', typeof data);
        return null;
      }
      
      if (!data.startsWith('data:')) {
        console.error('ResourceManager: 文件数据不是有效的Base64格式');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('ResourceManager: 获取文件内容失败:', error);
      return null;
    }
  };

  // 文件显示组件
  const FileDisplay: React.FC<{ fileId: string; type: 'image' | 'video'; alt?: string; className?: string }> = ({ 
    fileId, 
    type, 
    alt = '文件', 
    className 
  }) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadFile = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log(`ResourceManager FileDisplay: 开始加载文件 ${fileId}`);
          const content = await getFileContent(fileId);
          
          if (content) {
            console.log(`ResourceManager FileDisplay: 文件 ${fileId} 加载成功`);
            setFileUrl(content);
          } else {
            console.error(`ResourceManager FileDisplay: 文件 ${fileId} 加载失败 - 内容为空`);
            setError('文件内容为空');
          }
        } catch (error) {
          console.error(`ResourceManager FileDisplay: 文件 ${fileId} 加载失败:`, error);
          setError(error instanceof Error ? error.message : '加载失败');
        } finally {
          setIsLoading(false);
        }
      };

      if (fileId) {
        loadFile();
      } else {
        setIsLoading(false);
        setError('文件ID无效');
      }
    }, [fileId]);

    if (isLoading) {
      return (
        <div className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center`}>
          <span className="text-xs text-gray-500">加载中...</span>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className={`${className} bg-red-100 dark:bg-red-900/20 text-red-600 text-center flex flex-col items-center justify-center p-2`}>
          <span className="text-xs">文件加载失败</span>
          <span className="text-xs mt-1">{error || '未知错误'}</span>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <img 
          src={fileUrl} 
          alt={alt} 
          className={className}
          onError={() => setError('图片加载失败')}
        />
      );
    } else {
      return (
        <video 
          src={fileUrl} 
          controls 
          className={className}
          onError={() => setError('视频加载失败')}
        />
      );
    }
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
  const [editStandbyType, setEditStandbyType] = useState<'long' | 'short' | 'moyu'>('long');
  
  const startEdit = (item: ResourceItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, note: item.note || '', dialogue: item.dialogue || '', timeDetail: item.timeDetail || '' });
    setEditStandbyType(item.standbyType || 'long');
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
  const saveEdit = async () => {
    if (!editingId || !selectedRoleId) return;
    
    try {
      const r = ensureRoleRes(selectedRoleId);
      const arr: ResourceItem[] = (r as any)[activeTab] || [];
      const nextArr = arr.map(async it => {
        if (it.id !== editingId) return it;
        
        const updated: ResourceItem = { 
          ...it, 
          name: editForm.name.trim(), 
          note: (editForm.note || '').trim(), 
          dialogue: (editForm.dialogue || '').trim(), 
          timeDetail: editForm.timeDetail || undefined 
        };
        
        // 处理待机类型
        if (activeTab === 'standby') {
          updated.standbyType = editStandbyType;
        }
        
        // 处理编辑的视频文件
        if (editVideoFile) {
          const processedVideoFile = await preprocessFile(editVideoFile, 'video');
          updated.videoUrl = await fileToBase64(processedVideoFile);
        }
        
        // 处理编辑的封面文件
        if (editCoverFile) {
          const processedCoverFile = await preprocessFile(editCoverFile, 'image');
          updated.coverUrl = await fileToBase64(processedCoverFile);
        }
        
        // 处理编辑的图标文件
        if (editIconFile) {
          const processedIconFile = await preprocessFile(editIconFile, 'image');
          updated.iconUrl = await fileToBase64(processedIconFile);
        }
        
        // 处理编辑的旅行视频文件
        if (activeTab === 'travel') {
          if (editTravelVideo1) {
            const processedTravelVideo1 = await preprocessFile(editTravelVideo1, 'video');
            updated.travelVideo1 = await fileToBase64(processedTravelVideo1);
          }
          if (editTravelVideo2) {
            const processedTravelVideo2 = await preprocessFile(editTravelVideo2, 'video');
            updated.travelVideo2 = await fileToBase64(processedTravelVideo2);
          }
          if (editTravelVideo3) {
            const processedTravelVideo3 = await preprocessFile(editTravelVideo3, 'video');
            updated.travelVideo3 = await fileToBase64(processedTravelVideo3);
          }
        }
        
        return updated;
      });
      
      const resolvedNextArr = await Promise.all(nextArr);
      
      // 使用混合存储保存更新后的资源
      const nextResources = {
        ...r,
        [activeTab]: resolvedNextArr
      };
      
      await storeRoleResourcesHybrid(selectedRoleId, nextResources);
      
      // 更新本地状态
      setRoleResources(prev => ({
        ...prev,
        [selectedRoleId]: nextResources
      }));
      
      appendLog('修改资源', `${(roles.find(r => r.id === selectedRoleId)?.name) || ''} · ${(
        { eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any
      )[activeTab]} · ${editForm.name}`);
      
      setEditingId(null);
      
    } catch (error) {
      console.error('编辑资源失败:', error);
      alert(`编辑失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除资源
  const deleteResource = async (item: ResourceItem) => {
    if (!selectedRoleId) return;
    if (!confirm(`确定要删除资源"${item.name}"吗？此操作不可撤销！`)) return;
    
    try {
      const r = ensureRoleRes(selectedRoleId);
      const arr: ResourceItem[] = (r as any)[activeTab] || [];
      const nextArr = arr.filter(it => it.id !== item.id);
      
      // 使用混合存储保存更新后的资源
      const nextResources = {
        ...r,
        [activeTab]: nextArr
      };
      
      await storeRoleResourcesHybrid(selectedRoleId, nextResources);
      
      // 更新本地状态
      setRoleResources(prev => ({
        ...prev,
        [selectedRoleId]: nextResources
      }));
      
      const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
      const resourceType = ({ eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any)[activeTab];
      appendLog('删除资源', `${roleName} · ${resourceType} · ${item.name}`);
      
      // 如果正在编辑被删除的资源，取消编辑状态
      if (editingId === item.id) {
        setEditingId(null);
      }
    } catch (error) {
      console.error('删除资源失败:', error);
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const debugChunkedStorage = async () => {
    try {
      await initChunkedStorage();
      console.log('Chunked Storage initialized successfully.');
      const stats = await getStorageStatsChunked();
      console.log('Chunked Storage stats:', stats);
      alert('Chunked Storage Debug: Initialized and stats listed.');
    } catch (error) {
      console.error('Chunked Storage Debug Error:', error);
      alert(`Chunked Storage Debug Error: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">资源管理（读取现有配置）</h2>
        <button
          onClick={() => debugChunkedStorage()}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          调试存储
        </button>
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
                        <div className="space-y-4">
                          {/* 基本信息编辑 */}
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
                            {/* 待机类型选择器 */}
                            {activeTab === 'standby' && (
                              <select
                                value={editStandbyType}
                                onChange={e => setEditStandbyType(e.target.value as 'long' | 'short' | 'moyu')}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                              >
                                <option value="long">长待机</option>
                                <option value="short">短待机</option>
                                <option value="moyu">摸鱼待机</option>
                              </select>
                            )}
                          </div>
                          
                          {/* 对白/文案编辑 */}
                          <div>
                            <textarea
                              value={editForm.dialogue || ''}
                              onChange={e => setEditForm(s => ({ ...s, dialogue: e.target.value }))}
                              placeholder={activeTab === 'moments' ? '文案' : '对白'}
                              rows={3}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                            />
                          </div>

                          {/* 文件上传编辑 */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">文件编辑</h4>
                            
                            {/* 图标上传 (非旅行资源) */}
                            {['eat', 'gift'].includes(activeTab) && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">图标:</label>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={e => setEditIconFile(e.target.files?.[0] || null)} 
                                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                />
                                {editIconFile && <span className="text-xs text-green-600">已选择: {editIconFile.name}</span>}
                              </div>
                            )}
                            
                            {/* 视频上传 */}
                            {activeTab !== 'travel' && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">视频:</label>
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  onChange={e => setEditVideoFile(e.target.files?.[0] || null)} 
                                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                />
                                {editVideoFile && <span className="text-xs text-green-600">已选择: {editVideoFile.name}</span>}
                              </div>
                            )}
                            
                            {/* 旅行资源的三个视频 */}
                            {activeTab === 'travel' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">视频1:</label>
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={e => setEditTravelVideo1(e.target.files?.[0] || null)} 
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                  />
                                  {editTravelVideo1 && <span className="text-xs text-green-600">已选择: {editTravelVideo1.name}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">视频2:</label>
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={e => setEditTravelVideo2(e.target.files?.[0] || null)} 
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                  />
                                  {editTravelVideo2 && <span className="text-xs text-green-600">已选择: {editTravelVideo2.name}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">视频3:</label>
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={e => setEditTravelVideo3(e.target.files?.[0] || null)} 
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                  />
                                  {editTravelVideo3 && <span className="text-xs text-green-600">已选择: {editTravelVideo3.name}</span>}
                                </div>
                              </div>
                            )}
                            
                            {/* 封面图片上传 */}
                            {['eat', 'gift', 'travel', 'moments'].includes(activeTab) && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">封面:</label>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={e => setEditCoverFile(e.target.files?.[0] || null)} 
                                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                />
                                {editCoverFile && <span className="text-xs text-green-600">已选择: {editCoverFile.name}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      {/* 图标 (非旅行资源) - 调整为小图标尺寸 */}
                      {activeTab !== 'travel' && item.iconUrl && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">图标</p>
                            {editingId === item.id && (
                              <input type="file" accept="image/*" onChange={e => setEditIconFile(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <FileDisplay
                            fileId={item.iconUrl}
                            type="image"
                            alt="icon"
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                          />
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
                          <FileDisplay
                            fileId={item.coverUrl}
                            type="image"
                            alt="cover"
                            className="w-[30%] h-60 object-cover rounded border border-gray-200 dark:border-gray-700"
                          />
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
                          <FileDisplay
                            fileId={item.travelVideo1}
                            type="video"
                            alt="video1"
                            className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                          />
                        </div>
                      ) : item.videoUrl ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs mb-1 text-gray-500">视频</p>
                            {editingId === item.id && (
                              <input type="file" accept="video/*" onChange={e => setEditVideoFile(e.target.files?.[0] || null)} className="text-xs" />
                            )}
                          </div>
                          <FileDisplay
                            fileId={item.videoUrl}
                            type="video"
                            alt="video"
                            className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                          />
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
                          <FileDisplay
                            fileId={item.travelVideo2}
                            type="video"
                            alt="video2"
                            className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                          />
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
                          <FileDisplay
                            fileId={item.travelVideo3}
                            type="video"
                            alt="video3"
                            className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                          />
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


