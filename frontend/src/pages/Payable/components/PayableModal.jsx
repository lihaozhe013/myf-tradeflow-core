import React from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';

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

  // 付款方式选项
  const paymentMethods = [
    '现金',
    '银行转账',
    '支票',
    '银行承兑汇票',
    '商业承兑汇票',
    '支付宝',
    '微信支付',
    '其他'
  ];

  return (
    <Modal
      title={editingPayment ? '编辑付款记录' : '新增付款记录'}
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
          pay_method: '银行转账',
        }}
      >
        <Form.Item
          name="supplier_code"
          label="供应商代号"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select
            placeholder="请选择供应商"
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
          label="付款金额"
          rules={[
            { required: true, message: '请输入付款金额' },
            { type: 'number', min: 0.01, message: '付款金额必须大于0' }
          ]}
        >
          <InputNumber
            placeholder="请输入付款金额"
            style={{ width: '100%' }}
            precision={2}
            min={0.01}
            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="pay_date"
          label="付款日期"
          rules={[{ required: true, message: '请选择付款日期' }]}
        >
          <DatePicker
            placeholder="请选择付款日期"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="pay_method"
          label="付款方式"
          rules={[{ required: true, message: '请选择付款方式' }]}
        >
          <Select placeholder="请选择付款方式">
            {paymentMethods.map(method => (
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

export default PayableModal;
