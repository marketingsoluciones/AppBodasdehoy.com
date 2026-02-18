'use client';

import { DatePicker, Divider, Input, Select, Skeleton, Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import {
  Brain,
  CreditCard,
  Download,
  FileText,
  History,
  Image,
  Mail,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import dayjs from 'dayjs';

import { useBilling } from '@/hooks/useBilling';
import { useWallet } from '@/hooks/useWallet';
import { INVOICE_STATUS_LABELS, PLAN_TIER_LABELS } from '@/services/api2/invoices';

import ConsumptionChart from '@/components/credits/ConsumptionChart';
import UsageMetrics from '@/components/credits/UsageMetrics';
import RechargeModal from '@/components/Wallet/RechargeModal';

const useStyles = createStyles(({ css, token }) => ({
  actionButton: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 24px;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:disabled {
      background: ${token.colorBgContainerDisabled};
      cursor: not-allowed;
      transform: none;
    }
  `,
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 20px;
  `,
  cardHighlight: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    padding: 24px;
  `,
  secondaryButton: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorText};
    cursor: pointer;
    font-size: 14px;
    padding: 10px 16px;
    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
  sectionTitle: css`
    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  statLabel: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  statValue: css`
    font-size: 24px;
    font-weight: 700;
  `,
}));

const BillingPage = memo(() => {
  const { styles } = useStyles();
  const router = useRouter();
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Filtros de facturas
  const [invoiceFilters, setInvoiceFilters] = useState({
    endDate: undefined as string | undefined,
    search: '',
    startDate: undefined as string | undefined,
    status: undefined as string | undefined,
  });
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);

  // Wallet hook
  const {
    totalBalance,
    balance,
    bonusBalance,
    currency,
    loading: walletLoading,
    isLowBalance,
    formatBalance,
    startRecharge,
    refetchBalance,
    error: walletError,
  } = useWallet();

  // Billing hook
  const {
    subscription,
    subscriptionLoading,
    usageStats,
    usageStatsLoading,
    invoices,
    invoicesLoading,
    invoicesPagination,
    payments,
    paymentsLoading,
    fetchInvoices,
    fetchPayments,
    downloadInvoicePDF,
    refreshAll,
    error: billingError,
  } = useBilling();

  // Cargar datos iniciales
  useEffect(() => {
    fetchInvoices(1);
    fetchPayments(1);
  }, [fetchInvoices, fetchPayments]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    fetchInvoices(invoicePage, invoiceFilters.status as any);
  }, [invoicePage, invoiceFilters.status, fetchInvoices]);

  // Handle recharge
  const handleRecharge = async (amount: number) => {
    const result = await startRecharge(amount);
    return {
      error: result.error_message,
      success: result.success,
    };
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Invoice status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'default',
      PAID: 'success',
      PENDING: 'warning',
      UNCOLLECTIBLE: 'error',
      VOID: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Flexbox gap={24} style={{ maxWidth: 1024, padding: 24, width: '100%' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Facturacion y Pagos</h1>
        <button className={styles.secondaryButton} onClick={() => refreshAll()}>
          <Flexbox align="center" gap={6} horizontal>
            <RefreshCw size={14} />
            Actualizar
          </Flexbox>
        </button>
      </Flexbox>

      {/* Wallet Card */}
      <div className={styles.cardHighlight}>
        <Flexbox gap={16}>
          <Flexbox align="center" gap={8} horizontal>
            <Wallet size={24} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>Mi Wallet</span>
          </Flexbox>

          {walletLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : walletError && totalBalance === 0 ? (
            <Flexbox gap={8} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <span style={{ fontSize: 14 }}>⚠️ No se pudo cargar el saldo</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Error: {walletError}</span>
              <button
                onClick={() => refetchBalance()}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 6,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '6px 12px',
                }}
              >
                Reintentar
              </button>
            </Flexbox>
          ) : (
            // ✅ FIX: Mostrar saldo incluso si es 0
            <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
              <Flexbox gap={4}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Saldo Total</span>
                <span style={{ fontSize: 32, fontWeight: 700 }}>{formatBalance(totalBalance)}</span>
              </Flexbox>

              <Flexbox gap={4}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Saldo Principal</span>
                <span style={{ fontSize: 20, fontWeight: 600 }}>{formatBalance(balance)}</span>
              </Flexbox>

              {bonusBalance > 0 && (
                <Flexbox gap={4}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Bonificacion</span>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>{formatBalance(bonusBalance)}</span>
                </Flexbox>
              )}
            </Flexbox>
          )}

          <Flexbox gap={12} horizontal>
            <button
              className={styles.actionButton}
              onClick={() => setShowRechargeModal(true)}
              style={{ background: 'white', color: '#667eea' }}
            >
              <Flexbox align="center" gap={6} horizontal>
                <CreditCard size={16} />
                Recargar Saldo
              </Flexbox>
            </button>
          </Flexbox>

          {isLowBalance && (
            <Flexbox
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              Saldo bajo. Recarga para continuar usando los servicios.
            </Flexbox>
          )}
        </Flexbox>
      </div>

      {/* Subscription Card */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={20} />
          Mi Plan
        </div>

        {subscriptionLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : subscription ? (
          <Flexbox gap={16}>
            <Flexbox align="center" gap={16} horizontal style={{ flexWrap: 'wrap' }}>
              <Flexbox gap={4}>
                <span className={styles.statLabel}>Plan Actual</span>
                <span className={styles.statValue}>
                  {subscription.plan_name || PLAN_TIER_LABELS[subscription.plan_tier]}
                </span>
              </Flexbox>

              <Tag color={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
                {subscription.status}
              </Tag>

              {subscription.current_period_end && (
                <Flexbox gap={4}>
                  <span className={styles.statLabel}>Proximo Cobro</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(subscription.current_period_end)}</span>
                </Flexbox>
              )}
            </Flexbox>

            {subscription.limits && (
              <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                {subscription.limits.monthly_ai_tokens && (
                  <Tag>
                    Tokens: {subscription.limits.current_ai_tokens?.toLocaleString() || 0} /{' '}
                    {subscription.limits.monthly_ai_tokens.toLocaleString()}
                  </Tag>
                )}
                {subscription.limits.monthly_images && (
                  <Tag>
                    Imagenes: {subscription.limits.current_images || 0} /{' '}
                    {subscription.limits.monthly_images}
                  </Tag>
                )}
              </Flexbox>
            )}

            <Flexbox horizontal style={{ marginTop: 8 }}>
              <button
                className={styles.secondaryButton}
                onClick={() => router.push('/settings/billing/planes')}
                type="button"
              >
                Cambiar plan
              </button>
            </Flexbox>
          </Flexbox>
        ) : (
          <Flexbox gap={12}>
            <span>No tienes una suscripcion activa.</span>
            <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14 }}>
              Usa el sistema de prepago (wallet) para pagar por uso.
            </span>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push('/settings/billing/planes')}
              style={{ marginTop: 8 }}
              type="button"
            >
              Ver planes
            </button>
          </Flexbox>
        )}
      </div>

      {/* Balance / Uso de keys IA - Placeholder */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <Brain size={20} />
          Uso de keys IA
        </div>
        <Flexbox gap={8}>
          <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14 }}>
            El balance y uso de keys de IA se mostrara aqui cuando api-ia/API2 expongan el endpoint.
          </span>
          <Tag color="default">Proximamente</Tag>
        </Flexbox>
      </div>

      {/* Usage Stats - Detailed */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={20} />
          Uso Este Mes
        </div>

        {usageStatsLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : usageStats ? (
          <Flexbox gap={24}>
            {/* Métricas Principales */}
            {/* ✅ FIX: Asegurar que UsageMetrics siempre se muestre */}
            {usageStats && <UsageMetrics usageStats={usageStats} />}

            <Divider style={{ margin: '8px 0' }} />

            {/* Tokens IA */}
            {usageStats.ai_tokens && (
              <Flexbox gap={12}>
                <Flexbox align="center" gap={8} horizontal>
                  <Brain size={18} />
                  <span style={{ fontWeight: 600 }}>Tokens IA</span>
                  <Tag color="blue">{usageStats.ai_tokens.total?.toLocaleString() || 0} tokens</Tag>
                </Flexbox>
                {usageStats.ai_tokens.by_model && usageStats.ai_tokens.by_model.length > 0 && (
                  <Flexbox gap={8} style={{ marginLeft: 26 }}>
                    {usageStats.ai_tokens.by_model.map((m: any, idx: number) => (
                      <Flexbox align="center" gap={8} horizontal key={idx}>
                        <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13 }}>
                          {m.model}:
                        </span>
                        <span style={{ fontSize: 13 }}>
                          {m.tokens?.toLocaleString()} tokens
                        </span>
                        <span style={{ color: '#10b981', fontSize: 13 }}>
                          ({'\u20AC'}{m.cost?.toFixed(4) || '0.00'})
                        </span>
                      </Flexbox>
                    ))}
                  </Flexbox>
                )}
              </Flexbox>
            )}

            {/* Imagenes */}
            {usageStats.images && usageStats.images.total > 0 && (
              <Flexbox gap={12}>
                <Flexbox align="center" gap={8} horizontal>
                  <Image size={18} />
                  <span style={{ fontWeight: 600 }}>Imagenes Generadas</span>
                  <Tag color="purple">{usageStats.images.total} imagenes</Tag>
                </Flexbox>
                {usageStats.images.by_provider && usageStats.images.by_provider.length > 0 && (
                  <Flexbox gap={8} style={{ marginLeft: 26 }}>
                    {usageStats.images.by_provider.map((p: any, idx: number) => (
                      <Flexbox align="center" gap={8} horizontal key={idx}>
                        <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13 }}>
                          {p.provider}:
                        </span>
                        <span style={{ fontSize: 13 }}>{p.count} imgs</span>
                        <span style={{ color: '#10b981', fontSize: 13 }}>
                          ({'\u20AC'}{p.cost?.toFixed(2) || '0.00'})
                        </span>
                      </Flexbox>
                    ))}
                  </Flexbox>
                )}
              </Flexbox>
            )}

            {/* Comunicaciones: WhatsApp, SMS, Email */}
            {usageStats.communications && (
              <Flexbox gap={12}>
                <Flexbox align="center" gap={8} horizontal>
                  <MessageSquare size={18} />
                  <span style={{ fontWeight: 600 }}>Comunicaciones</span>
                  {usageStats.communications.total_cost > 0 && (
                    <Tag color="orange">
                      {'\u20AC'}{usageStats.communications.total_cost?.toFixed(2)}
                    </Tag>
                  )}
                </Flexbox>
                <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap', marginLeft: 26 }}>
                  {/* WhatsApp */}
                  {(usageStats.communications.whatsapp_sent > 0 || usageStats.communications.whatsapp_received > 0) && (
                    <Flexbox align="center" gap={6} horizontal style={{ minWidth: 180 }}>
                      <Smartphone size={14} style={{ color: '#25D366' }} />
                      <span style={{ fontSize: 13 }}>WhatsApp:</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {usageStats.communications.whatsapp_sent || 0} env /
                        {usageStats.communications.whatsapp_received || 0} rec
                      </span>
                    </Flexbox>
                  )}
                  {/* SMS */}
                  {usageStats.communications.sms_sent > 0 && (
                    <Flexbox align="center" gap={6} horizontal style={{ minWidth: 120 }}>
                      <MessageSquare size={14} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: 13 }}>SMS:</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {usageStats.communications.sms_sent}
                      </span>
                    </Flexbox>
                  )}
                  {/* Emails */}
                  {usageStats.communications.emails_sent > 0 && (
                    <Flexbox align="center" gap={6} horizontal style={{ minWidth: 120 }}>
                      <Mail size={14} style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: 13 }}>Emails:</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {usageStats.communications.emails_sent}
                      </span>
                    </Flexbox>
                  )}
                </Flexbox>
              </Flexbox>
            )}

            {/* Storage */}
            {usageStats.storage && usageStats.storage.total_gb > 0 && (
              <Flexbox gap={8}>
                <Flexbox align="center" gap={8} horizontal>
                  <span style={{ fontWeight: 600 }}>Almacenamiento</span>
                  <Tag>{usageStats.storage.total_gb?.toFixed(2)} GB</Tag>
                </Flexbox>
                <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13, marginLeft: 26 }}>
                  Transferencia: {usageStats.storage.transfer_gb?.toFixed(2) || 0} GB
                  ({'\u20AC'}{usageStats.storage.cost?.toFixed(2) || '0.00'})
                </span>
              </Flexbox>
            )}
          </Flexbox>
        ) : (
          <Flexbox gap={8}>
            <span style={{ color: 'var(--lobe-color-text-secondary)' }}>
              No hay datos de uso disponibles para este periodo.
            </span>
          </Flexbox>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Gráficos de Consumo */}
      {/* ✅ FIX: Mostrar siempre, incluso si no hay datos */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={20} />
          Gráficos de Consumo
        </div>
        {usageStats ? (
          <ConsumptionChart usageStats={usageStats} />
        ) : usageStatsLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Flexbox gap={8} style={{ padding: '24px 0', textAlign: 'center' }}>
            <span style={{ color: 'var(--lobe-color-text-secondary)' }}>
              No hay datos de consumo disponibles. Los gráficos aparecerán cuando haya uso registrado.
            </span>
          </Flexbox>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Enlaces Rápidos */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <History size={20} />
          Historiales y Reportes
        </div>
        <Flexbox gap={12} horizontal style={{ flexWrap: 'wrap' }}>
          <button
            className={styles.secondaryButton}
            onClick={() => router.push('/settings/billing/packages/history')}
          >
            <Flexbox align="center" gap={6} horizontal>
              <Package size={16} />
              Historial de Paquetes
            </Flexbox>
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => router.push('/settings/billing/transactions')}
          >
            <Flexbox align="center" gap={6} horizontal>
              <History size={16} />
              Historial de Transacciones
            </Flexbox>
          </button>
        </Flexbox>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Invoices */}
      <div className={styles.card}>
        <Flexbox align="center" horizontal justify="space-between" style={{ marginBottom: 16 }}>
          <div className={styles.sectionTitle}>
            <FileText size={20} />
            Facturas
          </div>
        </Flexbox>

        {/* Mostrar error si existe */}
        {billingError && (!invoices || invoices.length === 0) && !invoicesLoading && (
          <div style={{ 
            background: '#fff1f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 8, 
            color: '#cf1322', 
            marginBottom: 16,
            padding: 16
          }}>
            <strong>⚠️ Error:</strong> {billingError}
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Verifica que estés autenticado correctamente. Abre la consola del navegador (F12) para más detalles.
            </div>
            <button
              onClick={() => fetchInvoices(1)}
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
              Reintentar Cargar Facturas
            </button>
          </div>
        )}
        
        {/* ✅ FIX: Mostrar mensaje si no hay facturas pero no hay error */}
        {!billingError && (!invoices || invoices.length === 0) && !invoicesLoading && (
          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: 8, 
            color: '#389e0d', 
            marginBottom: 16,
            padding: 16
          }}>
            <strong>ℹ️ No hay facturas</strong>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
              Aún no tienes facturas. Las facturas aparecerán aquí cuando uses los servicios de la plataforma.
            </div>
          </div>
        )}

        {/* Filtros */}
        <Flexbox gap={12} horizontal style={{ flexWrap: 'wrap', marginBottom: 16 }}>
          <Input
            allowClear
            onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
            placeholder="Buscar por número de factura..."
            prefix={<Search size={16} />}
            style={{ maxWidth: 300 }}
            value={invoiceFilters.search}
          />
          <Select
            allowClear
            onChange={(value) => setInvoiceFilters({ ...invoiceFilters, status: value })}
            placeholder="Filtrar por estado"
            style={{ minWidth: 180 }}
            value={invoiceFilters.status}
          >
            <Select.Option value="DRAFT">Borrador</Select.Option>
            <Select.Option value="PENDING">Pendiente</Select.Option>
            <Select.Option value="PAID">Pagada</Select.Option>
            <Select.Option value="VOID">Anulada</Select.Option>
            <Select.Option value="UNCOLLECTIBLE">Incobrable</Select.Option>
          </Select>
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setInvoiceFilters({
                  ...invoiceFilters,
                  endDate: dates[1].format('YYYY-MM-DD'),
                  startDate: dates[0].format('YYYY-MM-DD'),
                });
              } else {
                setInvoiceFilters({
                  ...invoiceFilters,
                  endDate: undefined,
                  startDate: undefined,
                });
              }
            }}
            placeholder={['Fecha inicio', 'Fecha fin']}
            style={{ minWidth: 250 }}
          />
        </Flexbox>

        <Table
          columns={[
            {
              dataIndex: 'invoice_number',
              key: 'invoice_number',
              title: 'Numero',
            },
            {
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date: string) => formatDate(date),
              title: 'Fecha',
            },
            {
              dataIndex: 'total',
              key: 'total',
              render: (total: number, record: any) => `${record.currency === 'EUR' ? '\u20AC' : record.currency}${total.toFixed(2)}`,
              title: 'Total',
            },
            {
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                  {INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS] || status}
                </Tag>
              ),
              title: 'Estado',
            },
            {
              key: 'actions',
              render: (_: any, record: any) => (
                <Flexbox gap={8} horizontal>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => router.push(`/settings/billing/invoices/${record._id}`)}
                    style={{ padding: '4px 12px' }}
                  >
                    <Flexbox align="center" gap={4} horizontal>
                      <FileText size={14} />
                      Ver
                    </Flexbox>
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={async () => {
                      try {
                        console.log('🔍 [BillingPage] Descargando PDF de factura:', record._id);
                        const result = await downloadInvoicePDF(record._id);
                        if (!result.success) {
                          console.error('❌ [BillingPage] Error al descargar PDF:', result.error_message);
                          // El error ya se muestra en el hook
                        }
                      } catch (error) {
                        console.error('❌ [BillingPage] Excepción al descargar PDF:', error);
                      }
                    }}
                    style={{ padding: '4px 12px' }}
                    title="Descargar factura en PDF"
                  >
                    <Flexbox align="center" gap={4} horizontal>
                      <Download size={14} />
                      PDF
                    </Flexbox>
                  </button>
                </Flexbox>
              ),
              title: 'Acciones',
            },
          ]}
          dataSource={(invoices || []).filter((inv) => {
            // Filtro de búsqueda
            if (invoiceFilters.search && !inv.invoice_number.toLowerCase().includes(invoiceFilters.search.toLowerCase())) {
              return false;
            }
            // Filtro de fechas
            if (invoiceFilters.startDate || invoiceFilters.endDate) {
              const invoiceDate = dayjs(inv.created_at);
              if (invoiceFilters.startDate && invoiceDate.isBefore(dayjs(invoiceFilters.startDate), 'day')) {
                return false;
              }
              if (invoiceFilters.endDate && invoiceDate.isAfter(dayjs(invoiceFilters.endDate), 'day')) {
                return false;
              }
            }
            return true;
          })}
          loading={invoicesLoading}
          locale={{ emptyText: 'No hay facturas' }}
          pagination={{
            current: invoicePage,
            onChange: (page, pageSize) => {
              setInvoicePage(page);
              setInvoicePageSize(pageSize);
            },
            onShowSizeChange: (current, size) => {
              setInvoicePage(1);
              setInvoicePageSize(size);
            },
            pageSize: invoicePageSize,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} facturas`,
            total: invoicesPagination.total,
          }}
          rowKey="_id"
          size="small"
        />
      </div>

      {/* Payment History */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <History size={20} />
          Historial de Pagos
        </div>

        <Table
          columns={[
            {
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date: string) => formatDate(date),
              title: 'Fecha',
            },
            {
              dataIndex: 'description',
              key: 'description',
              title: 'Descripcion',
            },
            {
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number, record: any) => (
                <span style={{ color: amount >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {amount >= 0 ? '+' : ''}
                  {record.currency === 'EUR' ? '\u20AC' : record.currency}
                  {amount.toFixed(2)}
                </span>
              ),
              title: 'Monto',
            },
            {
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === 'succeeded' ? 'success' : 'warning'}>{status}</Tag>
              ),
              title: 'Estado',
            },
          ]}
          dataSource={payments}
          loading={paymentsLoading}
          locale={{ emptyText: 'No hay pagos registrados' }}
          pagination={{ pageSize: 5 }}
          rowKey="_id"
          size="small"
        />
      </div>

      {/* Recharge Modal */}
      <RechargeModal
        balanceCheck={null}
        isOpen={showRechargeModal}
        onClose={() => {
          console.log('🔍 [BillingPage] Cerrando modal de recarga');
          setShowRechargeModal(false);
        }}
        onRecharge={handleRecharge}
      />
    </Flexbox>
  );
});

BillingPage.displayName = 'BillingPage';

export default BillingPage;
