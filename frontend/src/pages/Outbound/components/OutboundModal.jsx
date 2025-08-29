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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  return (
    <Modal
      title={editingRecord ? t('outbound.editOutboundRecord') : t('outbound.addOutboundRecord')}
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
              label={t('outbound.customerCode')}
              name="customer_code"
              rules={[{ required: true, message: t('outbound.inputCustomerCode') }]}
            >
              <AutoComplete
                placeholder={t('outbound.inputCustomerCode')}
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
              label={t('outbound.customerShortName')}
              name="customer_short_name"
              rules={[{ required: true, message: t('outbound.inputCustomerShortName') }]}
            >
              <AutoComplete
                placeholder={t('outbound.inputCustomerShortName')}
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
              label={t('outbound.customerFullName')}
              name="customer_full_name"
            >
              <Input placeholder={t('outbound.autoFill')} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('outbound.productCode')}
              name="product_code"
              rules={[{ required: true, message: t('outbound.inputProductCode') }]}
            >
              <AutoComplete
                placeholder={t('outbound.inputProductCode')}
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
              label={t('outbound.productModel')}
              name="product_model"
              rules={[{ required: true, message: t('outbound.inputProductModel') }]}
            >
              <AutoComplete
                placeholder={t('outbound.inputProductModel')}
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
              label={t('outbound.outboundDate')}
              name="outbound_date"
              rules={[{ required: true, message: t('outbound.selectOutboundDate') }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('outbound.selectOutboundDate')}
                format="YYYY-MM-DD"
                onChange={onPartnerOrProductChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('outbound.quantity')}
              name="quantity"
              rules={[
                { required: true, message: t('outbound.inputQuantity') },
                { type: 'number', min: 1, message: t('outbound.quantityGreaterThanZero') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('outbound.inputQuantity')}
                min={1}
                onChange={onPriceOrQuantityChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('outbound.unitPriceInputType')}
              name="manual_price"
              initialValue={false}
            >
              <Radio.Group
                options={[
                  { label: t('outbound.autoFetch'), value: false },
                  { label: t('outbound.manualInput'), value: true },
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
              label={t('outbound.unitPrice')}
              name="unit_price"
              rules={[
                { required: true, message: t('outbound.inputUnitPrice') },
                { type: 'number' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('outbound.inputUnitPrice')}
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
              label={t('outbound.totalPrice')}
              name="total_price"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('outbound.autoCalc')}
                precision={3}
                disabled
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('outbound.invoiceDate')}
              name="invoice_date"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('outbound.selectInvoiceDate')}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('outbound.invoiceNumber')}
              name="invoice_number"
            >
              <Input placeholder={t('outbound.inputInvoiceNumber')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('outbound.orderNumber')}
              name="order_number"
            >
              <Input placeholder={t('outbound.inputOrderNumber')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('outbound.invoiceImageUrl')}
              name="invoice_image_url"
            >
              <Input placeholder={t('outbound.inputInvoiceImageUrl')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('outbound.remark')}
          name="remark"
        >
          <Input.TextArea
            placeholder={t('outbound.inputRemark')}
            rows={3}
          />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={() => setModalVisible(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" htmlType="submit">
            {editingRecord ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OutboundModal;
