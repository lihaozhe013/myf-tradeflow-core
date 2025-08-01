import React from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../../../config';

const { TextArea } = Input;
const { Option } = Select;

const ReceivableModal = ({
  visible,
  editingPayment,
  selectedCustomer,
  customers,
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
      title={editingPayment ? t('receivable.modalTitleEdit') : t('receivable.modalTitleAdd')}
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
          name="customer_code"
          label={t('receivable.customerCode')}
          rules={[{ required: true, message: t('receivable.selectCustomer') }]}
        >
          <Select
            placeholder={t('receivable.selectCustomer')}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={!!selectedCustomer}
          >
            {customers.map(customer => (
              <Option key={customer.code} value={customer.code}>
                {customer.code} - {customer.short_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label={t('receivable.paymentAmount')}
          rules={[
            { required: true, message: t('receivable.inputAmount') },
            { type: 'number', message: t('receivable.inputAmountValid') }
          ]}
        >
          <InputNumber
            placeholder={t('receivable.inputAmount') + '（支持负数调整）'}
            style={{ width: '100%' }}
            precision={2}
            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="pay_date"
          label={t('receivable.paymentDate')}
          rules={[{ required: true, message: t('receivable.inputDate') }]}
        >
          <DatePicker
            placeholder={t('receivable.inputDate')}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="pay_method"
          label={t('receivable.paymentMethod')}
          rules={[{ required: true, message: t('receivable.selectMethod') }]}
        >
          <Select placeholder={t('receivable.selectMethod')}>
            {PAYMENT_METHODS.map(method => (
              <Option key={method} value={method}>
                {method}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="remark"
          label={t('receivable.remark')}
        >
          <TextArea
            placeholder={t('receivable.inputRemark')}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReceivableModal;
