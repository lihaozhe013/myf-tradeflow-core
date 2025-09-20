import React, { useState, useCallback, useEffect, useMemo } from "react";
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
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSimpleApi, useSimpleApiData } from "../hooks/useSimpleApi";

const { Title } = Typography;

const Stock = () => {
  const [productFilter, setProductFilter] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { t } = useTranslation();
  
  // 使用简化API hooks
  const { post, loading: actionLoading } = useSimpleApi();
  
  // 构建库存数据URL
  const buildStockUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: pagination.current.toString(),
    });
    if (productFilter) {
      params.append("product_model", productFilter);
    }
    return `/stock?${params}`;
  }, [productFilter, pagination.current]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 获取库存数据
  const { 
    data: stockResponse, 
    loading, 
    refetch: refreshStock 
  } = useSimpleApiData(buildStockUrl(), {
    data: [],
    pagination: { current: 1, pageSize: 10, total: 0 }
  });
  
  // 获取总成本估算
  const { 
    data: totalCostResponse, 
    refetch: refreshTotalCost 
  } = useSimpleApiData("/stock/total-cost-estimate", {
    total_cost_estimate: 0
  });
  
  // 安全地获取数据
  const stockData = useMemo(() => {
    return stockResponse?.data || [];
  }, [stockResponse?.data]);
  
  const totalCostEstimate = totalCostResponse?.total_cost_estimate || 0;

  // 当库存响应更新时，更新分页信息（参考ProductPrices的方式）
  useEffect(() => {
    if (stockResponse?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: stockResponse.pagination.total
      }));
    }
  }, [stockResponse]);

  // 当库存响应更新时，不需要手动更新分页信息，直接使用API返回的数据
  // useEffect已移除，因为我们直接使用paginationInfo

  // 刷新库存缓存
  const handleRefreshCache = async () => {
    try {
      await post('/stock/refresh', {});
      message.success(t("stock.recalculated"));
      refreshStock();
      refreshTotalCost();
    } catch {
      // 错误已经在useSimpleApi中处理
    }
  };

  // 处理产品筛选变化
  const handleProductFilterChange = (value) => {
    setProductFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
  };

  // 处理分页变化（参考ProductPrices的方式）
  const handleTableChange = (paginationTable) => {
    setPagination(prev => ({ ...prev, current: paginationTable.current }));
  };

  // 库存明细表格列定义
  const stockColumns = [
    {
      title: t("stock.productModel"),
      dataIndex: "product_model",
      key: "product_model",
      width: 200,
      sorter: (a, b) =>
        (a.product_model || "").localeCompare(b.product_model || ""),
    },
    {
      title: t("stock.currentStock"),
      dataIndex: "current_stock",
      key: "current_stock",
      width: 120,
      sorter: (a, b) => (a.current_stock || 0) - (b.current_stock || 0),
      render: (quantity) => {
        let color = "green";
        if (quantity === 0) color = "red";
        else if (quantity < 10) color = "orange";
        return <Tag color={color}>{quantity}</Tag>;
      },
    },
    {
      title: t("stock.status"),
      key: "stock_status",
      width: 100,
      render: (_, record) => {
        const quantity = record.current_stock || 0;
        if (quantity === 0)
          return <Tag color="red">{t("stock.outOfStock")}</Tag>;
        if (quantity < 10)
          return <Tag color="orange">{t("stock.lowStock")}</Tag>;
        return <Tag color="green">{t("stock.normal")}</Tag>;
      },
    },
    {
      title: t("stock.lastUpdate"),
      dataIndex: "last_update",
      key: "last_update",
      width: 180,
      sorter: (a, b) =>
        new Date(a.last_update || 0) - new Date(b.last_update || 0),
    },
  ];

  return (
    <div>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t("stock.title")}
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder={t("stock.searchProductModel")}
                prefix={<SearchOutlined />}
                value={productFilter}
                onChange={(e) => handleProductFilterChange(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<ReloadOutlined spin={actionLoading} />}
                onClick={handleRefreshCache}
                loading={actionLoading}
              >
                {t("stock.recalculate")}
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider />

        {/* 总成本估算显示区域 */}
        <Row
          justify="space-between"
          align="middle"
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #d9d9d9",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Col>
            <Space>
              <strong>{t("stock.totalCostEstimate")}: </strong>
              <Tag
                color="blue"
                style={{ fontSize: "14px", padding: "4px 8px" }}
              >
                ¥
                {totalCostEstimate.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          </Col>
        </Row>

        <div className="responsive-table">
          <Table
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
                t("stock.paginationTotal", {
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
