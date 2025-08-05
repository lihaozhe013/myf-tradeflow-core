const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

const router = express.Router();

// 获取关于信息
router.get('/', async (req, res) => {
  try {
    const aboutPath = path.join(__dirname, '../../data/about.json');
    
    // 检查文件是否存在
    try {
      await fs.access(aboutPath);
    } catch (error) {
      // 如果文件不存在，返回默认数据
      const defaultData = {
        title: "关于我们",
        company: {
          name: "MYF Trading System",
          description: "这是一个专为小型贸易公司设计的进出货管理系统。",
          slogan: "专业的贸易管理解决方案"
        },
        system: {
          version: "1.0.0",
          releaseDate: "2025-08-04",
          techStack: "React + Node.js + SQLite",
          team: "MYF开发团队"
        },
        features: [
          "智能入库/出库管理",
          "客户/供应商管理",
          "产品管理与价格跟踪",
          "应收应付账款管理",
          "数据分析与报表导出",
          "库存实时监控"
        ],
        contact: {
          email: "contact@myf-system.com",
          phone: "+86 xxx-xxxx-xxxx",
          address: "中国 · 北京"
        }
      };
      return res.json(defaultData);
    }

    // 读取文件内容
    const data = await fs.readFile(aboutPath, 'utf8');
    const aboutData = JSON.parse(data);
    
    logger.info('获取关于信息成功');
    res.json(aboutData);
  } catch (error) {
    logger.error('获取关于信息失败:', error);
    res.status(500).json({ 
      error: '获取关于信息失败', 
      details: error.message 
    });
  }
});

module.exports = router;
