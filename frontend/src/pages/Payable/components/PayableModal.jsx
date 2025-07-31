import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../../../config';

const { TextArea } = Input;
const { Option } = Select;

const PayableModal = ({
  visible,
  editingPayment,
  selectedSupplier,
  suppliers,
  form,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editingPayment ? t('payable.modalTitleEdit') : t('payable.modalTitleAdd')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          pay_method: DEFAULT_PAYMENT_METHOD,
        }}
      >
        <Form.Item
          name="supplier_code"
          label={t('payable.supplierCode')}
          rules={[{ required: true, message: t('payable.selectSupplier') }]}
        >
          <Select
            placeholder={t('payable.selectSupplier')}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={!!selectedSupplier}
          >
            {suppliers.map(supplier => (
              <Option key={supplier.code} value={supplier.code}>
                {supplier.code} - {supplier.short_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label={t('payable.paymentAmount')}
          rules={[
            { required: true, message: t('payable.inputAmount') },
            { type: 'number', message: t('payable.inputAmountValid') }
          ]}
        >
          <InputNumber
            placeholder={t('payable.inputAmount')}
            style={{ width: '100%' }}
            precision={2}
            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="pay_date"
          label={t('payable.paymentDate')}
          rules={[{ required: true, message: t('payable.inputDate') }]}
        >
          <DatePicker
            placeholder={t('payable.inputDate')}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="pay_method"
          label={t('payable.paymentMethod')}
          rules={[{ required: true, message: t('payable.selectMethod') }]}
        >
          <Select placeholder={t('payable.selectMethod')}>
            {PAYMENT_METHODS.map(method => (
              <Option key={method} value={method}>
                {method}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="remark"
          label={t('payable.remark')}
        >
          <TextArea
            placeholder={t('payable.inputRemark')}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayableModal;
