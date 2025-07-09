# 导出脚本使用说明

本文档说明如何使用重构后的导出脚本系统，支持交互式使用和 Node.js 集成。

## 目录结构

```
backend/
├── python_scripts/
│   ├── export/                    # 新的导出脚本目录
│   │   ├── base-info.py          # 基础信息导出（客户/供应商、产品、产品价格）
│   │   ├── inbound-outbound.py   # 入库出库记录导出
│   │   └── receivable-payable.py # 应收应付明细导出
│   ├── export-base-info.py       # 保留的原始交互脚本
│   ├── export-inbound-and-outbound.py  # 保留的原始交互脚本
│   └── export-receivable-and-payable.py # 保留的原始交互脚本
├── utils/
│   └── pythonExporter.js         # Node.js 导出工具类
└── routes/
    └── export.js                 # Express 路由
```

## 使用方式

### 1. 交互式使用（原有方式）

直接运行脚本，按提示输入参数：

```bash
# 导出基础信息
python backend/python_scripts/export/base-info.py

# 导出入库出库记录
python backend/python_scripts/export/inbound-outbound.py

# 导出应收应付明细
python backend/python_scripts/export/receivable-payable.py
```

### 2. 命令行使用（新增）

通过命令行参数调用，便于自动化：

```bash
# 导出基础信息
python backend/python_scripts/export/base-info.py --tables 123 --output base_info.xlsx --json

# 导出入库出库记录
python backend/python_scripts/export/inbound-outbound.py --tables 12 --date-from 2024-01-01 --date-to 2024-12-31 --json

# 导出应收应付明细
python backend/python_scripts/export/receivable-payable.py --outbound-from 2024-01-01 --outbound-to 2024-12-31 --json
```

### 3. Node.js 集成（新增）

在 Node.js 项目中调用：

```javascript
const PythonExporter = require('./utils/pythonExporter');

const exporter = new PythonExporter();

// 导出基础信息
const result = await exporter.exportBaseInfo({
    tables: '123',
    output: 'base_info_export.xlsx'
});

// 导出入库出库记录
const result = await exporter.exportInboundOutbound({
    tables: '12',
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    productCode: 'P001'
});

// 导出应收应付明细
const result = await exporter.exportReceivablePayable({
    outboundFrom: '2024-01-01',
    outboundTo: '2024-12-31',
    paymentFrom: '2024-01-01',
    paymentTo: '2024-12-31'
});
```

### 4. Express API 集成（新增）

在 `server.js` 中添加路由：

```javascript
const exportRoutes = require('./routes/export');
app.use('/api/export', exportRoutes);
```

前端可以通过以下 API 调用：

```javascript
// POST /api/export/base-info
{
    "tables": "123",
    "output": "base_info_export.xlsx"
}

// POST /api/export/inbound-outbound
{
    "tables": "12",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "productCode": "P001"
}

// POST /api/export/receivable-payable
{
    "outboundFrom": "2024-01-01",
    "outboundTo": "2024-12-31",
    "paymentFrom": "2024-01-01",
    "paymentTo": "2024-12-31"
}
```

## 参数说明

### 基础信息导出 (base-info.py)
- `--tables`: 要导出的表格编号（1=客户/供应商, 2=产品, 3=产品价格）
- `--output`: 输出文件名
- `--json`: 输出 JSON 格式结果

### 入库出库记录导出 (inbound-outbound.py)
- `--tables`: 要导出的表格编号（1=入库记录, 2=出库记录）
- `--date-from`: 起始日期 (YYYY-MM-DD)
- `--date-to`: 结束日期 (YYYY-MM-DD)
- `--product-code`: 产品代号
- `--output`: 输出文件名
- `--json`: 输出 JSON 格式结果

### 应收应付明细导出 (receivable-payable.py)
- `--outbound-from`: 出库/入库起始日期 (YYYY-MM-DD)
- `--outbound-to`: 出库/入库结束日期 (YYYY-MM-DD)
- `--payment-from`: 回款/付款起始日期 (YYYY-MM-DD)
- `--payment-to`: 回款/付款结束日期 (YYYY-MM-DD)
- `--output`: 输出文件名
- `--json`: 输出 JSON 格式结果

## 返回格式

所有脚本在 JSON 模式下返回统一格式：

```json
{
    "success": true,
    "message": "导出成功，文件名：export_20250709_143022.xlsx",
    "file_path": "export_20250709_143022.xlsx",
    "total_records": 150,
    "tables_exported": 3,
    "filters": {
        "date_from": "2024-01-01",
        "date_to": "2024-12-31"
    }
}
```

## 前端集成完成

本导出系统已集成到项目中，用户可以通过以下方式使用：

### 1. 页面内筛选导出
- 在入库/出库管理页面，使用筛选功能查看所需数据
- 直接在页面上导出筛选后的数据（Excel/CSV格式）
- 适合日常查看和轻量级数据导出

### 2. Python深度导出
- 通过后端API调用Python脚本进行深度导出
- 提供三种导出类型：
  - **基础信息导出**：客户/供应商、产品、产品价格
  - **入库出库记录导出**：支持日期范围和产品筛选
  - **应收应付明细导出**：每个客户/供应商单独成表

### 3. API 端点
所有导出功能通过以下 API 端点提供：
- `POST /api/export/base-info`
- `POST /api/export/inbound-outbound`
- `POST /api/export/receivable-payable`

### 4. 使用流程
1. 用户在前端点击导出按钮
2. 前端发送请求到 Node.js 后端
3. 后端调用 Python 脚本执行导出
4. Python 脚本生成 Excel 文件并返回结果
5. 前端显示导出成功消息和文件路径

## 前端集成示例

```javascript
// 前端导出按钮处理
async function handleExport(exportType, params) {
    try {
        const response = await fetch(`/api/export/${exportType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`导出成功！文件：${result.file_path}`);
            // 可以提供文件下载链接
        } else {
            alert(`导出失败：${result.message}`);
        }
    } catch (error) {
        alert(`导出失败：${error.message}`);
    }
}

// 使用示例
handleExport('base-info', { tables: '123' });
handleExport('inbound-outbound', { 
    tables: '12', 
    dateFrom: '2024-01-01', 
    dateTo: '2024-12-31' 
});
handleExport('receivable-payable', { 
    outboundFrom: '2024-01-01', 
    outboundTo: '2024-12-31' 
});
```

## 注意事项

1. 确保 Python 环境已安装所需依赖：`openpyxl`, `tabulate`
2. 根据系统情况，可能需要将 `python` 改为 `python3`
3. 所有导出文件默认生成在脚本所在目录
4. 建议在生产环境中添加文件路径验证和清理机制
5. 大数据量导出可能需要添加进度反馈机制

## 扩展建议

1. 添加导出进度监控
2. 支持多种导出格式（CSV、PDF 等）
3. 添加导出历史记录
4. 实现异步导出队列
5. 添加导出文件的自动清理机制
