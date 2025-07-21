import React from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
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
      title={editingPayment ? '编辑回款记录' : '新增回款记录'}
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
          label="客户代号"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select
            placeholder="请选择客户"
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
          label="回款金额"
          rules={[
            { required: true, message: '请输入回款金额' },
            { type: 'number', message: '请输入有效的数字' }
          ]}
        >
          <InputNumber
            placeholder="请输入回款金额（支持负数调整）"
            style={{ width: '100%' }}
            precision={2}
            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="pay_date"
          label="回款日期"
          rules={[{ required: true, message: '请选择回款日期' }]}
        >
          <DatePicker
            placeholder="请选择回款日期"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="pay_method"
          label="回款方式"
          rules={[{ required: true, message: '请选择回款方式' }]}
        >
          <Select placeholder="请选择回款方式">
            {PAYMENT_METHODS.map(method => (
              <Option key={method} value={method}>
                {method}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea
            placeholder="请输入备注信息（可选）"
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
