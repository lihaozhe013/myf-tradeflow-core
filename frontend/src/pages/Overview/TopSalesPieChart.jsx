import { useEffect, useState } from 'react';
import { Card, Spin, Alert } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TopSalesPieChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 预定义颜色数组
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0', '#D9D9D9'];

  useEffect(() => {
    fetch('/api/overview/top-sales-products')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data.map(item => ({
            name: item.product_model,
            value: item.total_sales
          })));
          setError(null);
        } else {
          setError(res.error || '数据获取失败，请先刷新统计数据');
        }
      })
      .catch(e => setError('请求失败: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></Card>;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ minHeight: 280 }} />;
  }

  // 自定义标签渲染函数
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // 小于5%不显示标签

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card
      title="销售额分布（前10商品）"
      style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', minHeight: 280 }}
      bodyStyle={{ padding: '8px' }}
    >
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={140}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.name === '其他' ? '#d9d9d9' : COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, '销售额']}
            labelFormatter={(label) => `产品: ${label}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopSalesPieChart;
