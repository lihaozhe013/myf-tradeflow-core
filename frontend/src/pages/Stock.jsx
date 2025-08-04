import React, { useState, useEffect, useCallback } from "react";
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

const { Title } = Typography;

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productFilter, setProductFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [totalCostEstimate, setTotalCostEstimate] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const { t } = useTranslation();

  // 获取库存数据
  const fetchStockData = useCallback(
    async (page = 1, productModelFilter = productFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });
        if (productModelFilter) {
          params.append("product_model", productModelFilter);
        }
        const response = await fetch(`/api/stock?${params}`);
        const result = await response.json();
        if (response.ok && result.data) {
          setStockData(result.data);
          setPagination(result.pagination);
        } else {
          message.error(result.error || t("stock.fetchFailed"));
        }
      } catch (error) {
        console.error("获取库存数据失败:", error);
        message.error(t("stock.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, productFilter]
  );

  // 获取总成本估算
  const fetchTotalCostEstimate = useCallback(async () => {
    try {
      const response = await fetch("/api/stock/total-cost-estimate");
      const result = await response.json();
      if (response.ok) {
        setTotalCostEstimate(result.total_cost_estimate || 0);
      }
    } catch (error) {
      console.error("获取总成本估算失败:", error);
    }
  }, []);

  useEffect(() => {
    fetchStockData(1);
    fetchTotalCostEstimate();
  }, [fetchStockData, fetchTotalCostEstimate]);

  // 刷新库存缓存
  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/stock/refresh", {
        method: "POST",
      });
      const result = await response.json();
      if (response.ok) {
        message.success(t("stock.recalculated"));
        fetchStockData(1);
        fetchTotalCostEstimate();
      } else {
        message.error(t("stock.recalculateFailed"));
      }
    } catch (error) {
      console.error("库存缓存刷新失败:", error);
      message.error(t("stock.refreshCacheFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  // 处理产品筛选变化
  const handleProductFilterChange = (value) => {
    setProductFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchStockData(1, value);
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
            <Title level={3} style={{ margin: 0 }}>
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
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefreshCache}
                loading={refreshing}
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
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t("stock.paginationTotal", {
                  start: range[0],
                  end: range[1],
                  total,
                }),
              onChange: (page) => {
                setPagination((prev) => ({ ...prev, page }));
                fetchStockData(page);
              },
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Stock;
