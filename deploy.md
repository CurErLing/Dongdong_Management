# 部署指南

## 部署前准备

### 1. 代码准备
- [x] 项目构建成功 (`npm run build`)
- [x] 所有功能测试通过
- [x] 代码已提交到 Git

### 2. 环境变量（如需要）
当前项目使用 localStorage，无需环境变量配置。

### 3. 构建配置
- [x] Vite 配置正确
- [x] TypeScript 编译无错误
- [x] 静态资源路径正确

## 推荐部署平台

### 🥇 Vercel（推荐）
- **优点**: 自动部署、CDN 加速、免费 SSL、自定义域名
- **适合**: 生产环境、团队协作
- **链接**: https://vercel.com

### 🥈 Netlify
- **优点**: 表单处理、函数支持、分支预览
- **适合**: 需要后端功能的项目
- **链接**: https://netlify.com

### 🥉 GitHub Pages
- **优点**: 完全免费、与 GitHub 集成
- **适合**: 开源项目、个人网站
- **限制**: 仅支持静态网站

### 🚀 Surge.sh
- **优点**: 部署最简单、速度快
- **适合**: 快速原型、临时演示
- **链接**: https://surge.sh

## 部署命令

### Vercel 部署
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 生产部署
vercel --prod
```

### Netlify 部署
```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
netlify deploy

# 4. 生产部署
netlify deploy --prod
```

### GitHub Pages 部署
```bash
# 1. 安装 gh-pages
npm install --save-dev gh-pages

# 2. 添加部署脚本到 package.json
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# 3. 部署
npm run deploy
```

### Surge.sh 部署
```bash
# 1. 安装 Surge
npm install -g surge

# 2. 构建项目
npm run build

# 3. 部署
cd dist && surge
```

## 部署后配置

### 1. 自定义域名
- 在托管平台设置中添加自定义域名
- 配置 DNS 记录指向托管平台

### 2. SSL 证书
- 大多数平台自动提供免费 SSL
- 确保 HTTPS 访问正常

### 3. 性能优化
- 启用 CDN 加速
- 配置缓存策略
- 压缩静态资源

## 监控和维护

### 1. 访问统计
- 使用 Google Analytics
- 配置平台内置统计

### 2. 错误监控
- 使用 Sentry 等错误监控服务
- 配置日志收集

### 3. 定期更新
- 更新依赖包
- 重新部署最新版本

## 常见问题

### Q: 部署后页面空白？
A: 检查构建输出，确保所有资源路径正确。

### Q: 路由不工作？
A: 配置 SPA 路由重定向到 index.html。

### Q: 图片不显示？
A: 检查图片路径，确保使用相对路径。

### Q: 样式不生效？
A: 检查 Tailwind CSS 是否正确构建。

## 联系支持

如果遇到部署问题，可以：
1. 查看平台文档
2. 检查构建日志
3. 联系平台技术支持
