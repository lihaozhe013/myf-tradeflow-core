#!/bin/bash

# 使用PM2配置文件启动生产环境
# 这是简化版本，使用ecosystem.config.json配置

set -e

echo "🚀 使用PM2配置启动MYF轻量级ERP系统..."

# 检查并安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 全局安装PM2..."
    npm install -g pm2
fi

# 生成PM2配置文件
echo "🔧 根据appConfig.json生成PM2配置..."
node generate-pm2-config.js

# 停止现有进程
if pm2 list | grep -q "myf-erp-backend"; then
    echo "🛑 停止现有进程..."
    pm2 stop ecosystem.config.json
    pm2 delete ecosystem.config.json
fi

# 构建项目
echo "🏗️ 构建项目..."
cd ../../ && npm run build && cd scripts/production

# 使用配置文件启动
echo "🚀 启动服务..."
pm2 start ecosystem.config.json

# 保存进程列表
pm2 save

echo "✅ 启动完成！"
pm2 list
