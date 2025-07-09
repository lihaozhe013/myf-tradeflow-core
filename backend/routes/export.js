const express = require('express');
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
