const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const PythonExporter = require('../utils/pythonExporter');

const exporter = new PythonExporter();

// 导出基础信息
router.post('/base-info', async (req, res) => {
    try {
        const { tables, output } = req.body;
        
        const result = await exporter.exportBaseInfo({
            tables: tables || '123',
            output: output
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 导出入库出库记录
router.post('/inbound-outbound', async (req, res) => {
    try {
        const { tables, dateFrom, dateTo, productCode, output } = req.body;
        
        const result = await exporter.exportInboundOutbound({
            tables: tables || '12',
            dateFrom,
            dateTo,
            productCode,
            output
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 导出应收应付明细
router.post('/receivable-payable', async (req, res) => {
    try {
        const { outboundFrom, outboundTo, paymentFrom, paymentTo, output } = req.body;
        
        const result = await exporter.exportReceivablePayable({
            outboundFrom,
            outboundTo,
            paymentFrom,
            paymentTo,
            output
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 文件下载API
router.get('/download', (req, res) => {
    const file = req.query.file;
    if (!file) {
        return res.status(400).json({ success: false, message: '缺少文件名参数' });
    }
    // 只允许下载exported-files目录下的文件
    const exportDir = path.resolve(__dirname, '../exported-files');
    const filePath = path.join(exportDir, file);
    if (!filePath.startsWith(exportDir)) {
        return res.status(403).json({ success: false, message: '非法文件路径' });
    }
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: '文件不存在' });
    }
    res.download(filePath, file);
});

// 获取导出状态（可选，用于长时间运行的导出任务）
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: '导出服务运行正常',
        available_exports: [
            {
                name: 'base-info',
                description: '基础信息导出（客户/供应商、产品、产品价格）',
                endpoint: '/api/export/base-info'
            },
            {
                name: 'inbound-outbound',
                description: '入库出库记录导出',
                endpoint: '/api/export/inbound-outbound'
            },
            {
                name: 'receivable-payable',
                description: '应收应付明细导出',
                endpoint: '/api/export/receivable-payable'
            }
        ]
    });
});

module.exports = router;
