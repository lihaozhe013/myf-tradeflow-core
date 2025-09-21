#!/bin/bash

# 生产环境启动脚本 - 使用PM2管理进程
# 这个脚本会自动安装PM2并启动ERP系统

set -e  # 遇到错误立即退出

echo "🚀 开始启动MYF轻量级ERP系统生产环境..."

# 检查是否已安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2未安装，正在全局安装PM2..."
    npm install -g pm2
    echo "✅ PM2安装完成"
else
    echo "✅ PM2已安装，版本: $(pm2 --version)"
fi

# 检查是否已有进程在运行，如果有则停止
echo "🔍 检查现有PM2进程..."
if pm2 list | grep -q "myf-tradeflow-backend"; then
    echo "🛑 停止现有的后端进程..."
    pm2 stop myf-tradeflow-backend
    pm2 delete myf-tradeflow-backend
fi

# 生成PM2配置文件
echo "🔧 根据appConfig.json生成PM2配置..."
node generate-pm2-config.js

# 确保依赖已安装
echo "📦 检查并安装依赖..."
if [ ! -d "../../node_modules" ]; then
    echo "安装根目录依赖..."
    cd ../../ && npm install && cd scripts/production
fi

if [ ! -d "../../backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd ../../backend && npm install && cd ../scripts/production
fi

if [ ! -d "../../frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd ../../frontend && npm install && cd ../scripts/production
fi

# 构建前端
echo "🏗️ 构建前端..."
cd ../../ && npm run build && cd scripts/production

# 使用PM2启动后端服务，使用max实例数
echo "🚀 使用PM2启动后端服务 (max instances)..."
pm2 start ecosystem.config.json

# 保存PM2进程列表
echo "💾 保存PM2进程列表..."
pm2 save

# 设置PM2开机自启动
echo "⚙️ 设置PM2开机自启动..."
pm2 startup

echo ""
echo "🎉 生产环境启动完成！"
echo ""
echo "📊 PM2进程状态:"
pm2 list

echo ""
echo "📋 常用PM2命令:"
echo "  查看进程状态: pm2 list"
echo "  查看日志:     pm2 logs myf-tradeflow-backend"
echo "  重启服务:     pm2 restart myf-tradeflow-backend"
echo "  停止服务:     pm2 stop myf-tradeflow-backend"
echo "  删除进程:     pm2 delete myf-tradeflow-backend"
echo "  监控面板:     pm2 monit"
echo ""
echo "🌐 应用程序应该已经在后台运行"
echo "💡 请检查服务器配置确保正确的端口已开放"
