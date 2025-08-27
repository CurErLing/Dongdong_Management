// 后台管理系统类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export interface Resource {
  id: string;
  name: string;
  type: 'file' | 'image' | 'document' | 'video' | 'audio';
  size: number;
  url: string;
  description?: string;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  type?: string;
  dateRange?: [string, string];
}

// 资源管理相关类型
export interface ResourceItem {
  id: string;
  name: string;
  note?: string;
  videoUrl?: string;
  iconUrl?: string;
  coverUrl?: string;
  dialogue?: string;
  timeDetail?: string;
  standbyType?: 'long' | 'short' | 'moyu';
  // 旅行资源的三个视频
  travelVideo1?: string;
  travelVideo2?: string;
  travelVideo3?: string;
}

export interface RoleCategoryResources {
  eat: ResourceItem[];
  gift: ResourceItem[];
  travel: ResourceItem[];
  standby: ResourceItem[];
  moments: ResourceItem[];
}

export interface RoleResourcesStore {
  [roleId: string]: RoleCategoryResources;
}

export interface RoleMeta {
  avatarDataUrl?: string;
  videoBaseImageDataUrl?: string;
  tags?: string[];
  systemPrompt?: string;
  voiceTone?: string;
}

export interface RoleMetaStore {
  [roleId: string]: RoleMeta;
}


