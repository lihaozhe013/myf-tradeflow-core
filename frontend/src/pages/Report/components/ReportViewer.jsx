import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Button,
  DatePicker,
  Select,
  Space,
  Table,
  Spin
} from 'antd';
import { SearchOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportViewer = ({
  loading,
  reportData,
  reportType,
  setReportType,
  dateRange,
  setDateRange,
  partners,
  products,
  selectedPartner,
  setSelectedPartner,
  selectedProduct,
  setSelectedProduct,
  generateReport,
  exportReport,
  getReportTitle,
  getColumns
}) => {
  return (
    <div>
      <Divider />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Text strong>报表类型：</Text>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="inbound">入库报表</Option>
            <Option value="outbound">出库报表</Option>
            <Option value="stock">库存报表</Option>
            <Option value="finance">财务报表</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Text strong>日期范围：</Text>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: '100%', marginTop: 8 }}
            format="YYYY-MM-DD"
            disabled={reportType === 'stock'}
          />
        </Col>
        <Col span={6}>
          <Text strong>合作伙伴：</Text>
          <Select
            value={selectedPartner}
            onChange={setSelectedPartner}
            style={{ width: '100%', marginTop: 8 }}
            placeholder="全部"
            allowClear
            showSearch
          >
            {partners.map(partner => (
              <Option key={partner.short_name} value={partner.short_name}>
                {partner.short_name} - {partner.full_name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Text strong>产品：</Text>
          <Select
            value={selectedProduct}
            onChange={setSelectedProduct}
            style={{ width: '100%', marginTop: 8 }}
            placeholder="全部"
            allowClear
            showSearch
          >
            {products.map(product => (
              <Option key={product.product_model} value={product.product_model}>
                {product.product_model}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={generateReport}
              loading={loading}
            >
              生成报表
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => exportReport('excel')}
              disabled={!reportData}
            >
              导出Excel
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportReport('csv')}
              disabled={!reportData}
            >
              导出CSV
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 报表数据展示 */}
      {loading && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>正在生成报表...</Text>
            </div>
          </div>
        </Card>
      )}

      {reportData && !loading && (
        <Card style={{ marginTop: 16 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {getReportTitle()} - {reportType === 'stock' ? '当前库存' : `${dateRange[0].format('YYYY-MM-DD')} 至 ${dateRange[1].format('YYYY-MM-DD')}`}
              </Title>
            </Col>
            <Col>
              <Text type="secondary">
                共 {reportData.length || 0} 条记录
              </Text>
            </Col>
          </Row>

          <Divider />

          <div className="responsive-table">
            <Table
              columns={getColumns()}
              dataSource={reportData}
              rowKey={(record, index) => index}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
              summary={(pageData) => {
                if (reportType === 'inbound' || reportType === 'outbound') {
                  const totalQuantity = pageData.reduce((sum, record) => sum + (record.quantity || 0), 0);
                  const totalPrice = pageData.reduce((sum, record) => sum + (record.total_price || 0), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>当前页小计</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{totalQuantity}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                      <Table.Summary.Cell index={3}>
                        <strong>¥{totalPrice.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} colSpan={2} />
                    </Table.Summary.Row>
                  );
                }
                return null;
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportViewer;
