const express = require('express');
const router = express.Router();
const ExcelExporter = require('../utils/excelExporter');

// 导出基础信息
router.post('/base-info', async (req, res) => {
    try {
        const { tables } = req.body;
        
        const exporter = new ExcelExporter();
        const buffer = await exporter.exportBaseInfo({
            tables: tables || '123'
        });
        
        const filename = exporter.generateFilename('base-info');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
    } catch (error) {
        console.error('基础信息导出失败:', error);
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 导出入库出库记录
router.post('/inbound-outbound', async (req, res) => {
    try {
        const { tables, dateFrom, dateTo, productCode, customerCode } = req.body;
        
        const exporter = new ExcelExporter();
        const buffer = await exporter.exportInboundOutbound({
            tables: tables || '12',
            dateFrom,
            dateTo,
            productCode,
            customerCode
        });
        
        const filename = exporter.generateFilename('inbound-outbound');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
    } catch (error) {
        console.error('入库出库记录导出失败:', error);
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 导出应收应付明细
router.post('/receivable-payable', async (req, res) => {
    try {
        const { outboundFrom, outboundTo, paymentFrom, paymentTo } = req.body;
        
        const exporter = new ExcelExporter();
        const buffer = await exporter.exportReceivablePayable({
            outboundFrom,
            outboundTo,
            paymentFrom,
            paymentTo
        });
        
        const filename = exporter.generateFilename('receivable-payable');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
    } catch (error) {
        console.error('应收应付明细导出失败:', error);
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`
        });
    }
});

// 获取导出状态
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: '导出服务运行正常 (Node.js原生实现)',
        version: '2.0 - Excel直接下载',
        available_exports: [
            {
                name: 'base-info',
                description: '基础信息导出（客户/供应商、产品、产品价格）',
                endpoint: '/api/export/base-info',
                method: 'POST',
                response_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            {
                name: 'inbound-outbound',
                description: '入库出库记录导出',
                endpoint: '/api/export/inbound-outbound',
                method: 'POST',
                response_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            {
                name: 'receivable-payable',
                description: '应收应付明细导出',
                endpoint: '/api/export/receivable-payable',
                method: 'POST',
                response_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        ],
        features: [
            '✅ 纯Node.js实现，无Python依赖',
            '✅ 内存导出，无临时文件',
            '✅ 直接下载，即时响应',
            '✅ Excel格式完全兼容',
            '✅ 支持并发导出请求'
        ]
    });
});

module.exports = router;
