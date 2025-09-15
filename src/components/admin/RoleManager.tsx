import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { Plus, Trash2, Search, ChevronDown, Pencil } from 'lucide-react';
import type { Role, RoleResourcesStore, RoleMeta, RoleMetaStore } from '../../types';
import { appendLog, generateChanges } from '../../utils/logger';
import { Alert } from '../ui/Alert';

const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';
const roleMetaKey = 'admin_role_meta_v1';

function useRoleStore() {
  const [roles, setRoles] = useState<Role[]>(() => {
    const v = localStorage.getItem(storageKey);
    if (v) return JSON.parse(v);
    const now = new Date().toISOString();
    return [
      { id: 'r-admin', name: '管理员', description: '系统最高权限', permissions: [], createdAt: now, updatedAt: now },
      { id: 'r-editor', name: '编辑', description: '内容编辑权限', permissions: [], createdAt: now, updatedAt: now },
    ];
  });

  const save = (next: Role[]) => {
    setRoles(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const create = (payload: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>, idOverride?: string) => {
    const now = new Date().toISOString();
    const next: Role[] = [
      { id: idOverride || `r-${Date.now()}`, createdAt: now, updatedAt: now, ...payload },
      ...roles,
    ];
    save(next);
  };

  const update = (id: string, partial: Partial<Role>) => {
    const now = new Date().toISOString();
    const next = roles.map(r => r.id === id ? { ...r, ...partial, updatedAt: now } : r);
    save(next);
  };

  const remove = (id: string) => {
    const next = roles.filter(r => r.id !== id);
    save(next);
  };

  return { roles, create, update, remove };
}

export const RoleManager: React.FC = () => {
  const { roles, create, update, remove } = useRoleStore();
  const [q, setQ] = useState('');
  const qDeferred = useDeferredValue(q);
  const [form, setForm] = useState<{ id?: string; name: string; roleType: string }>({ name: '', roleType: '' });
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  // removed tab system; keep minimal state setter as no-op compatibility
  const setActiveTab = (_: 'base') => {};

  // 提交/保存状态与反馈
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingBase, setIsSavingBase] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    // 3 秒后自动关闭
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const [roleResources, setRoleResources] = useState<RoleResourcesStore>(() => {
    const v = localStorage.getItem(roleResKey);
    return v ? JSON.parse(v) : {};
  });

  const [roleMeta, setRoleMeta] = useState<RoleMetaStore>(() => {
    const v = localStorage.getItem(roleMetaKey);
    return v ? JSON.parse(v) : {};
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

  const persistMeta = (next: RoleMetaStore) => {
    setRoleMeta(next);
    localStorage.setItem(roleMetaKey, JSON.stringify(next));
  };

  const ensureRoleMeta = (rid: string): RoleMeta => {
    if (roleMeta[rid]) return roleMeta[rid];
    const next = { ...roleMeta, [rid]: {} } as RoleMetaStore;
    persistMeta(next);
    return next[rid];
  };

  const filtered = useMemo(() => {
    const query = qDeferred.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter(r => r.name.toLowerCase().includes(query));
  }, [qDeferred, roles]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setIsSubmitting(true);
      if (form.id) {
        update(form.id, { name: form.name });
        showFeedback('success', '角色已保存');
        // 退出任何可能的编辑模式
        setIsEditingBase(false);
        // 如当前为所选角色，刷新其基础信息显示
        if (selectedRoleId === form.id) {
          loadBaseForRole(form.id);
        }
      } else {
        const newId = `r-${Date.now()}`;
        create({ name: form.name, description: form.roleType || '', permissions: [] }, newId);
        appendLog('新增角色', `角色名称: ${form.name}${form.roleType ? `, 角色类型: ${form.roleType}` : ''}`, newId, undefined, {
          roleName: form.name,
          roleType: form.roleType || '',
          hasAvatar: !!addAvatarFile,
          hasVideoBaseImage: !!addVideoBaseImageFile,
          tags: addTagsInput.split(',').map(s => s.trim()).filter(Boolean),
          voiceTone: addVoiceTone,
          hasSystemPrompt: !!addPrompt.trim()
        });
        // 保存新增角色的基础信息到元数据（等待持久化完成以便界面立即可见）
        const meta: RoleMeta = {};
        if (addAvatarFile) meta.avatarDataUrl = await readFileAsDataURL(addAvatarFile);
        if (addVideoBaseImageFile) meta.videoBaseImageDataUrl = await readFileAsDataURL(addVideoBaseImageFile);
        meta.tags = addTagsInput.split(',').map(s => s.trim()).filter(Boolean);
        meta.systemPrompt = addPrompt.trim();
        meta.voiceTone = addVoiceTone.trim();
        const metaNext = { ...roleMeta, [newId]: meta } as RoleMetaStore;
        persistMeta(metaNext);
        setSelectedRoleId(newId);
        ensureRoleRes(newId);
        setActiveTab('base');
        // 立刻加载基础信息，确保界面数据同步
        loadBaseForRole(newId);
        showFeedback('success', '角色已新增');
        // 收起新增面板以便聚焦到新角色
        setShowAddForm(false);
      }
    } catch (error) {
      showFeedback('error', '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
      setForm({ name: '', roleType: '' });
      setAddAvatarFile(null);
      setAddVideoBaseImageFile(null);
      setAddTagsInput('');
      setAddVoiceTone('');
      setAddPrompt('');
    }
  };



  const onRemove = (id: string) => {
    if (!confirm('确定删除该角色及其所有相关资源吗？')) return;
    remove(id);
    const next = { ...roleResources };
    delete next[id];
    persistRes(next);
    const metaNext = { ...roleMeta } as RoleMetaStore;
    delete metaNext[id];
    persistMeta(metaNext);
    const roleName = roles.find(r => r.id === id)?.name || '';
    if (selectedRoleId === id) setSelectedRoleId(null);
    appendLog('删除角色', `角色: ${roleName}`, id, undefined, { roleName, roleType: roles.find(r => r.id === id)?.description });
  };

  // 已移除资源页签，不再统计数量

  // 仅保留基础信息

  // 已移除资源相关输入

  // 基础信息编辑状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [videoBaseImageFile, setVideoBaseImageFile] = useState<File | null>(null);
  const [baseTagsInput, setBaseTagsInput] = useState<string>('');
  const [basePrompt, setBasePrompt] = useState<string>('');
  const [baseVoiceTone, setBaseVoiceTone] = useState<string>('');

  // 新增角色时的基础信息（与“基础信息”页签状态独立）
  const [addAvatarFile, setAddAvatarFile] = useState<File | null>(null);
  const [addVideoBaseImageFile, setAddVideoBaseImageFile] = useState<File | null>(null);
  const [addTagsInput, setAddTagsInput] = useState<string>('');
  const [addVoiceTone, setAddVoiceTone] = useState<string>('');
  const [addPrompt, setAddPrompt] = useState<string>('');

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 释放临时对象URL，避免内存泄漏
  useEffect(() => {
    let avatarUrl: string | null = null;
    let videoUrl: string | null = null;
    if (avatarFile) avatarUrl = URL.createObjectURL(avatarFile);
    if (videoBaseImageFile) videoUrl = URL.createObjectURL(videoBaseImageFile);
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [avatarFile, videoBaseImageFile]);

  const loadBaseForRole = (rid: string) => {
    const meta = ensureRoleMeta(rid);
    setBaseTagsInput((meta.tags || []).join(','));
    setBasePrompt(meta.systemPrompt || '');
    setBaseVoiceTone(meta.voiceTone || '');
    setAvatarFile(null);
    setVideoBaseImageFile(null);
  };

  const [isEditingBase, setIsEditingBase] = useState(false);

  const saveBaseInfo = async () => {
    if (!selectedRoleId) return;
    try {
      setIsSavingBase(true);
      const meta = ensureRoleMeta(selectedRoleId);
      const next: RoleMeta = { ...meta };
      if (avatarFile) next.avatarDataUrl = await readFileAsDataURL(avatarFile);
      if (videoBaseImageFile) next.videoBaseImageDataUrl = await readFileAsDataURL(videoBaseImageFile);
      next.tags = baseTagsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      next.systemPrompt = basePrompt.trim();
      next.voiceTone = baseVoiceTone.trim();
      const metaNext = { ...roleMeta, [selectedRoleId]: next } as RoleMetaStore;
      persistMeta(metaNext);
      setAvatarFile(null);
      setVideoBaseImageFile(null);
      
      const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';
      const changes = generateChanges(meta, next, ['avatarDataUrl', 'videoBaseImageDataUrl', 'tags', 'systemPrompt', 'voiceTone']);
      appendLog('保存角色基础信息', `角色: ${roleName}`, selectedRoleId, changes, {
        roleName,
        hasAvatar: !!next.avatarDataUrl,
        hasVideoBaseImage: !!next.videoBaseImageDataUrl,
        tagsCount: next.tags?.length || 0,
        hasSystemPrompt: !!next.systemPrompt,
        voiceTone: next.voiceTone
      });
      showFeedback('success', '基础信息已保存');
      // 刷新视图数据并退出编辑模式
      loadBaseForRole(selectedRoleId);
      setIsEditingBase(false);
    } catch (error) {
      showFeedback('error', '保存失败，请重试');
    } finally {
      setIsSavingBase(false);
    }
  };



  // 已移除资源新增逻辑

  // 已移除资源删除逻辑

  // 已移除资源列表

  // 如需默认展开，可恢复持久化逻辑；此处按要求默认不展开
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          type={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? '操作成功' : '操作失败'}
          closable
        >
          {feedback.message}
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">角色管理</h2>
      </div>

      {/* 角色基础表单（新增/编辑） */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div
          className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
          onClick={() => setShowAddForm(v => !v)}
          role="button"
          aria-expanded={showAddForm}
          aria-controls="add-role-panel"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
            新增角色
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{showAddForm ? '点击收起' : '点击展开并添加'}</span>
          </h3>
          <div className="inline-flex items-center text-gray-600 dark:text-gray-300">
            <span className="mr-2 text-xs">{showAddForm ? '收起' : '展开'}</span>
            <ChevronDown size={18} className={`${showAddForm ? '' : '-rotate-90'} transition-transform`} />
          </div>
        </div>
        {!showAddForm && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            提示：点击上方栏可展开，添加头像、标签、音色、提示词等基础信息
          </div>
        )}
        {showAddForm && (
        <form id="add-role-panel" onSubmit={onSubmit} className="p-4 space-y-4">
        {/* 第一行：角色名称 | 角色类型 | 角色标签 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            placeholder="角色名称"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          />
          <input
            value={form.roleType}
            onChange={e => setForm(s => ({ ...s, roleType: e.target.value }))}
            placeholder="角色类型"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          />
          <input
            value={addTagsInput}
            onChange={e => setAddTagsInput(e.target.value)}
            placeholder="角色标签（逗号分隔）"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          />
        </div>

        {/* 中间：角色头像、角色基准图、角色音色 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300">角色头像（新增时可选）</label>
            <input type="file" accept="image/*" onChange={e => setAddAvatarFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300">角色生成视频基准图（新增时可选）</label>
            <input type="file" accept="image/*" onChange={e => setAddVideoBaseImageFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300">角色音色修改</label>
            <select
              value={addVoiceTone}
              onChange={e => setAddVoiceTone(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
            >
              <option value="">默认</option>
              <option value="温柔女声">温柔女声</option>
              <option value="低沉男声">低沉男声</option>
              <option value="活泼童声">活泼童声</option>
              <option value="机械音">机械音</option>
              <option value="磁性男声">磁性男声</option>
            </select>
          </div>
        </div>

        {/* 下方：角色提示词 */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-600 dark:text-gray-300">角色系统提示词</label>
          <textarea
            value={addPrompt}
            onChange={e => setAddPrompt(e.target.value)}
            placeholder="为该角色设定系统级提示词，例如说话风格、知识边界、行为准则等"
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          />
        </div>

        <div className="flex items-center justify-end">
          <button type="submit" disabled={!form.name.trim() || isSubmitting} className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white ${!form.name.trim() || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <Plus size={14} className="mr-1" />
            {isSubmitting ? '保存中...' : (form.id ? '保存修改' : '新增角色')}
          </button>
        </div>
        </form>
        )}
      </div>

      {/* 角色列表 + 搜索 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索角色名称或描述"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map(r => (
            <div key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => {
                    if (selectedRoleId === r.id) {
                      setSelectedRoleId(null);
                    } else {
                      setSelectedRoleId(r.id);
                      setActiveTab('base');
                      loadBaseForRole(r.id);
                    }
                  }}
                  className="flex-1 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedRoleId === r.id ? '点击收起详情' : '点击展开查看详情'}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`${selectedRoleId === r.id ? '' : '-rotate-90'} transition-transform text-gray-400`} />
                </button>
                <div className="flex items-center space-x-1 ml-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoleId(r.id);
                      setActiveTab('base');
                      loadBaseForRole(r.id);
                      setIsEditingBase(true);
                    }} 
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" 
                    title="编辑角色"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(r.id);
                    }} 
                    className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                    title="删除角色"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 选中角色后显示页签与资源管理 */}
              {selectedRoleId === r.id && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">查看：{r.name}</div>
                    {isEditingBase && (
                      <div className="flex items-center gap-2">
                        <button onClick={saveBaseInfo} disabled={isSavingBase} className={`px-3 py-1.5 rounded text-sm ${isSavingBase ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isSavingBase ? '保存中...' : '保存'}</button>
                        <button onClick={() => setIsEditingBase(false)} className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">取消</button>
                      </div>
                    )}
                  </div>
                  {/* 仅保留基础信息，无资源页签 */}

                  {/* 基础信息配置 */}
                  {(
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg space-y-4">
                      {/* 第一行：角色头像、角色基准图、角色音色 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-300">角色头像</label>
                          {isEditingBase ? (
                            <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
                          ) : null}
                          {selectedRoleId && ((roleMeta[selectedRoleId]?.avatarDataUrl) || avatarFile) && (
                            <img
                              src={avatarFile ? URL.createObjectURL(avatarFile) : roleMeta[selectedRoleId]?.avatarDataUrl as string}
                              className="h-20 w-20 object-cover rounded border border-gray-200 dark:border-gray-700"
                              alt="avatar"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-300">角色生成视频基准图</label>
                          {isEditingBase ? (
                            <input type="file" accept="image/*" onChange={e => setVideoBaseImageFile(e.target.files?.[0] || null)} />
                          ) : null}
                          {selectedRoleId && ((roleMeta[selectedRoleId]?.videoBaseImageDataUrl) || videoBaseImageFile) && (
                            <img
                              src={videoBaseImageFile ? URL.createObjectURL(videoBaseImageFile) : roleMeta[selectedRoleId]?.videoBaseImageDataUrl as string}
                              className="h-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                              alt="video-base"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-300">角色音色修改</label>
                          <select
                            value={baseVoiceTone}
                            onChange={e => setBaseVoiceTone(e.target.value)} disabled={!isEditingBase}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          >
                            <option value="">默认</option>
                            <option value="温柔女声">温柔女声</option>
                            <option value="低沉男声">低沉男声</option>
                            <option value="活泼童声">活泼童声</option>
                            <option value="机械音">机械音</option>
                            <option value="磁性男声">磁性男声</option>
                          </select>
                        </div>
                      </div>

                      {/* 第二行：角色类型和角色标签 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-300">角色类型</label>
                          <input
                            value={selectedRoleId ? (roles.find(r => r.id === selectedRoleId)?.description || '') : ''}
                            onChange={e => {
                              if (selectedRoleId) {
                                update(selectedRoleId, { description: e.target.value });
                              }
                            }}
                            disabled={!isEditingBase}
                            placeholder="角色类型"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-300">角色标签（逗号分隔）</label>
                          <input
                            value={baseTagsInput}
                            onChange={e => setBaseTagsInput(e.target.value)} disabled={!isEditingBase}
                            placeholder="如：搞笑, 美食, 可爱"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                          />
                        </div>
                      </div>

                      {/* 第三行：角色系统提示词 */}
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-600 dark:text-gray-300">角色系统提示词</label>
                        <textarea
                          value={basePrompt}
                          onChange={e => setBasePrompt(e.target.value)} disabled={!isEditingBase}
                          placeholder="为该角色设定系统级提示词，例如说话风格、知识边界、行为准则等"
                          rows={4}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-500">无匹配角色</div>
          )}
        </div>
      </div>
    </div>
  );
};


