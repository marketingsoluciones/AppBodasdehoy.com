'use client';

import { Breadcrumb, DatePicker, Input, Select, Skeleton, Table, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { Download, History, Search, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import dayjs from 'dayjs';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useWallet } from '@/hooks/useWallet';
import { WalletTransaction } from '@/services/api2/wallet';
import { useChatStore } from '@/store/chat';

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  expandedRow: css`
    background: ${token.colorFillAlter};
    border-radius: 8px;
    font-size: 12px;
    padding: 12px 16px;
  `,
  metaKey: css`
    color: ${token.colorTextSecondary};
    font-weight: 500;
    min-width: 120px;
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

// ─── Constants ───────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  ADJUSTMENT: 'Ajuste',
  BONUS: 'Bonificación',
  CONSUMPTION: 'Consumo',
  EXPIRATION: 'Expiración',
  RECHARGE: 'Recarga',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferencia',
};

const SKU_LABELS: Record<string, string> = {
  'SRV-AI-ANTHROPIC-HAIKU': 'Claude Haiku',
  'SRV-AI-ANTHROPIC-OPUS': 'Claude Opus',
  'SRV-AI-ANTHROPIC-SONNET': 'Claude Sonnet',
  'SRV-AI-IMAGE-DALLE2': 'DALL-E 2',
  'SRV-AI-IMAGE-DALLE3': 'DALL-E 3',
  'SRV-AI-IMAGE-FLUX': 'Flux',
  'SRV-AI-IMAGE-SD': 'Stable Diffusion',
  'SRV-AI-IMAGE-SDXL': 'SDXL',
  'SRV-AI-OPENAI-GPT35': 'GPT-3.5',
  'SRV-AI-OPENAI-GPT4': 'GPT-4',
  'SRV-AI-OPENAI-GPT4O': 'GPT-4o',
  'SRV-EMAIL-SES-SEND': 'Email',
  'SRV-SMS-TWILIO-ES': 'SMS España',
  'SRV-SMS-TWILIO-INTL': 'SMS Internacional',
  'SRV-STORAGE-CDN-GB': 'Almacenamiento CDN',
  'SRV-STORAGE-TRANSFER-GB': 'Transferencia',
  'SRV-WHATSAPP-MSG-INBOUND': 'WhatsApp Entrada',
  'SRV-WHATSAPP-MSG-OUTBOUND': 'WhatsApp Salida',
};

// ─── Expanded row content ─────────────────────────────────────────────────────

const ExpandedRow = memo<{ record: WalletTransaction; styles: ReturnType<typeof useStyles>['styles'] }>(
  ({ record, styles }) => {
    const fields: Array<{ label: string; value: React.ReactNode }> = [];

    if (record.service_sku) {
      fields.push({
        label: 'Servicio',
        value: (
          <span>
            {SKU_LABELS[record.service_sku] || record.service_sku}
            <Tag style={{ marginLeft: 8 }}>{record.service_sku}</Tag>
          </span>
        ),
      });
    }
    if (record.service_quantity !== undefined && record.service_quantity !== null) {
      fields.push({ label: 'Cantidad', value: `${record.service_quantity} unidades` });
    }
    if (record.unit_price !== undefined && record.unit_price !== null) {
      fields.push({ label: 'Precio unitario', value: `€${record.unit_price.toFixed(6)}` });
    }
    if (record.payment_method) {
      fields.push({ label: 'Método de pago', value: record.payment_method });
    }
    if (record.payment_reference) {
      fields.push({ label: 'Referencia', value: record.payment_reference });
    }
    if (record.stripe_payment_intent_id) {
      fields.push({
        label: 'Stripe ID',
        value: (
          <Tooltip title={record.stripe_payment_intent_id}>
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {record.stripe_payment_intent_id.slice(0, 20)}...
            </span>
          </Tooltip>
        ),
      });
    }
    if (record.metadata && Object.keys(record.metadata).length > 0) {
      const meta = record.metadata;
      if (meta.model) fields.push({ label: 'Modelo IA', value: meta.model });
      if (meta.provider) fields.push({ label: 'Proveedor', value: meta.provider });
      if (meta.input_tokens) fields.push({ label: 'Tokens entrada', value: meta.input_tokens.toLocaleString() });
      if (meta.output_tokens) fields.push({ label: 'Tokens salida', value: meta.output_tokens.toLocaleString() });
      if (meta.session_id) {
        fields.push({
          label: 'Sesión',
          value: (
            <Tooltip title={meta.session_id}>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{String(meta.session_id).slice(0, 16)}...</span>
            </Tooltip>
          ),
        });
      }
    }

    if (fields.length === 0) {
      return (
        <div className={styles.expandedRow}>
          <span style={{ opacity: 0.6 }}>Sin detalles adicionales</span>
        </div>
      );
    }

    return (
      <div className={styles.expandedRow}>
        <Flexbox gap={6} style={{ flexWrap: 'wrap' }}>
          {fields.map((f, i) => (
            <Flexbox gap={8} horizontal key={i}>
              <span className={styles.metaKey}>{f.label}:</span>
              <span>{f.value}</span>
            </Flexbox>
          ))}
        </Flexbox>
      </div>
    );
  }
);

ExpandedRow.displayName = 'ExpandedRow';

// ─── Balance evolution chart ──────────────────────────────────────────────────

const BalanceChart = memo<{ currency: string; transactions: WalletTransaction[] }>(
  ({ transactions, currency }) => {
    const symbol = currency === 'EUR' ? '€' : currency;

    const chartData = useMemo(() => {
      // Sort ascending by date, take last 50 transactions
      const sorted = [...transactions]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-50);

      return sorted.map((t) => ({
        balance: t.balance_after || 0,
        date: dayjs(t.created_at).format('DD/MM HH:mm'),
        type: t.type,
      }));
    }, [transactions]);

    if (chartData.length < 2) return null;

    const minBalance = Math.min(...chartData.map((d) => d.balance));
    const maxBalance = Math.max(...chartData.map((d) => d.balance));

    return (
      <div style={{ height: 200, width: '100%' }}>
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={chartData} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              interval="preserveStartEnd"
              style={{ fontSize: 10 }}
              tick={{ fill: 'var(--lobe-color-text-secondary)' }}
            />
            <YAxis
              domain={[Math.max(0, minBalance - 1), maxBalance + 1]}
              style={{ fontSize: 10 }}
              tick={{ fill: 'var(--lobe-color-text-secondary)' }}
              tickFormatter={(v) => `${symbol}${v.toFixed(0)}`}
              width={48}
            />
            <RechartsTooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: number) => [`${symbol}${value.toFixed(2)}`, 'Saldo']) as any}
              labelStyle={{ fontSize: 11 }}
            />
            <Area
              dataKey="balance"
              fill="url(#balanceGrad)"
              name="Saldo"
              stroke="#667eea"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

BalanceChart.displayName = 'BalanceChart';

// ─── Main page ────────────────────────────────────────────────────────────────

const TransactionsHistoryPage = memo(() => {
  const { styles } = useStyles();
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = JSON.parse(localStorage.getItem('dev-user-config') || '{}');
      const hasSSOCookie = document.cookie.includes('idTokenV0.1.0');
      return !!(hasSSOCookie || (saved?.userId && saved.userId !== 'visitante@guest.local'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      setIsCheckingAuth(false);
      return;
    }
    const timer = setTimeout(() => setIsCheckingAuth(false), 6000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

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
    fetchTransactions(1, 100);
  }, [fetchTransactions]);

  // ── Filters ──

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.startDate || filters.endDate) {
          const d = dayjs(t.created_at);
          if (filters.startDate && d.isBefore(dayjs(filters.startDate), 'day')) return false;
          if (filters.endDate && d.isAfter(dayjs(filters.endDate), 'day')) return false;
        }
        return true;
      }),
    [transactions, filters]
  );

  // ── Summaries ──

  const summary = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const t of filteredTransactions) {
      byType[t.type] = (byType[t.type] || 0) + Math.abs(t.amount || 0);
    }
    return byType;
  }, [filteredTransactions]);

  const totalConsumed = summary['CONSUMPTION'] || 0;
  const totalRecharged = summary['RECHARGE'] || 0;
  const totalBonus = summary['BONUS'] || 0;
  const totalRefunded = summary['REFUND'] || 0;
  const netBalance = totalRecharged + totalBonus + totalRefunded - totalConsumed;

  // ── Utils ──

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const symbol = currency === 'EUR' ? '€' : currency;
  const fmt = (n: number) => `${symbol}${n.toFixed(2)}`;

  const typeColor: Record<string, string> = {
    ADJUSTMENT: 'default',
    BONUS: 'warning',
    CONSUMPTION: 'error',
    EXPIRATION: 'default',
    RECHARGE: 'success',
    REFUND: 'processing',
    TRANSFER: 'blue',
  };

  // ── CSV Export ──

  const handleExport = () => {
    const headers = ['Fecha', 'Tipo', 'Descripción', 'SKU', 'Servicio', 'Cantidad', 'Monto', 'Saldo Después'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.created_at),
      TRANSACTION_TYPE_LABELS[t.type] || t.type,
      t.description || '-',
      t.service_sku || '-',
      t.service_sku ? (SKU_LABELS[t.service_sku] || t.service_sku) : '-',
      t.service_quantity?.toString() || '-',
      fmt(t.amount || 0),
      fmt(t.balance_after || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ── Auth loading skeleton ──

  if (isCheckingAuth && !isAuthenticated) {
    return (
      <Flexbox gap={24} style={{ maxWidth: 1200, padding: 24, width: '100%' }}>
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: 250 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </Flexbox>
    );
  }

  // ── Render ──

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
            <span className={styles.summaryValue}>{fmt(totalRecharged)}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Total Consumido</span>
            <span className={styles.summaryValue}>{fmt(totalConsumed)}</span>
          </Flexbox>
          <Flexbox gap={4}>
            <span className={styles.summaryLabel}>Balance Neto</span>
            <span className={styles.summaryValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
              <Flexbox align="center" gap={6} horizontal>
                {netBalance >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                {fmt(netBalance)}
              </Flexbox>
            </span>
          </Flexbox>
          {totalBonus > 0 && (
            <Flexbox gap={4}>
              <span className={styles.summaryLabel}>Bonificaciones</span>
              <span className={styles.summaryValue} style={{ fontSize: 20 }}>+{fmt(totalBonus)}</span>
            </Flexbox>
          )}
          {totalRefunded > 0 && (
            <Flexbox gap={4}>
              <span className={styles.summaryLabel}>Reembolsos</span>
              <span className={styles.summaryValue} style={{ fontSize: 20 }}>+{fmt(totalRefunded)}</span>
            </Flexbox>
          )}
        </Flexbox>
      </div>

      {/* Gráfico de evolución de saldo */}
      {transactions.length >= 2 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>
            <History size={20} />
            Evolución del Saldo
          </div>
          <BalanceChart currency={currency} transactions={transactions} />
        </div>
      )}

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
                setFilters({ ...filters, endDate: undefined, startDate: undefined });
              }
            }}
            placeholder={['Fecha inicio', 'Fecha fin']}
            style={{ minWidth: 250 }}
          />
          {(filters.type || filters.search || filters.startDate) && (
            <button
              onClick={() => setFilters({ endDate: undefined, search: '', startDate: undefined, type: undefined })}
              style={{
                background: 'transparent',
                border: '1px solid var(--lobe-color-border)',
                borderRadius: 6,
                color: 'var(--lobe-color-text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 12px',
              }}
            >
              Limpiar filtros
            </button>
          )}
        </Flexbox>
      </div>

      {/* Tabla */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <History size={20} />
          Transacciones
          {filteredTransactions.length !== transactions.length && (
            <Tag style={{ fontWeight: 400, marginLeft: 4 }}>
              {filteredTransactions.length} de {transactions.length}
            </Tag>
          )}
        </div>

        {walletError && transactions.length === 0 && !transactionsLoading && (
          <div
            style={{
              background: '#fff1f0',
              border: '1px solid #ffccc7',
              borderRadius: 8,
              color: '#cf1322',
              marginBottom: 16,
              padding: 16,
            }}
          >
            <strong>⚠️ Error:</strong> {walletError}
            <button
              onClick={() => fetchTransactions(1, 100)}
              style={{
                background: '#ff4d4f',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                display: 'block',
                fontSize: 12,
                marginTop: 12,
                padding: '8px 16px',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!walletError && transactions.length === 0 && !transactionsLoading && (
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              color: '#389e0d',
              marginBottom: 16,
              padding: 16,
            }}
          >
            <strong>ℹ️ Sin transacciones</strong>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Las transacciones aparecerán aquí cuando uses los servicios o recargues tu wallet.
            </div>
          </div>
        )}

        <Table<WalletTransaction>
          columns={[
            {
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date: string) => (
                <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(date)}</span>
              ),
              title: 'Fecha',
              width: 160,
            },
            {
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={typeColor[type]}>{TRANSACTION_TYPE_LABELS[type] || type}</Tag>
              ),
              title: 'Tipo',
              width: 120,
            },
            {
              dataIndex: 'description',
              key: 'description',
              render: (desc: string, record) => (
                <Flexbox gap={4}>
                  <span style={{ fontSize: 13 }}>{desc || '-'}</span>
                  {record.service_sku && (
                    <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 11 }}>
                      {SKU_LABELS[record.service_sku] || record.service_sku}
                    </span>
                  )}
                </Flexbox>
              ),
              title: 'Descripción / Servicio',
            },
            {
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number, record: WalletTransaction) => {
                const isPositive =
                  record.type === 'RECHARGE' || record.type === 'REFUND' || record.type === 'BONUS';
                return (
                  <span style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {isPositive ? '+' : ''}
                    {fmt(amount || 0)}
                  </span>
                );
              },
              title: 'Monto',
              width: 100,
            },
            {
              dataIndex: 'balance_after',
              key: 'balance_after',
              render: (balance: number) => (
                <span style={{ color: (balance || 0) < 0 ? '#ef4444' : undefined }}>
                  {fmt(balance || 0)}
                </span>
              ),
              title: 'Saldo resultante',
              width: 130,
            },
          ]}
          dataSource={filteredTransactions.slice((page - 1) * pageSize, page * pageSize)}
          expandable={{
            expandedRowRender: (record) => <ExpandedRow record={record} styles={styles} />,
            rowExpandable: (record) =>
              !!(
                record.service_sku ||
                record.payment_method ||
                record.stripe_payment_intent_id ||
                (record.metadata && Object.keys(record.metadata).length > 0)
              ),
          }}
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
          size="small"
        />
      </div>
    </Flexbox>
  );
});

TransactionsHistoryPage.displayName = 'TransactionsHistoryPage';

export default TransactionsHistoryPage;
