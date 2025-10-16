import { useState, useEffect, useCallback, useMemo, type FC, type Key } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import type { TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs, { type Dayjs } from 'dayjs';
import { PlusOutlined } from '@ant-design/icons';
import { useSimpleApi, useSimpleApiData } from '@/hooks/useSimpleApi';
import InboundFilter from '@/pages/Inbound/components/InboundFilter';
import InboundTable from '@/pages/Inbound/components/InboundTable';
import InboundModal from '@/pages/Inbound/components/InboundModal.tsx';
import type {
  ApiListResponse,
  FetchParams,
  InboundFilters,
  InboundFormValues,
  InboundListResponse,
  InboundRecord,
  Partner,
  Product,
  SorterState,
} from './types';

const { Title } = Typography;

interface PaginationState {
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
}
const DEFAULT_PAGINATION: PaginationState = {
  current: 1,
  pageSize: 10,
  total: 0,
};

const Inbound: FC = () => {
  const { t } = useTranslation();
  const [inboundRecords, setInboundRecords] = useState<InboundRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InboundRecord | null>(null);
  const [form] = Form.useForm<InboundFormValues>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [filters, setFilters] = useState<InboundFilters>({
    supplier_short_name: undefined,
    product_model: undefined,
    dateRange: [null, null],
  });
  const [sorter, setSorter] = useState<SorterState>({});
  const [manualPrice, setManualPrice] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

  const { get, post, put, delete: deleteRequest } = useSimpleApi();

  const { data: partnersResponse } = useSimpleApiData<ApiListResponse<Partner>>('/partners', {
    data: [],
  });
  const { data: productsResponse } = useSimpleApiData<ApiListResponse<Product>>('/products', {
    data: [],
  });

  const partners = useMemo<Partner[]>(() => {
    const data = partnersResponse?.data;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(partner => partner.type === 0);
  }, [partnersResponse]);

  const products = useMemo<Product[]>(() => {
    const data = productsResponse?.data;
    return Array.isArray(data) ? data : [];
  }, [productsResponse]);

  const supplierShortName = filters.supplier_short_name ?? '';
  const productModel = filters.product_model ?? '';
  const [startDateRaw, endDateRaw] = filters.dateRange;
  const startDate = startDateRaw ?? '';
  const endDate = endDateRaw ?? '';

  const fetchInboundRecords = useCallback(
    async (params: FetchParams = {}) => {
      try {
        setLoading(true);
        const page = params.page ?? 1;
        const query = new URLSearchParams({
          page: String(page),
          supplier_short_name: params.supplier_short_name ?? supplierShortName,
          product_model: params.product_model ?? productModel,
          start_date: params.start_date ?? startDate,
          end_date: params.end_date ?? endDate,
          sort_field: params.sort_field ?? sorter.field ?? '',
          sort_order: params.sort_order ?? sorter.order ?? '',
        });

        const result = await get<InboundListResponse>(`/inbound?${query.toString()}`);

        setInboundRecords(Array.isArray(result?.data) ? result.data : []);
  setPagination((prev: PaginationState) => ({
          current: result?.pagination?.page ?? page,
          pageSize: result?.pagination?.limit ?? prev.pageSize,
          total: result?.pagination?.total ?? prev.total,
        }));
      } catch (error) {
        console.error('获取入库记录失败:', error);
        setInboundRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [endDate, get, productModel, sorter.field, sorter.order, startDate, supplierShortName]
  );

  useEffect(() => {
    fetchInboundRecords({ page: 1 });
  }, [fetchInboundRecords]);

  const handleAdd = (): void => {
    setEditingRecord(null);
    setManualPrice(false);
    form.resetFields();
    form.setFieldsValue({
      inbound_date: dayjs(),
      manual_price: false,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: InboundRecord): void => {
    setEditingRecord(record);
    const supplier = partners.find(partner => partner.short_name === record.supplier_short_name);
    const product = products.find(item => item.product_model === record.product_model);

    form.setFieldsValue({
      ...record,
      supplier_code: supplier?.code ?? '',
      product_code: product?.code ?? '',
      inbound_date: record.inbound_date ? dayjs(record.inbound_date) : null,
      invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
    });

    setManualPrice(Boolean(form.getFieldValue('manual_price')));
    setModalVisible(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteRequest(`/inbound/${id}`);
      message.success(t('common.deleteSuccess') ?? '删除成功');
      fetchInboundRecords();
    } catch (error) {
      console.error('删除失败:', error);
      message.error(t('common.deleteFailed') ?? '删除失败');
    }
  };

  const handleSave = async (values: InboundFormValues): Promise<void> => {
    try {
      const supplierCode = values.supplier_code;
      const supplierShortNameValue = values.supplier_short_name;
      const productCode = values.product_code;
      const productModelValue = values.product_model;

      if (supplierCode && supplierShortNameValue) {
        const supplier = partners.find(partner => partner.code === supplierCode);
        if (!supplier || supplier.short_name !== supplierShortNameValue) {
          message.error(t('inbound.supplierMismatch') ?? '供应商代号与简称不匹配，请重新选择');
          return;
        }
      }

      if (productCode && productModelValue) {
        const product = products.find(item => item.code === productCode);
        if (!product || product.product_model !== productModelValue) {
          message.error(t('inbound.productMismatch') ?? '产品代号与型号不匹配，请重新选择');
          return;
        }
      }

      const quantity = Number(values.quantity ?? 0);
      const unitPrice = Number(values.unit_price ?? 0);

      const payload = {
        ...values,
        inbound_date: values.inbound_date ? values.inbound_date.format('YYYY-MM-DD') : null,
        invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
        total_price: quantity * unitPrice,
      };

      if (editingRecord) {
        await put(`/inbound/${editingRecord.id}`, payload);
        message.success(t('inbound.editSuccess') ?? '修改成功');
      } else {
        await post('/inbound', payload);
        message.success(t('inbound.addSuccess') ?? '新增成功');
      }

      setModalVisible(false);
      fetchInboundRecords();
    } catch (error) {
      console.error('保存失败:', error);
      const errorMessage = error instanceof Error ? error.message : t('inbound.saveFailed') ?? '保存失败';
      message.error(errorMessage);
    }
  };

  const handleSupplierCodeChange = (value: string): void => {
    const supplier = partners.find(partner => partner.code === value);
    if (supplier) {
      form.setFieldsValue({
        supplier_short_name: supplier.short_name,
        supplier_full_name: supplier.full_name ?? null,
      });
    }
    handlePartnerOrProductChange();
  };

  const handleSupplierShortNameChange = (value: string): void => {
    const supplier = partners.find(partner => partner.short_name === value);
    if (supplier) {
      form.setFieldsValue({
        supplier_code: supplier.code ?? null,
        supplier_full_name: supplier.full_name ?? null,
      });
    }
    handlePartnerOrProductChange();
  };

  const handleProductCodeChange = (value: string): void => {
    const product = products.find(item => item.code === value);
    if (product) {
      form.setFieldsValue({
        product_model: product.product_model,
        product_category: product.category ?? null,
      });
    }
    handlePartnerOrProductChange();
  };

  const handleProductModelChange = (value: string): void => {
    const product = products.find(item => item.product_model === value);
    if (product) {
      form.setFieldsValue({
        product_code: product.code ?? null,
        product_category: product.category ?? null,
      });
    }
    handlePartnerOrProductChange();
  };

  const handlePartnerOrProductChange = async (): Promise<void> => {
    if (manualPrice) {
      return;
    }

    const supplierShortNameValue = form.getFieldValue('supplier_short_name') as string | undefined;
    const productModelValue = form.getFieldValue('product_model') as string | undefined;
    const inboundDateValue = form.getFieldValue('inbound_date') as Dayjs | undefined;

    if (supplierShortNameValue && productModelValue && inboundDateValue) {
      try {
        const data = await get<{ unit_price: number }>(
          `/product-prices/auto?partner_short_name=${encodeURIComponent(supplierShortNameValue)}&product_model=${encodeURIComponent(productModelValue)}&date=${inboundDateValue.format('YYYY-MM-DD')}`
        );
        form.setFieldsValue({ unit_price: data.unit_price });
        handlePriceOrQuantityChange();
      } catch (error) {
        console.error('获取价格失败:', error);
        form.setFieldsValue({ unit_price: 0 });
      }
    }
  };

  const handlePriceOrQuantityChange = (): void => {
    const quantityValue = Number(form.getFieldValue('quantity') ?? 0);
    const unitPriceValue = Number(form.getFieldValue('unit_price') ?? 0);
    form.setFieldsValue({ total_price: quantityValue * unitPriceValue });
  };

  const handleFilter = (): void => {
  setPagination((prev: PaginationState) => ({
      ...prev,
      current: 1,
    }));
    fetchInboundRecords({
      page: 1,
      supplier_short_name: filters.supplier_short_name,
      product_model: filters.product_model,
      start_date: filters.dateRange[0],
      end_date: filters.dateRange[1],
    });
  };

  const handleTableChange: TableProps<InboundRecord>['onChange'] = (paginationConfig, _filtersTable, sorterTable) => {
    const sorterResult = Array.isArray(sorterTable) ? sorterTable[0] : (sorterTable as SorterResult<InboundRecord> | undefined);
    const field = typeof sorterResult?.field === 'string' ? sorterResult.field : undefined;
    const order = sorterResult?.order === 'ascend' ? 'asc' : sorterResult?.order === 'descend' ? 'desc' : undefined;

    setSorter({ field, order });
  setPagination((prev: PaginationState) => ({
      ...prev,
      current: paginationConfig.current ?? prev.current,
    }));

    fetchInboundRecords({
      page: paginationConfig.current ?? 1,
      supplier_short_name: filters.supplier_short_name,
      product_model: filters.product_model,
      start_date: filters.dateRange[0],
      end_date: filters.dateRange[1],
      sort_field: field,
      sort_order: order,
    });
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t('nav.inbound')}
            </Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('inbound.addInboundRecord')}
            </Button>
          </Col>
        </Row>

        <InboundFilter
          filters={filters}
          setFilters={setFilters}
          partners={partners}
          products={products}
          onFilter={handleFilter}
        />

        <Divider />

        <InboundTable
          inboundRecords={inboundRecords}
          loading={loading}
          partners={partners}
          products={products}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTableChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              t('outbound.paginationTotal', {
                start: range[0],
                end: range[1],
                total,
              }),
          }}
        />
      </Card>

      <InboundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        editingRecord={editingRecord}
        form={form}
        partners={partners}
        products={products}
        manualPrice={manualPrice}
        setManualPrice={setManualPrice}
        onSave={handleSave}
        onSupplierCodeChange={handleSupplierCodeChange}
        onSupplierShortNameChange={handleSupplierShortNameChange}
        onProductCodeChange={handleProductCodeChange}
        onProductModelChange={handleProductModelChange}
        onPartnerOrProductChange={handlePartnerOrProductChange}
        onPriceOrQuantityChange={handlePriceOrQuantityChange}
      />
    </div>
  );
};

export default Inbound;
