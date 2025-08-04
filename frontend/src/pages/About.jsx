import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Image } from 'antd';

const { Title, Paragraph, Text } = Typography;

function About() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/about');
      if (!response.ok) {
        throw new Error('获取关于信息失败');
      }
      const data = await response.json();
      setAboutData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
      <Row gutter={[32, 32]} align="middle">
        <Col xs={24} md={16}>
          <Title level={1} style={{ color: '#1890ff', marginBottom: '24px' }}>
            {aboutData?.title || '关于我们'}
          </Title>
          
          <div style={{ marginBottom: '32px' }}>
            <Title level={3} style={{ color: '#333' }}>
              {aboutData?.company?.name || '公司简介'}
            </Title>
            <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
              {aboutData?.company?.description || '这是一个专为小型贸易公司设计的进出货管理系统。'}
            </Paragraph>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <Title level={3} style={{ color: '#333' }}>
              系统信息
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>系统版本：</Text>
                <Text>{aboutData?.system?.version || '0.1.0'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>发布日期：</Text>
                <Text>{aboutData?.system?.releaseDate || '2025-01-01'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>技术栈：</Text>
                <Text>{aboutData?.system?.techStack || 'React + Node.js + SQLite'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>开发：</Text>
                <Text>{aboutData?.system?.team || '开发团队'}</Text>
              </Col>
            </Row>
          </div>

          <div>
            <Title level={3} style={{ color: '#333' }}>
              联系方式
            </Title>
            <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
              <Text strong>邮箱：</Text>{aboutData?.contact?.email || 'example@example.com'}<br />
              <Text strong>电话：</Text>{aboutData?.contact?.phone || '+1 xxx-xxx-xxxx'}<br />
              <Text strong>地址：</Text>{aboutData?.contact?.address || '火星'}
            </Paragraph>
          </div>
        </Col>
        
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Card
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <Image
              src="/logo.svg"
              alt="Company Logo"
              style={{ 
                width: '300px',
                height: '300px',
                objectFit: 'contain'
              }}
              preview={false}
            />
            <Title 
              level={4} 
              style={{ 
                color: '#fff', 
                marginTop: '20px',
                textAlign: 'center' 
              }}
            >
              {aboutData?.company?.name || 'ERP System'}
            </Title>
            <Paragraph style={{ color: '#f0f0f0', textAlign: 'center' }}>
              {aboutData?.company?.slogan || '定制ERP系统'}
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default About;
