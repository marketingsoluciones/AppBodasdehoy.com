'use client';

import { Breadcrumb, DatePicker, Input, Select, Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { Download, History, Search } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import dayjs from 'dayjs';

import { useWallet } from '@/hooks/useWallet';
import { WalletTransaction } from '@/services/api2/wallet';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  sectionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  summaryCard: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    padding: 24px;
  `,
  summaryLabel: css`
    font-size: 12px;
    opacity: 0.9;
  `,
  summaryValue: css`
    font-size: 28px;
    font-weight: 700;
    margin-top: 4px;
  `,
}));

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  ADJUSTMENT: 'Ajuste',
  BONUS: 'Bonificación',
  CONSUMPTION: 'Consumo',
  RECHARGE: 'Recarga',
  REFUND: 'Reembolso',
};

const TransactionsHistoryPage = memo(() => {
  const { styles } = useStyles();
  const { 
    transactions, 
    transactionsLoading, 
    fetchTransactions, 
    hasMoreTransactions, 
    currency,
    error: walletError,
  } = useWallet();

  const [filters, setFilters] = useState({
    endDate: undefined as string | undefined,
    search: '',
    startDate: undefined as string | undefined,
    type: undefined as string | undefined,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    console.log('🔍 [TransactionsHistoryPage] Cargando transacciones...');
    fetchTransactions(1, 100); // Cargar más transacciones
  }, [fetchTransactions]);

  // Aplicar filtros
  const filteredTransactions = transactions.filter((t) => {
    if (filters.type && t.type !== filters.type) {
      return false;
    }
    if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.startDate || filters.endDate) {
      const transDate = dayjs(t.created_at);
      if (filters.startDate && transDate.isBefore(dayjs(filters.startDate), 'day')) {
        return false;
      }
      if (filters.endDate && transDate.isAfter(dayjs(filters.endDate), 'day')) {
        return false;
      }
    }
    return true;
  });

  // Calcular resumen
  const totalConsumed = filteredTransactions
    .filter((t) => t.type === 'CONSUMPTION')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const totalRecharged = filteredTransactions
    .filter((t) => t.type === 'RECHARGE')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const netBalance = totalRecharged - totalConsumed;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'EUR' ? '€' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ADJUSTMENT: 'default',
      BONUS: 'warning',
      CONSUMPTION: 'error',
      RECHARGE: 'success',
      REFUND: 'processing',
    };
    return colors[type] || 'default';
  };

  const handleExport = () => {
    // Crear CSV
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Saldo Después', 'SKU', 'Cantidad'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.created_at),
      TRANSACTION_TYPE_LABELS[t.type] || t.type,
      t.description || '-',
      formatCurrency(t.amount || 0),
      formatCurrency(t.balance_after || 0),
      t.service_sku || '-',
      t.service_quantity?.toString() || '-',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Flexbox gap={24} style={{ maxWidth: 1200, padding: 24, width: '100%' }}>
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { title: <Link href="/settings/billing">Facturación</Link> },
          { title: 'Historial de Transacciones' },
        ]}
      />

      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Historial de Transacciones</h1>
        <button
          onClick={handleExport}
          style={{
            background: 'var(--lobe-color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 20px',
          }}
        >
          <Flexbox align="center" gap={6} horizontal>
            <Download size={16} />
            Exportar CSV
          </Flexbox>
        </button>
      </Flexbox>

      {/* Resumen */}
      <div className={styles.summaryCard}>
        <Flexbox gap={24} horizontal style={{ flexWrap: 'wrap' }}>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Total Recargado</span>
            <span className={styles.summaryValue}>{formatCurrency(totalRecharged)}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Total Consumido</span>
            <span className={styles.summaryValue}>{formatCurrency(totalConsumed)}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Balance Neto</span>
            <span className={styles.summaryValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(netBalance)}
            </span>
          </Flexbox>
        </Flexbox>
      </div>

      {/* Filtros */}
      <div className={styles.card}>
        <Flexbox gap={12} horizontal style={{ flexWrap: 'wrap' }}>
          <Input
            allowClear
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Buscar en descripciones..."
            prefix={<Search size={16} />}
            style={{ maxWidth: 300 }}
            value={filters.search}
          />
          <Select
            allowClear
            onChange={(value) => setFilters({ ...filters, type: value })}
            placeholder="Filtrar por tipo"
            style={{ minWidth: 180 }}
            value={filters.type}
          >
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  endDate: dates[1].format('YYYY-MM-DD'),
                  startDate: dates[0].format('YYYY-MM-DD'),
                });
              } else {
                setFilters({
                  ...filters,
                  endDate: undefined,
                  startDate: undefined,
                });
              }
            }}
            placeholder={['Fecha inicio', 'Fecha fin']}
            style={{ minWidth: 250 }}
          />
        </Flexbox>
      </div>

      {/* Tabla */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <History size={20} />
          Transacciones
        </div>

        {walletError && transactions.length === 0 && !transactionsLoading && (
          <div style={{
            background: '#fff1f0',
            border: '1px solid #ffccc7',
            borderRadius: 8,
            color: '#cf1322',
            marginBottom: 16,
            padding: 16
          }}>
            <strong>⚠️ Error:</strong> {walletError}
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Verifica que estés autenticado correctamente. Abre la consola del navegador (F12) para más detalles.
            </div>
            <button
              onClick={() => fetchTransactions(1, 100)}
              style={{
                background: '#ff4d4f',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
                marginTop: 12,
                padding: '8px 16px',
              }}
            >
              Reintentar Cargar Transacciones
            </button>
          </div>
        )}

        {!walletError && transactions.length === 0 && !transactionsLoading && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            color: '#389e0d',
            marginBottom: 16,
            padding: 16
          }}>
            <strong>ℹ️ No hay transacciones registradas</strong>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Aún no tienes transacciones. Las transacciones aparecerán aquí cuando uses los servicios o recargues tu wallet.
            </div>
          </div>
        )}

        <Table
          columns={[
            {
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date: string) => formatDate(date),
              title: 'Fecha',
              width: 180,
            },
            {
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={getTransactionTypeColor(type)}>{TRANSACTION_TYPE_LABELS[type] || type}</Tag>
              ),
              title: 'Tipo',
              width: 120,
            },
            {
              dataIndex: 'description',
              key: 'description',
              title: 'Descripción',
              width: '25%',
            },
            {
              dataIndex: 'service_sku',
              key: 'service_sku',
              render: (sku: string) => (sku ? <Tag>{sku}</Tag> : '-'),
              title: 'SKU',
              width: 120,
            },
            {
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number, record: WalletTransaction) => {
                const isPositive = record.type === 'RECHARGE' || record.type === 'REFUND' || record.type === 'BONUS';
                return (
                  <span style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {isPositive ? '+' : ''}
                    {formatCurrency(amount || 0)}
                  </span>
                );
              },
              title: 'Monto',
              width: 120,
            },
            {
              dataIndex: 'balance_after',
              key: 'balance_after',
              render: (balance: number) => formatCurrency(balance || 0),
              title: 'Saldo Después',
              width: 120,
            },
          ]}
          dataSource={filteredTransactions.slice((page - 1) * pageSize, page * pageSize)}
          loading={transactionsLoading}
          locale={{ emptyText: 'No hay transacciones registradas' }}
          pagination={{
            current: page,
            onChange: (p, size) => {
              setPage(p);
              setPageSize(size);
            },
            pageSize,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} transacciones`,
            total: filteredTransactions.length,
          }}
          rowKey="_id"
          size="middle"
        />
      </div>
    </Flexbox>
  );
});

TransactionsHistoryPage.displayName = 'TransactionsHistoryPage';

export default TransactionsHistoryPage;
