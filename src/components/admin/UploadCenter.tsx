import React, { useState, useMemo, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { logResourceAction } from '../../utils/logger';
import { revokePreviewUrls } from '../../utils/fileStorage';
import { dbManager, checkIndexedDBStatus, storeFile as storeFileIndexed } from '../../utils/indexedDBStorage';
import type { Role, ResourceItem, RoleResourcesStore } from '../../types';

// 直接复用 RoleManager 的本地存储结构与键值
const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';

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

  // 从混合存储获取角色资源
  const fetchRoleResources = async (roleId: string) => {
    try {
      // 检查IndexedDB状态
      const status = await checkIndexedDBStatus();
      console.log('IndexedDB状态:', status);
      
      if (!status.isInitialized) {
        console.error('IndexedDB未正确初始化:', status.error);
        return;
      }

      // 强制使用IndexedDB获取数据
      const result = await dbManager.get('roleResources', roleId);
      console.log('获取到的角色资源:', result);
      const resources = (result as any)?.resources;
      if (resources) {
        setRoleResources(prev => ({
          ...prev,
          [roleId]: resources
        }));
      }
    } catch (error) {
      console.error('从IndexedDB获取角色资源失败:', error);
    }
  };

  // 当选择角色变化时，从混合存储获取数据
  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleResources(selectedRoleId);
    }
  }, [selectedRoleId]);

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

  // 初始化存储系统（仅检查 IndexedDB 状态）
  useEffect(() => {
    const initStorage = async () => {
      try {
        console.log('UploadCenter: 检查 IndexedDB 状态...');
        const status = await checkIndexedDBStatus();
        console.log('UploadCenter: IndexedDB状态:', status);
        
      } catch (error) {
        console.error('UploadCenter: 存储系统初始化失败:', error);
      }
    };
    
    initStorage();
  }, []);

  const onSave = async () => {
    if (!selectedRoleId || !form.name.trim()) return;
    
    const roleRes = ensureRoleRes(selectedRoleId);
    const item: ResourceItem = {
      id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: form.name.trim()
    };

    try {
      // 预处理文件
      let processedVideoFile = null;
      let processedIconFile = null;
      let processedCoverFile = null;
      let processedTravelVideo1 = null;
      let processedTravelVideo2 = null;
      let processedTravelVideo3 = null;

      if (['eat', 'gift', 'travel', 'moments'].includes(activeTab)) {
        item.dialogue = form.dialogue?.trim();
        item.timeDetail = form.timeDetail || undefined;
        
        // 处理视频文件（直接存储原文件数据）
        if (videoFile) {
          processedVideoFile = videoFile;
          const dataBuffer = await processedVideoFile.arrayBuffer();
          const videoId = await storeFileIndexed({
            type: 'video',
            roleId: selectedRoleId,
            resourceType: activeTab,
            fileName: processedVideoFile.name,
            fileSize: processedVideoFile.size,
            data: dataBuffer,
            metadata: { resourceId: item.id, mimeType: processedVideoFile.type }
          });
          item.videoUrl = videoId;
          console.log('UploadCenter: 视频文件存储成功，ID:', videoId, '文件名:', videoFile.name);
        }
        
        // 处理封面文件
        if (coverFile) {
          processedCoverFile = coverFile;
          const dataBuffer = await processedCoverFile.arrayBuffer();
          const coverId = await storeFileIndexed({
            type: 'image',
            roleId: selectedRoleId,
            resourceType: activeTab,
            fileName: processedCoverFile.name,
            fileSize: processedCoverFile.size,
            data: dataBuffer,
            metadata: { resourceId: item.id, mimeType: processedCoverFile.type }
          });
          item.coverUrl = coverId;
          console.log('UploadCenter: 封面文件存储成功，ID:', coverId, '文件名:', coverFile.name);
        }
        
        // 处理图标文件
        if (iconFile && (activeTab === 'eat' || activeTab === 'gift')) {
          processedIconFile = iconFile;
          const dataBuffer = await processedIconFile.arrayBuffer();
          const iconId = await storeFileIndexed({
            type: 'image',
            roleId: selectedRoleId,
            resourceType: activeTab,
            fileName: processedIconFile.name,
            fileSize: processedIconFile.size,
            data: dataBuffer,
            metadata: { resourceId: item.id, mimeType: processedIconFile.type }
          });
          item.iconUrl = iconId;
          console.log('UploadCenter: 图标文件存储成功，ID:', iconId, '文件名:', iconFile.name);
        }
        
        // 处理旅行资源的三个视频
        if (activeTab === 'travel') {
          if (travelVideo1) {
            processedTravelVideo1 = travelVideo1;
            const dataBuffer1 = await processedTravelVideo1.arrayBuffer();
            const video1Id = await storeFileIndexed({
              type: 'video',
              roleId: selectedRoleId,
              resourceType: activeTab,
              fileName: processedTravelVideo1.name,
              fileSize: processedTravelVideo1.size,
              data: dataBuffer1,
              metadata: { resourceId: item.id, videoIndex: 1, mimeType: processedTravelVideo1.type }
            });
            item.travelVideo1 = video1Id;
            console.log('UploadCenter: 旅行视频1存储成功，ID:', video1Id);
          }
          if (travelVideo2) {
            processedTravelVideo2 = travelVideo2;
            const dataBuffer2 = await processedTravelVideo2.arrayBuffer();
            const video2Id = await storeFileIndexed({
              type: 'video',
              roleId: selectedRoleId,
              resourceType: activeTab,
              fileName: processedTravelVideo2.name,
              fileSize: processedTravelVideo2.size,
              data: dataBuffer2,
              metadata: { resourceId: item.id, videoIndex: 2, mimeType: processedTravelVideo2.type }
            });
            item.travelVideo2 = video2Id;
            console.log('UploadCenter: 旅行视频2存储成功，ID:', video2Id);
          }
          if (travelVideo3) {
            processedTravelVideo3 = travelVideo3;
            const dataBuffer3 = await processedTravelVideo3.arrayBuffer();
            const video3Id = await storeFileIndexed({
              type: 'video',
              roleId: selectedRoleId,
              resourceType: activeTab,
              fileName: processedTravelVideo3.name,
              fileSize: processedTravelVideo3.size,
              data: dataBuffer3,
              metadata: { resourceId: item.id, videoIndex: 3, mimeType: processedTravelVideo3.type }
            });
            item.travelVideo3 = video3Id;
            console.log('UploadCenter: 旅行视频3存储成功，ID:', video3Id);
          }
        }
      }
      
      if (activeTab === 'standby') {
        item.standbyType = standbyType;
        if (videoFile) {
          processedVideoFile = videoFile;
          const dataBuffer = await processedVideoFile.arrayBuffer();
          const videoId = await storeFileIndexed({
            type: 'video',
            roleId: selectedRoleId,
            resourceType: activeTab,
            fileName: processedVideoFile.name,
            fileSize: processedVideoFile.size,
            data: dataBuffer,
            metadata: { resourceId: item.id, mimeType: processedVideoFile.type }
          });
          item.videoUrl = videoId;
        }
      }

      // 组装并保存角色资源（IndexedDB）
      const nextResources = {
        ...roleRes,
        [activeTab]: (roleRes as any)[activeTab].concat(item)
      };
      
      console.log('UploadCenter: 准备保存资源，文件ID信息:', {
        videoUrl: item.videoUrl,
        coverUrl: item.coverUrl,
        iconUrl: item.iconUrl,
        travelVideo1: item.travelVideo1,
        travelVideo2: item.travelVideo2,
        travelVideo3: item.travelVideo3
      });
      
      const roleResourceRecord = {
        roleId: selectedRoleId,
        resources: nextResources,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      await dbManager.set('roleResources', roleResourceRecord);

      // 同步内存与 localStorage（保证当前页面列表立即可见）
      setRoleResources(prev => ({
        ...prev,
        [selectedRoleId]: nextResources
      }));
      localStorage.setItem(
        roleResKey,
        JSON.stringify({
          ...roleResources,
          [selectedRoleId]: nextResources
        })
      );
      
      console.log('UploadCenter: 资源保存成功，完整数据:', nextResources);
      console.log('UploadCenter: 保存的资源项:', item);
      
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

      // 清理临时预览URL
      const tempUrls = [videoFile, iconFile, coverFile, travelVideo1, travelVideo2, travelVideo3]
        .filter(Boolean)
        .map(file => URL.createObjectURL(file!));
      revokePreviewUrls(tempUrls);

      // reset
      setForm({ name: '', dialogue: '', timeDetail: '' });
      setVideoFile(null);
      setIconFile(null);
      setCoverFile(null);
      setStandbyType('long');
      setTravelVideo1(null);
      setTravelVideo2(null);
      setTravelVideo3(null);
      
    } catch (error) {
      console.error('保存资源失败:', error);
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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

  // 删除资源（统一写回 IndexedDB）
  const deleteResource = async (resourceId: string) => {
    if (!selectedRoleId || !confirm('确定删除该资源吗？')) return;
    
    try {
      const roleRes = ensureRoleRes(selectedRoleId);
      const arr: ResourceItem[] = (roleRes as any)[activeTab] || [];
      const nextArr = arr.filter(item => item.id !== resourceId);
      
      const nextResources = {
        ...roleRes,
        [activeTab]: nextArr
      };
      // 写回 IndexedDB
      const roleResourceRecord = {
        roleId: selectedRoleId,
        resources: nextResources,
        timestamp: Date.now(),
        version: '1.0'
      };
      await dbManager.set('roleResources', roleResourceRecord);

      // 更新本地状态
      setRoleResources(prev => ({
        ...prev,
        [selectedRoleId]: nextResources
      }));
      
      const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
      const resourceTypeMap = { eat: '吃东西', gift: '送礼物', travel: '旅行', standby: '待机', moments: '朋友圈' } as any;
      const resourceType = resourceTypeMap[activeTab];
      const deletedResource = arr.find(item => item.id !== resourceId);
      
      logResourceAction('删除资源', roleName, resourceType, deletedResource?.name || '', undefined, {
        roleId: selectedRoleId,
        resourceId,
        deletedResource: deletedResource
      });
    } catch (error) {
      console.error('删除资源失败:', error);
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 获取文件内容用于显示（仅使用 IndexedDB，返回 Blob URL）
  const getFileContent = async (fileId: string): Promise<string | null> => {
    try {
      console.log('UploadCenter: 正在获取文件内容:', fileId);
      
      if (!fileId || fileId === '') {
        console.log('UploadCenter: 文件ID为空');
        return null;
      }
      
      // 直接从 IndexedDB 获取
      const status = await checkIndexedDBStatus();
      console.log('UploadCenter IndexedDB状态:', status);
      
      if (!status.isInitialized) {
        console.error('UploadCenter IndexedDB未正确初始化:', status.error);
        return null;
      }
      
      // 获取文件
      const fileRecord = await dbManager.get('files', fileId);
      console.log('UploadCenter: 获取到的文件记录:', fileRecord);
      
      if (!fileRecord) {
        console.log('UploadCenter: 文件记录不存在:', fileId);
        return null;
      }
      
      if (!(fileRecord as any).data) {
        console.log('UploadCenter: 文件记录中没有数据字段:', fileRecord);
        return null;
      }
      
      const record: any = fileRecord as any;
      const data = record.data as string | ArrayBuffer;
      const mimeType = record.metadata?.mimeType || record.type === 'image' ? 'image/*' : record.type === 'video' ? 'video/*' : 'application/octet-stream';

      if (data instanceof ArrayBuffer) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log('UploadCenter: 从IndexedDB获取文件成功（ArrayBuffer→Blob URL）');
        return url;
      }

      // 兼容旧数据（Base64 Data URL）
      if (typeof data === 'string') {
        return data;
      }

      return null;
    } catch (error) {
      console.error('UploadCenter: 获取文件内容失败:', error);
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
          console.log(`UploadCenter FileDisplay: 开始加载文件 ${fileId}`);
          const content = await getFileContent(fileId);
          
          if (content) {
            console.log(`UploadCenter FileDisplay: 文件 ${fileId} 加载成功，内容长度: ${content.length}`);
            setFileUrl(content);
          } else {
            console.error(`UploadCenter FileDisplay: 文件 ${fileId} 加载失败 - 内容为空`);
            setError('文件内容为空，可能原因：1. 文件未正确保存 2. 分片存储未初始化 3. 文件ID无效');
          }
        } catch (error) {
          console.error(`UploadCenter FileDisplay: 文件 ${fileId} 加载失败:`, error);
          setError(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
          <span className="text-xs font-medium">文件加载失败</span>
          <span className="text-xs mt-1 text-red-500">{error || '未知错误'}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs mt-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            刷新页面
          </button>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <img 
          src={fileUrl} 
          alt={alt} 
          className={className}
          onError={() => {
            console.error(`UploadCenter FileDisplay: 图片 ${fileId} 渲染失败`);
            setError('图片渲染失败，可能原因：1. 文件格式不支持 2. 文件损坏 3. 浏览器兼容性问题');
          }}
        />
      );
    } else {
      return (
        <video 
          src={fileUrl} 
          controls 
          className={className}
          onError={() => {
            console.error(`UploadCenter FileDisplay: 视频 ${fileId} 渲染失败`);
            setError('视频渲染失败，可能原因：1. 文件格式不支持 2. 文件损坏 3. 浏览器兼容性问题');
          }}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">文件上传中心</h2>
        {/* 已移除分片存储调试入口 */}
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
                    {/* 图标 (非旅行资源) - 调整为小图标尺寸 */}
                    {activeTab !== 'travel' && item.iconUrl && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">图标</p>
                        <FileDisplay
                          fileId={item.iconUrl}
                          type="image"
                          alt="icon"
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                        />
                      </div>
                    )}
                    
                    {/* 展示图 - 保持原有尺寸 */}
                    {item.coverUrl && (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">展示图</p>
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
                        <p className="text-xs mb-1 text-gray-500">视频1</p>
                        <FileDisplay
                          fileId={item.travelVideo1}
                          type="video"
                          alt="video1"
                          className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                        />
                      </div>
                    ) : item.videoUrl ? (
                      <div>
                        <p className="text-xs mb-1 text-gray-500">视频</p>
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
                        <p className="text-xs mb-1 text-gray-500">视频2</p>
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
                        <p className="text-xs mb-1 text-gray-500">视频3</p>
                        <FileDisplay
                          fileId={item.travelVideo3}
                          type="video"
                          alt="video3"
                          className="w-[30%] h-60 rounded border border-gray-200 dark:border-gray-700 object-contain"
                        />
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


