import React from 'react';
import { Card, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { currency_unit_symbol } from "@/config/types";

const AnalysisDetailTable = ({
  detailData,
  selectedCustomer,
  selectedProduct,
  customers
}) => {
  const { t } = useTranslation();

  // 格式化金额
  const formatCurrency = (amount) => {
    return `${currency_unit_symbol}${Number(amount || 0).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // 格式化百分比
  const formatPercentage = (rate) => {
    return `${Number(rate || 0).toFixed(2)}%`;
  };

  // 获取客户显示名称
  const getCustomerDisplayName = () => {
    if (!selectedCustomer || selectedCustomer === 'ALL') return t('analysis.allCustomers');
    const customer = customers.find(c => c.code === selectedCustomer);
    return customer ? customer.name : selectedCustomer;
  };

  // 获取产品显示名称
  const getProductDisplayName = () => {
    if (!selectedProduct || selectedProduct === 'ALL') return t('analysis.allProducts');
    return selectedProduct;
  };

  // 判断是否需要显示详细表格
  const shouldShowDetailTable = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    // 只有当指定了客户但产品为All，或指定了产品但客户为All时才显示详细表格
    return (hasSpecificCustomer && !hasSpecificProduct) || (!hasSpecificCustomer && hasSpecificProduct);
  };

  // 获取详细表格标题
  const getDetailTableTitle = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    if (hasSpecificCustomer && !hasSpecificProduct) {
      const customerName = getCustomerDisplayName();
      return t('analysis.customerProductDetail', { customer: customerName });
    } else if (!hasSpecificCustomer && hasSpecificProduct) {
      const productName = getProductDisplayName();
      return t('analysis.productCustomerDetail', { product: productName });
    }
    return '';
  };

  // 详细表格列配置
  const getDetailTableColumns = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    const baseColumns = [
      {
        title: t('analysis.salesAmount'),
        dataIndex: 'sales_amount',
        key: 'sales_amount',
        render: (value) => formatCurrency(value),
        align: 'right',
        sorter: (a, b) => a.sales_amount - b.sales_amount,
      },
      {
        title: t('analysis.cost'),
        dataIndex: 'cost_amount',
        key: 'cost_amount',
        render: (value) => formatCurrency(value),
        align: 'right',
        sorter: (a, b) => a.cost_amount - b.cost_amount,
      },
      {
        title: t('analysis.profit'),
        dataIndex: 'profit_amount',
        key: 'profit_amount',
        render: (value) => (
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(value)}
          </span>
        ),
        align: 'right',
        sorter: (a, b) => a.profit_amount - b.profit_amount,
      },
      {
        title: t('analysis.profitRate'),
        dataIndex: 'profit_rate',
        key: 'profit_rate',
        render: (value) => (
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatPercentage(value)}
          </span>
        ),
        align: 'right',
        sorter: (a, b) => a.profit_rate - b.profit_rate,
      },
    ];

    if (hasSpecificCustomer && !hasSpecificProduct) {
      // 显示产品列
      return [
        {
          title: t('analysis.product'),
          dataIndex: 'product_model',
          key: 'product_model',
          fixed: 'left',
          width: 150,
        },
        ...baseColumns
      ];
    } else if (!hasSpecificCustomer && hasSpecificProduct) {
      // 显示客户列
      return [
        {
          title: t('analysis.customer'),
          dataIndex: 'customer_code',
          key: 'customer_code',
          fixed: 'left',
          width: 150,
          render: (value) => {
            const customer = customers.find(c => c.code === value);
            return customer ? customer.name : value;
          },
        },
        ...baseColumns
      ];
    }
    
    return baseColumns;
  };

  if (!shouldShowDetailTable() || !detailData || detailData.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <Card title={getDetailTableTitle()}>
        <Table
          columns={getDetailTableColumns()}
          dataSource={detailData}
          rowKey={(record) => `${record.customer_code}_${record.product_model}`}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('analysis.totalRecords', { total }),
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default AnalysisDetailTable;
