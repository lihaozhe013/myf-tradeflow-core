import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react'
import React from 'react';
import Inbound from './pages/Inbound';
import Outbound from './pages/Outbound';
import Stock from './pages/Stock';
import Partners from './pages/Partners';
import Products from './pages/Products';
import ProductPrices from './pages/ProductPrices';
import Report from './pages/Report';
import Overview from './pages/Overview';
import { Menu, Layout, Alert } from 'antd';
import './App.css';

const { Header, Content } = Layout;

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <Alert
            message="页面加载出错"
            description="页面组件渲染时发生错误，请刷新页面重试。如果问题持续，请检查后端服务是否正常运行。"
            type="error"
            showIcon
            action={
              <button onClick={() => window.location.reload()}>
                刷新页面
              </button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const [count, setCount] = useState(0)

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/overview' || path === '/') return 'overview';
    if (path === '/inbound') return 'inbound';
    if (path === '/outbound') return 'outbound';
    if (path === '/stock') return 'stock';
    if (path === '/partners') return 'partners';
    if (path === '/products') return 'products';
    if (path === '/product-prices') return 'product-prices';
    if (path === '/report') return 'report';
    return 'overview';
  };

  // 菜单项配置
  const menuItems = [
    {
      key: 'overview',
      label: <Link to="/overview">总览调试</Link>,
    },
    {
      key: 'inbound',
      label: <Link to="/inbound">入库管理</Link>,
    },
    {
      key: 'outbound',
      label: <Link to="/outbound">出库管理</Link>,
    },
    {
      key: 'stock',
      label: <Link to="/stock">库存明细</Link>,
    },
    {
      key: 'partners',
      label: <Link to="/partners">客户/供应商管理</Link>,
    },
    {
      key: 'products',
      label: <Link to="/products">产品管理</Link>,
    },
    {
      key: 'product-prices',
      label: <Link to="/product-prices">产品价格管理</Link>,
    },
    {
      key: 'report',
      label: <Link to="/report">报表导出</Link>,
    },
  ];

  return (
    <Layout>
      <Header>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/inbound" element={<Inbound />} />
            <Route path="/outbound" element={<Outbound />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product-prices" element={<ProductPrices />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </ErrorBoundary>
      </Content>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
