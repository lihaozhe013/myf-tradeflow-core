import React from 'react';
import { Card, Space } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';

/**
 * 总库存变化趋势图表组件
 * @param {Object[]} stockTrend - 库存趋势数据
 */
const StockTrendChart = ({ stockTrend = [] }) => {
  // 处理库存趋势数据用于图表
  const getStockTrendData = () => {
    const dailyTotals = {};
    stockTrend.forEach((item) => {
      const date = item.date.split(' ')[0];
      const stockValue = Number(item.cumulative_stock);
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += isNaN(stockValue) ? 0 : stockValue;
    });
    return Object.entries(dailyTotals)
      .map(([date, total]) => ({
        date,
        value: Number((total / 1000).toFixed(2)),
        category: '总库存',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const data = getStockTrendData();

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          总库存变化趋势 (最近30天)
        </Space>
      }
      variant="outlined"
      style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
    >
      {data.length > 0 ? (
        <Line
          data={data}
          padding="auto"
          xField="date"
          yField="value"
          seriesField="category"
          xAxis={{ type: 'time' }}
          yAxis={{
            label: {
              formatter: (v) => `${v}k`,
            },
          }}
          color={['#1677ff']}
          point={{
            size: 4,
            shape: 'circle',
            style: {
              fill: '#1677ff',
              stroke: '#1677ff',
              lineWidth: 2,
            },
          }}
          tooltip={{
            formatter: (datum) => {
              const val = Number(datum.value) || 0;
              let valueStr = `${val}k件`;
              if (val < 0) {
                valueStr = `⚠️ ${val}k件 (负库存)`;
              }
              return {
                name: '总库存',
                value: valueStr,
              };
            },
          }}
          smooth={true}
          animation={{
            appear: {
              animation: 'path-in',
              duration: 1000,
            },
          }}
          height={300}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <LineChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>暂无库存变化数据</p>
        </div>
      )}
    </Card>
  );
};

export default StockTrendChart;
