# PM2 生产环境部署指南

本文档介绍如何使用PM2在生产环境中部署和管理MYF轻量级tradeflow系统。

## 🚀 快速开始

### 方式一：一键启动脚本（推荐）
```bash
# 运行完整的生产环境启动脚本
./scripts/production/start-prod.sh
```

这个脚本会：
- 自动安装PM2（如果未安装）
- 安装所有依赖
- 构建前端
- 使用cluster模式启动后端服务（max instances）
- 配置日志记录
- 设置开机自启动

### 方式二：使用PM2配置文件
```bash
# 使用ecosystem配置文件启动
./scripts/production/start-pm2.sh

# 或者手动操作
npm run build
pm2 start scripts/production/ecosystem.config.json
```

## 📋 可用的NPM脚本

```bash
# PM2相关脚本
npm run start:pm2     # 启动PM2服务
npm run stop:pm2      # 停止PM2服务  
npm run restart:pm2   # 重启PM2服务
npm run logs:pm2      # 查看日志
npm run monit:pm2     # 打开PM2监控面板

# 构建脚本
npm run build         # 构建前端

# 开发脚本
npm run dev          # 开发模式（前端+后端）
npm run dev:frontend # 仅前端开发
npm run dev:backend  # 仅后端开发
```

## 🛠️ PM2常用命令

```bash
# 查看进程状态
pm2 list
pm2 status

# 查看日志
pm2 logs myf-tradeflow-backend
pm2 logs myf-tradeflow-backend --lines 100

# 重启服务
pm2 restart myf-tradeflow-backend
pm2 reload myf-tradeflow-backend    # 0秒停机重启

# 停止/删除服务
pm2 stop myf-tradeflow-backend
pm2 delete myf-tradeflow-backend

# 监控
pm2 monit                     # 实时监控面板
pm2 show myf-tradeflow-backend      # 显示详细信息

# 保存配置
pm2 save                      # 保存当前进程列表
pm2 resurrect                 # 恢复保存的进程列表

# 开机自启动
pm2 startup                   # 设置开机自启动
pm2 unstartup                 # 取消开机自启动
```

## 📊 集群模式配置

系统使用cluster模式运行，配置如下：
- **实例数**: `max` (使用所有CPU核心)
- **内存限制**: 500MB自动重启
- **自动重启**: 开启
- **最大重启次数**: 10次
- **最小运行时间**: 10秒

## 📁 日志文件位置

- **输出日志**: `./data/log/pm2-out.log`
- **错误日志**: `./data/log/pm2-error.log`
- **合并日志**: `./data/log/pm2-combined.log`

## 🔧 配置文件

主要配置文件：
- `scripts/production/ecosystem.config.json` - PM2进程配置
- `package.json` - 项目脚本和依赖

## 🚨 故障排除

### 1. PM2命令未找到
```bash
# 全局安装PM2
npm install -g pm2
```

### 2. 端口被占用
```bash
# 查看端口占用
netstat -tulnp | grep :3000
# 或者修改ecosystem.config.json中的PORT环境变量
```

### 3. 内存不足
```bash
# 调整ecosystem.config.json中的max_memory_restart值
# 或减少instances数量
```

### 4. 服务无法启动
```bash
# 查看详细错误日志
pm2 logs myf-tradeflow-backend --err
# 检查依赖是否完整安装
npm run install:all
# 或调整ecosystem.config.json中的max_memory_restart值
```

## 📈 性能优化建议

1. **合理设置实例数**: 通常设置为CPU核心数，或使用`max`
2. **内存监控**: 根据实际使用情况调整`max_memory_restart`
3. **日志轮转**: 定期清理或配置日志轮转避免磁盘空间不足
4. **监控告警**: 使用`pm2 monit`或集成其他监控系统

## 🔐 安全注意事项

1. 确保生产环境的JWT密钥安全
2. 定期更新依赖包
3. 配置防火墙规则
4. 使用Nginx反向代理配置HTTPS
5. 定期备份数据库文件

---

**快速命令参考**:
- 启动: `./scripts/production/start-prod.sh`
- 停止: `./scripts/production/stop-pm2.sh` 
- 状态: `pm2 list`
- 日志: `pm2 logs myf-tradeflow-backend`
