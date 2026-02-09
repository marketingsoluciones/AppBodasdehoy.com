'use client';

import { Breadcrumb, DatePicker, Input, Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { Download, Package, Search } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import dayjs from 'dayjs';

import { useWallet } from '@/hooks/useWallet';

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

const PackagesHistoryPage = memo(() => {
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
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    console.log('🔍 [PackagesHistoryPage] Cargando transacciones...');
    fetchTransactions(1, 100); // Cargar más transacciones para filtrar
  }, [fetchTransactions]);

  // Filtrar solo transacciones de tipo RECHARGE (compras de paquetes)
  const packagePurchases = transactions.filter((t) => t.type === 'RECHARGE');

  // Aplicar filtros
  const filteredPurchases = packagePurchases.filter((purchase) => {
    if (filters.search && !purchase.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.startDate || filters.endDate) {
      const purchaseDate = dayjs(purchase.created_at);
      if (filters.startDate && purchaseDate.isBefore(dayjs(filters.startDate), 'day')) {
        return false;
      }
      if (filters.endDate && purchaseDate.isAfter(dayjs(filters.endDate), 'day')) {
        return false;
      }
    }
    return true;
  });

  // Calcular resumen
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + Math.abs(p.amount || 0), 0);
  const totalPurchases = filteredPurchases.length;

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

  const handleExport = () => {
    // Crear CSV
    const headers = ['Fecha', 'Descripción', 'Monto', 'Método de Pago', 'Referencia'];
    const rows = filteredPurchases.map((p) => [
      formatDate(p.created_at),
      p.description || '-',
      formatCurrency(Math.abs(p.amount || 0)),
      p.payment_method || '-',
      p.payment_reference || p.stripe_payment_intent_id || '-',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compras-paquetes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Flexbox gap={24} style={{ maxWidth: 1200, padding: 24, width: '100%' }}>
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { title: <Link href="/settings/billing">Facturación</Link> },
          { title: 'Historial de Paquetes' },
        ]}
      />

      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Historial de Paquetes Comprados</h1>
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
            <span className={styles.summaryLabel}>Total Gastado</span>
            <span className={styles.summaryValue}>{formatCurrency(totalSpent)}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Total Compras</span>
            <span className={styles.summaryValue}>{totalPurchases}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Promedio por Compra</span>
            <span className={styles.summaryValue}>
              {totalPurchases > 0 ? formatCurrency(totalSpent / totalPurchases) : formatCurrency(0)}
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
          <Package size={20} />
          Compras Realizadas
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
            <strong>ℹ️ No hay compras registradas</strong>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Aún no has realizado compras de paquetes. Las compras aparecerán aquí cuando las realices.
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
              dataIndex: 'description',
              key: 'description',
              title: 'Descripción',
              width: '30%',
            },
            {
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number) => (
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(Math.abs(amount))}</span>
              ),
              title: 'Monto',
              width: 120,
            },
            {
              dataIndex: 'payment_method',
              key: 'payment_method',
              render: (method: string) => (method ? <Tag>{method}</Tag> : '-'),
              title: 'Método de Pago',
              width: 150,
            },
            {
              dataIndex: 'payment_reference',
              key: 'payment_reference',
              render: (ref: string, record: any) => ref || record.stripe_payment_intent_id || '-',
              title: 'Referencia',
              width: 200,
            },
            {
              dataIndex: 'balance_after',
              key: 'balance_after',
              render: (balance: number) => formatCurrency(balance || 0),
              title: 'Saldo Después',
              width: 120,
            },
          ]}
          dataSource={filteredPurchases.slice((page - 1) * pageSize, page * pageSize)}
          loading={transactionsLoading}
          locale={{ emptyText: 'No hay compras registradas' }}
          pagination={{
            current: page,
            onChange: (p, size) => {
              setPage(p);
              setPageSize(size);
            },
            pageSize,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} compras`,
            total: filteredPurchases.length,
          }}
          rowKey="_id"
          size="middle"
        />
      </div>
    </Flexbox>
  );
});

PackagesHistoryPage.displayName = 'PackagesHistoryPage';

export default PackagesHistoryPage;
