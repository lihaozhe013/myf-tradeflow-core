import React from 'react';

// 报表工具函数

// 获取报表标题
export const getReportTitle = (reportType) => {
  switch (reportType) {
    case 'inbound':
      return '入库报表';
    case 'outbound':
      return '出库报表';
    case 'stock':
      return '库存报表';
    case 'finance':
      return '财务报表';
    default:
      return '报表';
  }
};

// 获取表格列定义
export const getColumns = (reportType) => {
  switch (reportType) {
    case 'inbound':
      return [
        { title: '入库单号', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: '供应商', dataIndex: 'partner_name', key: 'partner_name' },
        { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
        { title: '数量', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
        { title: '单价', dataIndex: 'unit_price', key: 'unit_price', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.unit_price - b.unit_price
        },
        { title: '总价', dataIndex: 'total_price', key: 'total_price', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_price - b.total_price
        },
        { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
        { title: '备注', dataIndex: 'remark', key: 'remark' }
      ];
    case 'outbound':
      return [
        { title: '出库单号', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: '客户', dataIndex: 'partner_name', key: 'partner_name' },
        { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
        { title: '数量', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
        { title: '单价', dataIndex: 'unit_price', key: 'unit_price', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.unit_price - b.unit_price
        },
        { title: '总价', dataIndex: 'total_price', key: 'total_price', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_price - b.total_price
        },
        { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
        { title: '备注', dataIndex: 'remark', key: 'remark' }
      ];
    case 'stock':
      return [
        { title: '产品分类', dataIndex: 'category', key: 'category' },
        { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
        { title: '总入库', dataIndex: 'total_inbound', key: 'total_inbound', 
          sorter: (a, b) => a.total_inbound - b.total_inbound
        },
        { title: '总出库', dataIndex: 'total_outbound', key: 'total_outbound', 
          sorter: (a, b) => a.total_outbound - b.total_outbound
        },
        { title: '当前库存', dataIndex: 'current_stock', key: 'current_stock', 
          sorter: (a, b) => a.current_stock - b.current_stock,
          render: (text) => {
            const stock = Number(text) || 0;
            return (
              <span style={{ color: stock < 0 ? '#ff4d4f' : stock === 0 ? '#faad14' : '#52c41a' }}>
                {stock}
              </span>
            );
          }
        },
        { title: '最后更新', dataIndex: 'last_update', key: 'last_update', 
          sorter: (a, b) => (a.last_update || '').localeCompare(b.last_update || '')
        }
      ];
    case 'finance':
      return [
        { title: '时间段', dataIndex: 'period', key: 'period', sorter: (a, b) => a.period.localeCompare(b.period) },
        { title: '总采购', dataIndex: 'total_purchase', key: 'total_purchase', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_purchase - b.total_purchase
        },
        { title: '总销售', dataIndex: 'total_sales', key: 'total_sales', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_sales - b.total_sales
        },
        { title: '利润', dataIndex: 'profit', key: 'profit', 
          render: (text) => {
            const profit = Number(text) || 0;
            return (
              <span style={{ color: profit < 0 ? '#ff4d4f' : '#52c41a' }}>
                ¥{profit.toFixed(2)}
              </span>
            );
          },
          sorter: (a, b) => a.profit - b.profit
        },
        { title: '已付款', dataIndex: 'total_payment', key: 'total_payment', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_payment - b.total_payment
        },
        { title: '已收款', dataIndex: 'total_collection', key: 'total_collection', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_collection - b.total_collection
        },
        { title: '净现金流', dataIndex: 'net_cash_flow', key: 'net_cash_flow', 
          render: (text) => {
            const flow = Number(text) || 0;
            return (
              <span style={{ color: flow < 0 ? '#ff4d4f' : '#52c41a' }}>
                ¥{flow.toFixed(2)}
              </span>
            );
          },
          sorter: (a, b) => a.net_cash_flow - b.net_cash_flow
        },
        { title: '应付款', dataIndex: 'total_payable', key: 'total_payable', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_payable - b.total_payable
        },
        { title: '应收款', dataIndex: 'total_receivable', key: 'total_receivable', 
          render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
          sorter: (a, b) => a.total_receivable - b.total_receivable
        }
      ];
    default:
      return [];
  }
};

// 导出为CSV
export const exportToCSV = (reportData, getColumns, getReportTitle, reportType, dateRange) => {
  const columns = getColumns(reportType);
  const headers = columns.map(col => col.title).join(',');
  const rows = reportData.map(row => 
    columns.map(col => {
      const value = row[col.dataIndex];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value || '';
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = reportType === 'stock' 
    ? `${getReportTitle(reportType)}_${new Date().toISOString().split('T')[0]}.csv`
    : `${getReportTitle(reportType)}_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.csv`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// 导出为Excel (简化版本，使用CSV格式但.xlsx扩展名)
export const exportToExcel = (reportData, getColumns, getReportTitle, reportType, dateRange) => {
  const columns = getColumns(reportType);
  const headers = columns.map(col => col.title).join('\t');
  const rows = reportData.map(row => 
    columns.map(col => row[col.dataIndex] || '').join('\t')
  );
  
  const excelContent = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = reportType === 'stock' 
    ? `${getReportTitle(reportType)}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `${getReportTitle(reportType)}_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
