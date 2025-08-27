import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Pencil, Check, X } from 'lucide-react';

type UserItem = {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'superadmin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

const storageKey = 'admin_users_v1';

import { appendLog } from '../../utils/logger';

function useUserStore() {
  const [users, setUsers] = useState<UserItem[]>(() => {
    const v = localStorage.getItem(storageKey);
    if (v) return JSON.parse(v);
    const now = new Date().toISOString();
    return [
      { id: 'u-admin', username: 'admin', email: 'admin@example.com', phone: '', password: '', role: 'admin', status: 'active', createdAt: now, updatedAt: now },
      { id: 'u-super', username: 'superadmin', email: 'super@example.com', phone: '', password: '', role: 'superadmin', status: 'active', createdAt: now, updatedAt: now },
    ];
  });

  const save = (next: UserItem[]) => {
    setUsers(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const create = (payload: Omit<UserItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const next: UserItem[] = [
      { id: `u-${Date.now()}`, createdAt: now, updatedAt: now, ...payload },
      ...users,
    ];
    save(next);
  };

  const update = (id: string, partial: Partial<UserItem>) => {
    const now = new Date().toISOString();
    const next = users.map(u => u.id === id ? { ...u, ...partial, updatedAt: now } : u);
    save(next);
  };

  const remove = (id: string) => {
    const next = users.filter(u => u.id !== id);
    save(next);
  };

  return { users, create, update, remove };
}

export const UsersManager: React.FC = () => {
  const { users, create, update, remove } = useUserStore();
  const [q, setQ] = useState('');
  const [form, setForm] = useState<{ username: string; email?: string; phone?: string; password?: string; role: 'admin' | 'superadmin' }>({ username: '', email: '', phone: '', password: '', role: 'admin' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ username: string; role: 'admin' | 'superadmin'; phone?: string; password?: string; status: 'active' | 'inactive' }>({ username: '', role: 'admin', phone: '', password: '', status: 'active' });
  const [errors, setErrors] = useState<{ username?: string; email?: string; phone?: string; password?: string }>({});
  const [editErrors, setEditErrors] = useState<{ username?: string; email?: string; phone?: string; password?: string }>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9\-+()\s]{6,20}$/; // 简单校验：允许数字及常见符号，长度限制

  const sha256 = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter(u => u.username.toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query));
  }, [q, users]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.username.trim()) nextErrors.username = '请输入用户名';
    if (form.email && !emailRegex.test(form.email.trim())) nextErrors.email = '邮箱格式不正确';
    if (form.phone && !phoneRegex.test(form.phone.trim())) nextErrors.phone = '手机号格式不正确';
    if (form.password && form.password.length < 6) nextErrors.password = '密码至少6位';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const hashed = form.password ? await sha256(form.password) : '';
    create({ username: form.username.trim(), email: form.email?.trim(), phone: form.phone?.trim(), password: hashed, role: form.role, status: 'active' });
    appendLog('创建用户', `${form.username.trim()}（${form.role === 'superadmin' ? '超级管理员' : '管理员'}）`);
    setForm({ username: '', email: '', phone: '', password: '', role: 'admin' });
  };

  const onStartEdit = (u: UserItem) => {
    setEditingId(u.id);
    setEditForm({ username: u.username, role: u.role, phone: u.phone || '', password: u.password || '', status: u.status });
    setEditErrors({});
  };

  const onCancelEdit = () => {
    setEditingId(null);
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    const nextErrors: typeof editErrors = {};
    if (!editForm.username.trim()) nextErrors.username = '请输入昵称';
    if (editForm.phone && !phoneRegex.test(editForm.phone.trim())) nextErrors.phone = '手机号格式不正确';
    if (editForm.password && editForm.password.length > 0 && editForm.password.length < 6) nextErrors.password = '密码至少6位';
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const hashed = editForm.password ? await sha256(editForm.password) : undefined; // 不改密码则不覆盖
    update(editingId, { username: editForm.username.trim(), role: editForm.role, phone: editForm.phone?.trim(), password: hashed, status: editForm.status });
    appendLog('修改用户', `${editForm.username.trim()}（${editForm.role === 'superadmin' ? '超级管理员' : '管理员'}，状态：${editForm.status === 'active' ? '启用' : '禁用'}）`);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">用户管理</h2>
      </div>

      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
        <input
          value={form.username}
          onChange={e => setForm(s => ({ ...s, username: e.target.value }))}
          placeholder="用户名"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
        />
        {errors.username && <div className="text-xs text-red-600 md:col-span-5">{errors.username}</div>}
        <input
          value={form.email}
          onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
          placeholder="邮箱（可选）"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
        />
        {errors.email && <div className="text-xs text-red-600 md:col-span-4">{errors.email}</div>}
        <input
          value={form.phone}
          onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
          placeholder="手机号（可选）"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
        />
        {errors.phone && <div className="text-xs text-red-600 md:col-span-4">{errors.phone}</div>}
        <input
          value={form.password}
          onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
          placeholder="密码（可选）"
          type="password"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
        />
        {errors.password && <div className="text-xs text-red-600 md:col-span-4">{errors.password}</div>}
        <select
          value={form.role}
          onChange={e => setForm(s => ({ ...s, role: e.target.value as 'admin' | 'superadmin' }))}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
        >
          <option value="admin">管理员</option>
          <option value="superadmin">超级管理员</option>
        </select>
        <button
          type="submit"
          disabled={!form.username.trim()}
          className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white ${!form.username.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Plus size={14} className="mr-1" /> 添加用户
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索用户名或邮箱"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0 w-full">
                {editingId === u.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                    <input
                      value={editForm.username}
                      onChange={e => setEditForm(s => ({ ...s, username: e.target.value }))}
                      placeholder="昵称"
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                    />
                    {editErrors.username && <div className="text-xs text-red-600 md:col-span-5">{editErrors.username}</div>}
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm(s => ({ ...s, phone: e.target.value }))}
                      placeholder="手机号（可选）"
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                    />
                    {editErrors.phone && <div className="text-xs text-red-600 md:col-span-5">{editErrors.phone}</div>}
                    <input
                      value={editForm.password}
                      onChange={e => setEditForm(s => ({ ...s, password: e.target.value }))}
                      placeholder="密码（可选）"
                      type="password"
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                    />
                    {editErrors.password && <div className="text-xs text-red-600 md:col-span-5">{editErrors.password}</div>}
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm(s => ({ ...s, role: e.target.value as 'admin' | 'superadmin' }))}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                    >
                      <option value="admin">管理员</option>
                      <option value="superadmin">超级管理员</option>
                    </select>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(s => ({ ...s, status: e.target.value as 'active' | 'inactive' }))}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                    >
                      <option value="active">启用</option>
                      <option value="inactive">禁用</option>
                    </select>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={onSaveEdit} disabled={!editForm.username.trim()} className={`inline-flex items-center px-3 py-2 rounded-md text-white text-sm ${!editForm.username.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                        <Check size={14} className="mr-1" /> 保存
                      </button>
                      <button onClick={onCancelEdit} className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
                        <X size={14} className="mr-1" /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate flex items-center">
                      <span>{u.username}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">{u.role === 'superadmin' ? '超级管理员' : '管理员'}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email || '无邮箱'} · {u.phone || '无手机号'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">状态：{u.status === 'active' ? '启用' : '禁用'} · 创建时间：{new Date(u.createdAt).toLocaleString()}</p>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {editingId !== u.id && (
                  <button onClick={() => onStartEdit(u)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="编辑">
                    <Pencil size={18} />
                  </button>
                )}
                <button onClick={() => { if (confirm('确定删除该用户吗？')) { remove(u.id); appendLog('删除用户', u.username); } }} className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="删除">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-500">暂无用户</div>
          )}
        </div>
      </div>
    </div>
  );
};


