import React from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Button, 
  Row, 
  Col, 
  AutoComplete,
  Radio
} from 'antd';

const { Option } = Select;

const OutboundModal = ({ 
  modalVisible, 
  setModalVisible, 
  editingRecord, 
  form, 
  partners, 
  products, 
  manualPrice,
  setManualPrice,
  onSave,
  onCustomerCodeChange,
  onCustomerShortNameChange,
  onProductCodeChange,
  onProductModelChange,
  onPartnerOrProductChange,
  onPriceOrQuantityChange
}) => {
  return (
    <Modal
      title={editingRecord ? '编辑出库记录' : '新增出库记录'}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="客户代号"
              name="customer_code"
              rules={[{ required: true, message: '请输入客户代号' }]}
            >
              <AutoComplete
                placeholder="请输入客户代号"
                onChange={onCustomerCodeChange}
                options={partners.map(partner => ({
                  value: partner.code,
                  label: `${partner.code} - ${partner.short_name}`
                }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="客户简称"
              name="customer_short_name"
              rules={[{ required: true, message: '请输入客户简称' }]}
            >
              <AutoComplete
                placeholder="请输入客户简称"
                onChange={onCustomerShortNameChange}
                options={partners.map(partner => ({
                  value: partner.short_name,
                  label: `${partner.short_name} - ${partner.code}`
                }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="客户全称"
              name="customer_full_name"
            >
              <Input placeholder="自动填充" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="产品代号"
              name="product_code"
              rules={[{ required: true, message: '请输入产品代号' }]}
            >
              <AutoComplete
                placeholder="请输入产品代号"
                onChange={onProductCodeChange}
                options={products.map(product => ({
                  value: product.code,
                  label: `${product.code} - ${product.product_model}`
                }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="产品型号"
              name="product_model"
              rules={[{ required: true, message: '请输入产品型号' }]}
            >
              <AutoComplete
                placeholder="请输入产品型号"
                onChange={onProductModelChange}
                options={products.map(product => ({
                  value: product.product_model,
                  label: `${product.product_model} - ${product.code}`
                }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="出库日期"
              name="outbound_date"
              rules={[{ required: true, message: '请选择出库日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择出库日期"
                format="YYYY-MM-DD"
                onChange={onPartnerOrProductChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="数量"
              name="quantity"
              rules={[
                { required: true, message: '请输入数量' },
                { type: 'number', min: 1, message: '数量必须大于0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入数量"
                min={1}
                onChange={onPriceOrQuantityChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="单价输入方式"
              name="manual_price"
              initialValue={false}
            >
              <Radio.Group
                options={[
                  { label: '自动获取', value: false },
                  { label: '手动输入', value: true },
                ]}
                onChange={e => {
                  setManualPrice(e.target.value);
                  if (!e.target.value) onPartnerOrProductChange();
                }}
                optionType="button"
                buttonStyle="solid"
                value={manualPrice}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="单价"
              name="unit_price"
              rules={[
                { required: true, message: '请输入单价' },
                { type: 'number' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入单价"
                precision={4}
                addonBefore="¥"
                onChange={onPriceOrQuantityChange}
                disabled={!manualPrice}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="总价"
              name="total_price"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="自动计算"
                precision={2}
                disabled
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="发票日期"
              name="invoice_date"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择发票日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="发票号码"
              name="invoice_number"
            >
              <Input placeholder="请输入发票号码" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="订单号"
              name="order_number"
            >
              <Input placeholder="请输入订单号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="发票图片链接"
              name="invoice_image_url"
            >
              <Input placeholder="请输入发票图片链接" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="备注"
          name="remark"
        >
          <Input.TextArea
            placeholder="请输入备注"
            rows={3}
          />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={() => setModalVisible(false)}>
            取消
          </Button>
          <Button type="primary" htmlType="submit">
            {editingRecord ? '保存' : '新增'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OutboundModal;
