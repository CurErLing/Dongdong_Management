# 后台管理系统

一个基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化后台管理系统。

## ✨ 功能特性

- 🎯 **仪表盘**: 系统概览、统计数据、最近活动
- 👥 **用户管理**: 用户CRUD、角色分配、权限管理
- 🛡️ **角色管理**: 角色配置、基础信息、资源关联
- 📁 **资源管理**: 资源查看、编辑、分类管理
- 📤 **文件上传**: 多类型资源上传、预览、管理
- 📊 **操作日志**: 详细的操作记录、审计追踪
- ⚙️ **系统设置**: 数据管理、安全配置、系统信息

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd houtai

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🌐 部署到生产环境

### 方案一：Vercel 部署（推荐）

1. **注册 Vercel 账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **连接 GitHub 仓库**
   - 在 Vercel 中点击 "New Project"
   - 选择您的 GitHub 仓库
   - 保持默认设置，点击 "Deploy"

3. **自动部署**
   - 每次推送代码会自动重新部署
   - 获得 `https://your-project.vercel.app` 链接

### 方案二：Netlify 部署

1. **注册 Netlify 账号**
   - 访问 [netlify.com](https://netlify.com)

2. **部署设置**
   - 构建设置：`npm run build`
   - 发布目录：`dist`

### 方案三：一键部署

```bash
# 使用 Surge.sh 快速部署
npm run deploy

# 使用 Vercel CLI 部署
npm run deploy:vercel

# 使用 Netlify CLI 部署
npm run deploy:netlify
```

## 📱 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **状态管理**: React Hooks
- **数据存储**: LocalStorage
- **测试框架**: Vitest

## 🏗️ 项目结构

```
src/
├── components/
│   ├── admin/           # 管理后台组件
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── RoleManager.tsx  # 角色管理
│   │   ├── ResourceManager.tsx # 资源管理
│   │   ├── UploadCenter.tsx # 文件上传
│   │   ├── UsersManager.tsx # 用户管理
│   │   ├── Logs.tsx         # 操作日志
│   │   ├── Settings.tsx     # 系统设置
│   │   ├── Layout.tsx       # 布局组件
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   └── Header.tsx       # 顶部导航
│   └── ...
├── hooks/               # 自定义 Hooks
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
└── ...
```

## 🎨 界面预览

- **响应式设计**: 支持桌面端和移动端
- **深色模式**: 自动适配系统主题
- **现代化 UI**: 简洁美观的用户界面
- **交互友好**: 流畅的动画和反馈

## 📊 功能模块

### 仪表盘
- 系统统计数据
- 最近活动记录
- 快捷操作入口
- 系统状态监控

### 用户管理
- 用户列表和搜索
- 用户信息编辑
- 角色权限分配
- 用户状态管理

### 角色管理
- 角色基础信息配置
- 头像和基准图上传
- 标签和音色设置
- 系统提示词配置

### 资源管理
- 资源分类查看
- 资源内容编辑
- 媒体文件管理
- 资源搜索过滤

### 文件上传
- 多类型资源上传
- 实时预览功能
- 批量操作支持
- 上传进度显示

### 操作日志
- 详细操作记录
- 字段变化追踪
- 时间线展示
- 日志搜索过滤

### 系统设置
- 数据备份恢复
- 系统配置管理
- 安全设置
- 系统信息展示

## 🔧 开发指南

### 添加新功能

1. 在 `src/components/admin/` 下创建新组件
2. 在 `src/App.tsx` 中添加路由
3. 在 `src/components/admin/Sidebar.tsx` 中添加菜单项

### 自定义样式

项目使用 Tailwind CSS，可以通过修改 `tailwind.config.js` 来自定义主题。

### 数据存储

当前使用 LocalStorage 进行数据持久化，可以根据需要替换为其他存储方案。

## 📝 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🎯 完整的后台管理功能
- 📱 响应式设计
- 🌙 深色模式支持

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](https://github.com/yourusername/your-repo/issues)
- 发送邮件至 your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给它一个星标！
