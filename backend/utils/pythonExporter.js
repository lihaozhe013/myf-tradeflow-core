const { spawn } = require('child_process');
const path = require('path');

class PythonExporter {
    constructor() {
        this.scriptsPath = path.join(__dirname, 'python_scripts', 'export');
        this.pythonCommand = 'python'; // 根据系统可能需要改为 python3
    }

    /**
     * 执行 Python 脚本
     * @param {string} scriptName - 脚本名称
     * @param {string[]} args - 命令行参数
     * @returns {Promise<Object>} 执行结果
     */
    async executeScript(scriptName, args = []) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.scriptsPath, scriptName);
            const pythonProcess = spawn(this.pythonCommand, [scriptPath, ...args]);
            
            let stdout = '';
            let stderr = '';
            
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // 尝试解析 JSON 输出
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        // 如果不是 JSON 格式，返回文本结果
                        resolve({ success: true, message: stdout.trim() });
                    }
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                }
            });
            
            pythonProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * 导出基础信息
     * @param {Object} options - 选项
     * @param {string} options.tables - 要导出的表格编号，如 '123'
     * @param {string} options.output - 输出文件名
     * @returns {Promise<Object>} 导出结果
     */
    async exportBaseInfo(options = {}) {
        const args = ['--json'];
        
        if (options.tables) {
            args.push('--tables', options.tables);
        }
        
        if (options.output) {
            args.push('--output', options.output);
        }
        
        return this.executeScript('base-info.py', args);
    }

    /**
     * 导出入库出库记录
     * @param {Object} options - 选项
     * @param {string} options.tables - 要导出的表格编号，如 '12'
     * @param {string} options.dateFrom - 起始日期
     * @param {string} options.dateTo - 结束日期
     * @param {string} options.productCode - 产品代号
     * @param {string} options.output - 输出文件名
     * @returns {Promise<Object>} 导出结果
     */
    async exportInboundOutbound(options = {}) {
        const args = ['--json'];
        
        if (options.tables) {
            args.push('--tables', options.tables);
        }
        
        if (options.dateFrom) {
            args.push('--date-from', options.dateFrom);
        }
        
        if (options.dateTo) {
            args.push('--date-to', options.dateTo);
        }
        
        if (options.productCode) {
            args.push('--product-code', options.productCode);
        }
        
        if (options.output) {
            args.push('--output', options.output);
        }
        
        return this.executeScript('inbound-outbound.py', args);
    }

    /**
     * 导出应收应付明细
     * @param {Object} options - 选项
     * @param {string} options.outboundFrom - 出库/入库起始日期
     * @param {string} options.outboundTo - 出库/入库结束日期
     * @param {string} options.paymentFrom - 回款/付款起始日期
     * @param {string} options.paymentTo - 回款/付款结束日期
     * @param {string} options.output - 输出文件名
     * @returns {Promise<Object>} 导出结果
     */
    async exportReceivablePayable(options = {}) {
        const args = ['--json'];
        
        if (options.outboundFrom) {
            args.push('--outbound-from', options.outboundFrom);
        }
        
        if (options.outboundTo) {
            args.push('--outbound-to', options.outboundTo);
        }
        
        if (options.paymentFrom) {
            args.push('--payment-from', options.paymentFrom);
        }
        
        if (options.paymentTo) {
            args.push('--payment-to', options.paymentTo);
        }
        
        if (options.output) {
            args.push('--output', options.output);
        }
        
        return this.executeScript('receivable-payable.py', args);
    }
}

// 使用示例
async function example() {
    const exporter = new PythonExporter();
    
    try {
        // 导出基础信息
        const baseInfoResult = await exporter.exportBaseInfo({
            tables: '123',
            output: 'base_info_export.xlsx'
        });
        console.log('基础信息导出结果:', baseInfoResult);
        
        // 导出入库出库记录
        const inboundOutboundResult = await exporter.exportInboundOutbound({
            tables: '12',
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
            productCode: 'P001'
        });
        console.log('入库出库导出结果:', inboundOutboundResult);
        
        // 导出应收应付明细
        const receivablePayableResult = await exporter.exportReceivablePayable({
            outboundFrom: '2024-01-01',
            outboundTo: '2024-12-31',
            paymentFrom: '2024-01-01',
            paymentTo: '2024-12-31'
        });
        console.log('应收应付导出结果:', receivablePayableResult);
        
    } catch (error) {
        console.error('导出失败:', error);
    }
}

module.exports = PythonExporter;

// 如果直接运行此文件，执行示例
if (require.main === module) {
    example();
}
