#!/bin/bash

# 停止PM2管理的生产环境服务

echo "🛑 停止MYF轻量级ERP系统..."

if pm2 list | grep -q "myf-tradeflow-backend"; then
    echo "停止后端服务..."
    pm2 stop myf-tradeflow-backend
    echo "✅ 服务已停止"
    
    echo "当前PM2进程状态:"
    pm2 list
else
    echo "❌ 没有找到运行中的myf-tradeflow-backend进程"
fi
