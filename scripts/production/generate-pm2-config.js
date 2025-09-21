#!/usr/bin/env node

/**
 * 动态生成PM2配置文件的脚本
 * 根据 data/appConfig.json 中的配置动态设置端口
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径（相对于项目根目录）
const APP_CONFIG_PATH = path.resolve(__dirname, '../../data/appConfig.json');
const ECOSYSTEM_TEMPLATE_PATH = path.resolve(__dirname, 'ecosystem.config.template.json');
const ECOSYSTEM_CONFIG_PATH = path.resolve(__dirname, 'ecosystem.config.json');

function loadAppConfig() {
    try {
        if (!fs.existsSync(APP_CONFIG_PATH)) {
            console.error(`❌ 配置文件不存在: ${APP_CONFIG_PATH}`);
            process.exit(1);
        }
        
        const configData = fs.readFileSync(APP_CONFIG_PATH, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error(`❌ 读取配置文件失败: ${error.message}`);
        process.exit(1);
    }
}

function generateEcosystemConfig(appConfig) {
    // 根据HTTPS配置决定端口
    let port;
    let protocol;
    
    if (appConfig.https && appConfig.https.enabled) {
        port = appConfig.https.port || appConfig.server.httpsPort || 443;
        protocol = 'HTTPS';
    } else {
        port = appConfig.server.httpPort || 8080;
        protocol = 'HTTP';
    }
    
    console.log(`📡 检测到配置: ${protocol} 端口 ${port}`);
    
    // PM2配置模板
    const ecosystemConfig = {
        "apps": [
            {
                "name": "myf-tradeflow-backend",
                "script": "server.js",
                "cwd": "../../backend",
                "instances": "max",
                "exec_mode": "cluster",
                "env": {
                    "NODE_ENV": "production",
                    "PORT": port.toString(),
                    "HTTPS_ENABLED": appConfig.https && appConfig.https.enabled ? "true" : "false"
                },
                "max_memory_restart": "500M",
                "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
                "merge_logs": true,
                "out_file": "../../data/log/pm2-out.log",
                "error_file": "../../data/log/pm2-error.log",
                "log_file": "../../data/log/pm2-combined.log",
                "time": true,
                "autorestart": true,
                "watch": false,
                "max_restarts": 10,
                "min_uptime": "10s",
                "kill_timeout": 5000,
                "listen_timeout": 3000,
                "restart_delay": 4000
            }
        ]
    };
    
    return ecosystemConfig;
}

function saveEcosystemConfig(config) {
    try {
        const configJson = JSON.stringify(config, null, 2);
        fs.writeFileSync(ECOSYSTEM_CONFIG_PATH, configJson, 'utf8');
        console.log(`✅ PM2配置文件已生成: ${ECOSYSTEM_CONFIG_PATH}`);
        console.log(`🔧 配置详情:`);
        console.log(`   - 端口: ${config.apps[0].env.PORT}`);
        console.log(`   - HTTPS: ${config.apps[0].env.HTTPS_ENABLED}`);
        console.log(`   - 实例数: ${config.apps[0].instances}`);
        console.log(`   - 模式: ${config.apps[0].exec_mode}`);
    } catch (error) {
        console.error(`❌ 保存配置文件失败: ${error.message}`);
        process.exit(1);
    }
}

function main() {
    console.log('🔧 开始生成PM2配置文件...');
    
    // 读取应用配置
    const appConfig = loadAppConfig();
    
    // 生成PM2配置
    const ecosystemConfig = generateEcosystemConfig(appConfig);
    
    // 保存配置文件
    saveEcosystemConfig(ecosystemConfig);
    
    console.log('🎉 PM2配置文件生成完成！');
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = { loadAppConfig, generateEcosystemConfig, saveEcosystemConfig };
