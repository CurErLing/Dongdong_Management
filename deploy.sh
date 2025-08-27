#!/bin/bash

# 部署脚本
echo "🚀 开始部署后台管理系统..."

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行测试
echo "🧪 运行测试..."
npm run test -- --run

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 dist/ 目录"
    
    # 显示构建文件大小
    echo "📊 构建文件大小："
    du -sh dist/*
    
    echo ""
    echo "🎉 项目已准备好部署！"
    echo ""
    echo "📋 部署选项："
    echo "1. Vercel: https://vercel.com"
    echo "2. Netlify: https://netlify.com"
    echo "3. GitHub Pages: 运行 'npm run deploy'"
    echo "4. Surge.sh: 运行 'npx surge dist'"
    echo ""
    echo "💡 推荐使用 Vercel 进行部署"
    
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
