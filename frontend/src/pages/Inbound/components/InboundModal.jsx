import React from 'react';
import { useTranslation } from 'react-i18next';
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

const InboundModal = ({ 
  modalVisible, 
  setModalVisible, 
  editingRecord, 
  form, 
  partners, 
  products, 
  manualPrice,
  setManualPrice,
  onSave,
  onSupplierCodeChange,
  onSupplierShortNameChange,
  onProductCodeChange,
  onProductModelChange,
  onPartnerOrProductChange,
  onPriceOrQuantityChange
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      title={editingRecord ? t('inbound.editInboundRecord') : t('inbound.addInboundRecord')}
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
              label={t('inbound.supplierCode')}
              name="supplier_code"
              rules={[{ required: true, message: t('inbound.inputSupplierCode') }]}
            >
              <AutoComplete
                placeholder={t('inbound.inputSupplierCode')}
                onChange={onSupplierCodeChange}
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
              label={t('inbound.supplierShortName')}
              name="supplier_short_name"
              rules={[{ required: true, message: t('inbound.inputSupplierShortName') }]}
            >
              <AutoComplete
                placeholder={t('inbound.inputSupplierShortName')}
                onChange={onSupplierShortNameChange}
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
              label={t('inbound.supplierFullName')}
              name="supplier_full_name"
            >
              <Input placeholder={t('inbound.autoFill')} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('inbound.productCode')}
              name="product_code"
              rules={[{ required: true, message: t('inbound.inputProductCode') }]}
            >
              <AutoComplete
                placeholder={t('inbound.inputProductCode')}
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
              label={t('inbound.productModel')}
              name="product_model"
              rules={[{ required: true, message: t('inbound.inputProductModel') }]}
            >
              <AutoComplete
                placeholder={t('inbound.inputProductModel')}
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
              label={t('inbound.inboundDate')}
              name="inbound_date"
              rules={[{ required: true, message: t('inbound.selectInboundDate') }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('inbound.selectInboundDate')}
                format="YYYY-MM-DD"
                onChange={onPartnerOrProductChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('inbound.quantity')}
              name="quantity"
              rules={[
                { required: true, message: t('inbound.inputQuantity') },
                { type: 'number', min: 1, message: t('inbound.quantityGreaterThanZero') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('inbound.inputQuantity')}
                min={1}
                onChange={onPriceOrQuantityChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('inbound.unitPriceInputType')}
              name="manual_price"
              initialValue={false}
            >
              <Radio.Group
                options={[
                  { label: t('inbound.autoFetch'), value: false },
                  { label: t('inbound.manualInput'), value: true },
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
              label={t('inbound.unitPrice')}
              name="unit_price"
              rules={[
                { required: true, message: t('inbound.inputUnitPrice') },
                { type: 'number' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('inbound.inputUnitPrice')}
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
              label={t('inbound.totalPrice')}
              name="total_price"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('inbound.autoCalc')}
                precision={3}
                disabled
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('inbound.invoiceDate')}
              name="invoice_date"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('inbound.selectInvoiceDate')}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('inbound.invoiceNumber')}
              name="invoice_number"
            >
              <Input placeholder={t('inbound.inputInvoiceNumber')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('inbound.orderNumber')}
              name="order_number"
            >
              <Input placeholder={t('inbound.inputOrderNumber')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('inbound.invoiceImageUrl')}
              name="invoice_image_url"
            >
              <Input placeholder={t('inbound.inputInvoiceImageUrl')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('inbound.remark')}
          name="remark"
        >
          <Input.TextArea
            placeholder={t('inbound.inputRemark')}
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

export default InboundModal;
