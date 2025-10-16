import { useState, useCallback, useEffect, useMemo, type ChangeEvent, type FC } from 'react';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Table,
  Card,
  Typography,
  Row,
  Col,
  Input,
  Button,
  message,
  Space,
  Tag,
  Divider,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSimpleApi, useSimpleApiData } from '@/hooks/useSimpleApi';

const { Title } = Typography;

type StockStatusColor = 'green' | 'orange' | 'red';

type StockItem = {
  readonly product_model?: string;
  readonly current_stock?: number;
  readonly last_update?: string;
};

type PaginationInfo = {
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
};

type StockResponse = {
  readonly data: StockItem[];
  readonly pagination?: PaginationInfo;
};

type TotalCostResponse = {
  readonly total_cost_estimate: number;
};

const DEFAULT_PAGINATION: PaginationInfo = {
  current: 1,
  pageSize: 10,
  total: 0,
};

const Stock: FC = () => {
  const [productFilter, setProductFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const { t } = useTranslation();

  const { post, loading: actionLoading } = useSimpleApi();

  const buildStockUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: pagination.current.toString(),
    });

    if (productFilter) {
      params.append('product_model', productFilter);
    }

    return `/stock?${params.toString()}`;
  }, [pagination, productFilter]);

  const {
    data: stockResponse,
    loading,
    refetch: refreshStock,
  } = useSimpleApiData<StockResponse>(buildStockUrl(), {
    data: [],
    pagination: DEFAULT_PAGINATION,
  });

  const {
    data: totalCostResponse,
    refetch: refreshTotalCost,
  } = useSimpleApiData<TotalCostResponse>('/stock/total-cost-estimate', {
    total_cost_estimate: 0,
  });

  const stockData = useMemo<StockItem[]>(() => {
    return stockResponse?.data ?? [];
  }, [stockResponse?.data]);

  const totalCostEstimate = totalCostResponse?.total_cost_estimate ?? 0;

  useEffect(() => {
    if (!stockResponse?.pagination) {
      return;
    }

    setPagination(prev => ({
      current: stockResponse.pagination?.current ?? prev.current,
      pageSize: stockResponse.pagination?.pageSize ?? prev.pageSize,
      total: stockResponse.pagination?.total ?? prev.total,
    }));
  }, [stockResponse]);

  const handleRefreshCache = async (): Promise<void> => {
    try {
      await post('/stock/refresh', {});
      message.success(t('stock.recalculated'));
      refreshStock();
      refreshTotalCost();
    } catch {
      // 错误已经在 useSimpleApi 中处理
    }
  };

  const handleProductFilterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    setProductFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange: TableProps<StockItem>['onChange'] = paginationConfig => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current ?? prev.current,
    }));
  };

  const stockColumns: ColumnsType<StockItem> = [
    {
      title: t('stock.productModel'),
      dataIndex: 'product_model',
      key: 'product_model',
      width: 200,
      sorter: (a, b) => (a.product_model ?? '').localeCompare(b.product_model ?? ''),
    },
    {
      title: t('stock.currentStock'),
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 120,
      sorter: (a, b) => (a.current_stock ?? 0) - (b.current_stock ?? 0),
      render: quantity => {
        const value = quantity ?? 0;
        let color: StockStatusColor = 'green';

        if (value === 0) {
          color = 'red';
        } else if (value < 10) {
          color = 'orange';
        }

        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: t('stock.status'),
      key: 'stock_status',
      width: 100,
      render: (_, record) => {
        const quantity = record.current_stock ?? 0;

        if (quantity === 0) {
          return <Tag color="red">{t('stock.outOfStock')}</Tag>;
        }

        if (quantity < 10) {
          return <Tag color="orange">{t('stock.lowStock')}</Tag>;
        }

        return <Tag color="green">{t('stock.normal')}</Tag>;
      },
    },
    {
      title: t('stock.lastUpdate'),
      dataIndex: 'last_update',
      key: 'last_update',
      width: 180,
      sorter: (a, b) => new Date(a.last_update ?? 0).getTime() - new Date(b.last_update ?? 0).getTime(),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t('stock.title')}
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder={t('stock.searchProductModel')}
                prefix={<SearchOutlined />}
                value={productFilter}
                onChange={handleProductFilterChange}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<ReloadOutlined spin={actionLoading} />}
                onClick={handleRefreshCache}
                loading={actionLoading}
              >
                {t('stock.recalculate')}
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider />

        <Row
          justify="space-between"
          align="middle"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <Col>
            <Space>
              <strong>{t('stock.totalCostEstimate')}: </strong>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                ¥
                {totalCostEstimate.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          </Col>
        </Row>

        <div className="responsive-table">
          <Table<StockItem>
            columns={stockColumns}
            dataSource={stockData}
            rowKey="product_model"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('stock.paginationTotal', {
                  start: range[0],
                  end: range[1],
                  total,
                }),
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Stock;
