import React from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  DatePicker,
  Space,
  Form,
  Input
} from 'antd';
import { DatabaseOutlined, FileExcelOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const ExportPanel = ({ 
  handleExport, 
  loading, 
  dateRange, 
  setDateRange,
  paymentDateRange,
  setPaymentDateRange,
  selectedProduct,
  setSelectedProduct,
  selectedCustomer,
  setSelectedCustomer
}) => {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="基础信息导出" size="small">
            <Space wrap>
              <Button
                type="default"
                className="hover-primary"
                icon={<DatabaseOutlined />}
                onClick={() => handleExport('base-info', { tables: '123' })}
                loading={loading}
              >
                导出全部基础信息
              </Button>
              <Button
                type="default"
                className="hover-primary"
                icon={<DatabaseOutlined />}
                onClick={() => handleExport('base-info', { tables: '1' })}
                loading={loading}
              >
                仅导出客户/供应商
              </Button>
              <Button
                type="default"
                className="hover-primary"
                icon={<DatabaseOutlined />}
                onClick={() => handleExport('base-info', { tables: '2' })}
                loading={loading}
              >
                仅导出产品
              </Button>
              <Button
                type="default"
                className="hover-primary"
                icon={<DatabaseOutlined />}
                onClick={() => handleExport('base-info', { tables: '3' })}
                loading={loading}
              >
                仅导出产品价格
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="入库出库记录导出" size="small">
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="日期范围">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item label="产品代号">
                <Input
                  placeholder="可选"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item label="合作伙伴代号">
                <Input
                  placeholder="可选"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  style={{ width: 120 }}
                />
              </Form.Item>
            </Form>
            <Space wrap>
              <Button
                type="default"
                className="hover-primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('inbound-outbound', {
                  tables: '12',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined,
                  customerCode: selectedCustomer || undefined
                })}
                loading={loading}
              >
                导出入库出库记录
              </Button>
              <Button
                type="default"
                className="hover-primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('inbound-outbound', {
                  tables: '1',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined,
                  customerCode: selectedCustomer || undefined
                })}
                loading={loading}
              >
                仅导出入库记录
              </Button>
              <Button
                type="default"
                className="hover-primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('inbound-outbound', {
                  tables: '2',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined,
                  customerCode: selectedCustomer || undefined
                })}
                loading={loading}
              >
                仅导出出库记录
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="应收应付明细导出" size="small">
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="出入库日期">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item label="回付款日期">
                <RangePicker
                  value={paymentDateRange}
                  onChange={setPaymentDateRange}
                  format="YYYY-MM-DD"
                  placeholder={['回付款开始日期', '回付款结束日期']}
                />
              </Form.Item>
            </Form>
            <Space wrap>
              <Button
                type="default"
                className="hover-primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('receivable-payable', {
                  outboundFrom: dateRange[0].format('YYYY-MM-DD'),
                  outboundTo: dateRange[1].format('YYYY-MM-DD'),
                  paymentFrom: paymentDateRange[0].format('YYYY-MM-DD'),
                  paymentTo: paymentDateRange[1].format('YYYY-MM-DD')
                })}
                loading={loading}
              >
                导出应收应付明细
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExportPanel;
