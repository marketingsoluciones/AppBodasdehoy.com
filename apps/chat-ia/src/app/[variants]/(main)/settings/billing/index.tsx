'use client';

import { DatePicker, Divider, Input, Segmented, Select, Skeleton, Table, Tag } from 'antd';
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
import { INVOICE_STATUS_LABELS } from '@/services/api2/invoices';
import { walletService, SERVICE_SKUS, StoredPaymentMethod } from '@/services/api2/wallet';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import AutoRechargeCard from '@/components/credits/AutoRechargeCard';
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
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [usagePeriod, setUsagePeriod] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS'>('THIS_MONTH');
  const [paymentMethods, setPaymentMethods] = useState<StoredPaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

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
    fetchUsageStats,
    downloadInvoicePDF,
    refreshAll,
    error: billingError,
  } = useBilling();

  // Cargar datos iniciales — solo usuarios autenticados
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchInvoices(1);
    fetchPayments(1);
    // Cargar métodos de pago guardados
    setPaymentMethodsLoading(true);
    walletService.getPaymentMethods()
      .then(setPaymentMethods)
      .finally(() => setPaymentMethodsLoading(false));
  }, [isAuthenticated, currentUserId, fetchInvoices, fetchPayments]);

  // Aplicar filtros cuando cambien — solo usuarios autenticados
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchInvoices(invoicePage, invoiceFilters.status as any);
  }, [isAuthenticated, invoicePage, invoiceFilters.status, fetchInvoices]);

  // Refetch usage stats cuando cambia el período — solo usuarios autenticados
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUsageStats(usagePeriod);
  }, [isAuthenticated, usagePeriod, fetchUsageStats]);

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

  // Usuarios anónimos no tienen acceso a facturación ni configuración
  if (!isAuthenticated) {
    return (
      <Flexbox
        align="center"
        gap={24}
        justify="center"
        style={{ minHeight: 400, padding: 48, textAlign: 'center', width: '100%' }}
      >
        <div style={{ fontSize: 48 }}>🔒</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            Área exclusiva para usuarios registrados
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14, margin: '0 0 24px', maxWidth: 360 }}>
            La facturación, el historial de pagos y la configuración solo están disponibles
            para usuarios con cuenta. Vuelve al chat para continuar.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 24px',
            }}
          >
            Volver al chat
          </button>
        </div>
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={24} style={{ maxWidth: 1024, padding: 24, width: '100%' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Facturación y Pagos</h1>
        <button className={styles.secondaryButton} onClick={() => refreshAll()}>
          <Flexbox align="center" gap={6} horizontal>
            <RefreshCw size={14} />
            Actualizar
          </Flexbox>
        </button>
      </Flexbox>

      {/* ── Resumen superior: Saldo + Plan activo (2 columnas) ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Wallet Card */}
        <div className={styles.cardHighlight}>
          <Flexbox gap={12}>
            <Flexbox align="center" gap={8} horizontal>
              <Wallet size={20} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Mi Wallet</span>
            </Flexbox>

            {walletLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : walletError && totalBalance === 0 ? (
              <Flexbox gap={8} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {walletError === 'UNAUTHORIZED' ? (
                  <span style={{ fontSize: 13 }}>🔐 Sesión no autenticada</span>
                ) : walletError.includes('No existe wallet') || walletError.includes('not found') ? (
                  <span style={{ fontSize: 13 }}>💳 Wallet sin inicializar — se creará en tu primera recarga</span>
                ) : (
                  <span style={{ fontSize: 13 }}>⚠️ {walletError}</span>
                )}
                <button
                  onClick={() => refetchBalance()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 6,
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '4px 10px',
                    width: 'fit-content',
                  }}
                >
                  Reintentar
                </button>
              </Flexbox>
            ) : (
              <Flexbox gap={2}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Saldo disponible</span>
                <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{formatBalance(totalBalance)}</span>
                {bonusBalance > 0 && (
                  <span style={{ fontSize: 12, opacity: 0.75 }}>
                    {formatBalance(balance)} principal + {formatBalance(bonusBalance)} bonificación
                  </span>
                )}
              </Flexbox>
            )}

            {isLowBalance && !walletError && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, fontSize: 12, padding: '6px 10px' }}>
                ⚠️ Saldo bajo — recarga para continuar
              </div>
            )}

            <button
              className={styles.actionButton}
              onClick={() => setShowRechargeModal(true)}
              style={{ background: 'white', color: '#667eea', marginTop: 4 }}
            >
              <Flexbox align="center" gap={6} horizontal>
                <CreditCard size={15} />
                Recargar Saldo
              </Flexbox>
            </button>
          </Flexbox>
        </div>

        {/* Plan activo */}
        <div
          className={styles.card}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <Flexbox gap={12}>
            <Flexbox align="center" gap={8} horizontal>
              <TrendingUp size={20} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Plan activo</span>
            </Flexbox>

            {subscriptionLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : subscription ? (
              <Flexbox gap={8}>
                <Flexbox align="center" gap={10} horizontal style={{ flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 28, fontWeight: 700 }}>
                    {subscription.plan_name || subscription.plan_id}
                  </span>
                  <Tag color={subscription.status === 'ACTIVE' ? 'success' : 'warning'} style={{ fontSize: 12 }}>
                    {subscription.status === 'ACTIVE' ? 'Activo' : subscription.status}
                  </Tag>
                </Flexbox>
                {subscription.current_period_end && (
                  <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13 }}>
                    Próximo cobro: {formatDate(subscription.current_period_end)}
                  </span>
                )}
              </Flexbox>
            ) : (
              <Flexbox gap={4}>
                <span style={{ fontSize: 20, fontWeight: 600 }}>Prepago</span>
                <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13 }}>
                  Pago por uso — sin suscripción activa
                </span>
              </Flexbox>
            )}
          </Flexbox>

          <button
            className={styles.secondaryButton}
            onClick={() => router.push('/settings/billing/planes')}
            style={{ marginTop: 12 }}
            type="button"
          >
            {subscription ? 'Cambiar plan' : 'Ver planes disponibles'}
          </button>
        </div>
      </div>

      {/* Auto-recarga */}
      <AutoRechargeCard onConfigChange={refetchBalance} />

      {/* Métodos de pago */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <CreditCard size={20} />
          Métodos de pago
        </div>

        {paymentMethodsLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 12 }} />
        ) : paymentMethods.length > 0 ? (
          <Flexbox gap={8} style={{ marginTop: 12 }}>
            {paymentMethods.map((method) => {
              const brand = method.brand
                ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1)
                : 'Tarjeta';
              const expiry = method.exp_month && method.exp_year
                ? `${String(method.exp_month).padStart(2, '0')}/${method.exp_year}`
                : null;
              return (
                <Flexbox
                  key={method.id}
                  align="center"
                  gap={12}
                  horizontal
                  style={{
                    background: 'var(--ant-color-fill-quaternary, #f5f5f5)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <CreditCard size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <Flexbox gap={2}>
                    <span style={{ fontWeight: 600 }}>
                      {brand} ···· {method.last4 ?? '••••'}
                    </span>
                    {expiry && (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>Caduca {expiry}</span>
                    )}
                  </Flexbox>
                  {method.is_default && (
                    <Tag color="blue" style={{ marginLeft: 'auto' }}>
                      Predeterminada
                    </Tag>
                  )}
                </Flexbox>
              );
            })}
            <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13, marginTop: 4 }}>
              Tus tarjetas se guardan en Stripe de forma segura. Para añadir una nueva, realiza
              una recarga y guarda la tarjeta durante el proceso de pago.
            </span>
          </Flexbox>
        ) : (
          <Flexbox gap={12} style={{ marginTop: 12 }}>
            <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14 }}>
              No tienes tarjetas guardadas todavía.
            </span>
            <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 13 }}>
              Al hacer tu primera recarga en Stripe, podrás guardar tu tarjeta para futuros
              pagos y activar la auto-recarga.
            </span>
            <Flexbox horizontal style={{ marginTop: 4 }}>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowRechargeModal(true)}
                type="button"
              >
                <Flexbox align="center" gap={6} horizontal>
                  <CreditCard size={14} />
                  Añadir tarjeta (vía recarga)
                </Flexbox>
              </button>
            </Flexbox>
          </Flexbox>
        )}
      </div>

      {/* Usage Stats - Detailed */}
      <div className={styles.card}>
        <Flexbox align="center" horizontal justify="space-between" style={{ marginBottom: 16 }}>
          <div className={styles.sectionTitle} style={{ margin: 0 }}>
            <TrendingUp size={20} />
            Consumo
          </div>
          <Segmented
            onChange={(val) => setUsagePeriod(val as typeof usagePeriod)}
            options={[
              { label: 'Hoy', value: 'TODAY' },
              { label: 'Esta semana', value: 'THIS_WEEK' },
              { label: 'Este mes', value: 'THIS_MONTH' },
              { label: 'Últimos 30 días', value: 'LAST_30_DAYS' },
            ]}
            size="small"
            value={usagePeriod}
          />
        </Flexbox>

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
            {usageStats.images && (usageStats.images.total ?? 0) > 0 && (
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
                  {(usageStats.communications.total_cost ?? 0) > 0 && (
                    <Tag color="orange">
                      {'\u20AC'}{usageStats.communications.total_cost?.toFixed(2)}
                    </Tag>
                  )}
                </Flexbox>
                <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap', marginLeft: 26 }}>
                  {/* WhatsApp */}
                  {((usageStats.communications.whatsapp_sent ?? 0) > 0 || (usageStats.communications.whatsapp_received ?? 0) > 0) && (
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
                  {(usageStats.communications.sms_sent ?? 0) > 0 && (
                    <Flexbox align="center" gap={6} horizontal style={{ minWidth: 120 }}>
                      <MessageSquare size={14} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: 13 }}>SMS:</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {usageStats.communications.sms_sent}
                      </span>
                    </Flexbox>
                  )}
                  {/* Emails */}
                  {(usageStats.communications.emails_sent ?? 0) > 0 && (
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
            {usageStats.storage && (usageStats.storage.total_gb ?? 0) > 0 && (
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

      {/* Dev Tools — solo en development */}
      {process.env.NODE_ENV === 'development' && (
        <WalletDevTools />
      )}
    </Flexbox>
  );
});

BillingPage.displayName = 'BillingPage';

// ============================================================
// WalletDevTools — Solo visible en NODE_ENV=development
// Realiza llamadas REALES a la API de wallet para simular escenarios
// ============================================================

const WalletDevTools = memo(() => {
  const { totalBalance, formatBalance, refetchBalance } = useWallet();
  const userId = useUserStore((s) => userProfileSelectors.userId(s));
  const [devLog, setDevLog] = useState<string[]>([]);
  const [devLoading, setDevLoading] = useState(false);

  const log = (msg: string) => setDevLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);

  // 1. Consultar saldo real
  const handleCheckBalance = async () => {
    setDevLoading(true);
    try {
      const data = await walletService.getBalance();
      log(`✅ Balance real: ${data.total_balance} ${data.currency} (${data.status})`);
      await refetchBalance();
    } catch (e: any) {
      log(`❌ Error: ${e.message}`);
    } finally {
      setDevLoading(false);
    }
  };

  // 2. Consumir una pequeña cantidad real (simula gasto)
  const handleConsumeSmall = async () => {
    setDevLoading(true);
    try {
      const result = await walletService.checkAndConsume(
        SERVICE_SKUS.AI_ANTHROPIC_HAIKU,
        1,
        '[DEV] Simulación consumo test',
        { source: 'dev-tools', test: true }
      );
      if (result.success) {
        log(`✅ Consumido HAIKU x1. Saldo nuevo: ${result.new_balance}`);
      } else {
        log(`⚠️ No permitido: ${result.error_message || result.error_code}`);
        if (result.balance_check?.allowed === false) {
          log(`  Falta: €${result.balance_check.shortfall} (saldo: €${result.balance_check.total_balance})`);
          useChatStore.setState({ showInsufficientBalance: true });
        }
      }
      await refetchBalance();
    } catch (e: any) {
      log(`❌ Error: ${e.message}`);
    } finally {
      setDevLoading(false);
    }
  };

  // 3. Verificar si hay saldo para un monto dado
  const handleCheckAffordability = async () => {
    setDevLoading(true);
    try {
      const check = await walletService.checkBalance(0.05);
      log(`${check.allowed ? '✅' : '❌'} ¿Puede pagar €0.05? → ${check.allowed ? 'SÍ' : `NO (falta €${check.shortfall})`}`);
      log(`  Saldo actual: €${check.total_balance}`);
      if (!check.allowed) {
        useChatStore.setState({ showInsufficientBalance: true });
      }
    } catch (e: any) {
      log(`❌ Error: ${e.message}`);
    } finally {
      setDevLoading(false);
    }
  };

  // 4. Activar estados UI directamente (sin API)
  const handleShowModal = () => {
    useChatStore.setState({ showInsufficientBalance: true });
    log('🔔 Modal de recarga activado (sin llamada real)');
  };

  const handleShowBanner = () => {
    useChatStore.setState({ negativeBalanceMode: true });
    log('🔔 Banner modo crédito activado (sin llamada real)');
  };

  const handleReset = () => {
    useChatStore.setState({ showInsufficientBalance: false, negativeBalanceMode: false });
    log('🔄 Estados UI reseteados');
  };

  // 5. Drenar saldo a €0 via proxy server-side (requiere ADMIN_API_KEY en .env.local)
  const handleDrainBalance = async () => {
    if (!userId) {
      log('❌ userId no disponible — inicia sesión primero');
      return;
    }
    if (totalBalance <= 0) {
      log(`⚠️ Saldo ya es €0 o negativo (${formatBalance(totalBalance)})`);
      return;
    }
    setDevLoading(true);
    try {
      const drainAmount = -totalBalance; // importe negativo para drenar
      const res = await fetch('/api/dev/wallet-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: drainAmount,
          description: '[DEV] Drenar saldo a €0 para test de flujo de pago',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        log(`❌ Error drenando: ${data.error ?? res.status}`);
      } else {
        log(`✅ Saldo drenado. Nuevo saldo: €${data.new_balance ?? 0}`);
        await refetchBalance();
      }
    } catch (e: any) {
      log(`❌ Error: ${e.message}`);
    } finally {
      setDevLoading(false);
    }
  };

  const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: 6,
    cursor: devLoading ? 'wait' : 'pointer',
    fontSize: 12,
    padding: '6px 12px',
    opacity: devLoading ? 0.6 : 1,
  };

  return (
    <Flexbox
      gap={12}
      style={{
        border: '1px dashed #d97706',
        borderRadius: 12,
        marginTop: 24,
        padding: 16,
      }}
    >
      <Flexbox align="center" horizontal justify="space-between">
        <p style={{ color: '#92400e', fontSize: 12, fontWeight: 600, margin: 0 }}>
          🛠 Dev Tools — Simulación de saldo con datos reales
        </p>
        <span style={{ color: '#b45309', fontSize: 11 }}>Saldo actual: {formatBalance(totalBalance)}</span>
      </Flexbox>

      <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
        {/* Llamadas reales a API */}
        <button
          disabled={devLoading}
          onClick={handleCheckBalance}
          style={{ ...btnBase, background: '#dbeafe', color: '#1d4ed8' }}
          title="GET /api/wallet/balance — saldo real de API"
        >
          📡 Consultar saldo real
        </button>
        <button
          disabled={devLoading}
          onClick={handleCheckAffordability}
          style={{ ...btnBase, background: '#fef3c7', color: '#92400e' }}
          title="POST /api/wallet/check — ¿puede pagar €0.05?"
        >
          🔍 Verificar ¿puede pagar €0.05?
        </button>
        <button
          disabled={devLoading}
          onClick={handleConsumeSmall}
          style={{ ...btnBase, background: '#fde8e8', color: '#9b1c1c' }}
          title="POST /api/wallet/consume — consume Haiku x1 real"
        >
          💸 Consumir HAIKU x1 (real)
        </button>

        <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 4px' }} />

        {/* Estados UI sin API */}
        <button
          onClick={handleShowModal}
          style={{ ...btnBase, background: '#fef9c3', color: '#92400e' }}
          title="Muestra el modal de recarga (sin API)"
        >
          🔔 Modal sin saldo (UI)
        </button>
        <button
          onClick={handleShowBanner}
          style={{ ...btnBase, background: '#fff7ed', color: '#c2410c' }}
          title="Muestra el banner de modo crédito (sin API)"
        >
          🟠 Banner modo crédito (UI)
        </button>
        <button
          onClick={handleReset}
          style={{ ...btnBase, background: '#f0fdf4', color: '#15803d' }}
        >
          🔄 Reset estados UI
        </button>

        <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 4px' }} />

        {/* Ajuste real de saldo via proxy server-side */}
        <button
          disabled={devLoading || totalBalance <= 0}
          onClick={handleDrainBalance}
          style={{ ...btnBase, background: '#fdf2f8', color: '#9d174d' }}
          title="Drena el saldo a €0 via POST /api/dev/wallet-drain → api-ia (requiere ADMIN_API_KEY)"
        >
          🚨 Drenar saldo a €0 (test)
        </button>
      </Flexbox>

      {/* Log de operaciones */}
      {devLog.length > 0 && (
        <Flexbox
          gap={2}
          style={{
            background: '#0f172a',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 11,
            maxHeight: 160,
            overflowY: 'auto',
            padding: '8px 12px',
          }}
        >
          {devLog.map((line, i) => (
            <span key={i} style={{ color: line.includes('❌') ? '#f87171' : line.includes('⚠️') ? '#fbbf24' : '#86efac' }}>
              {line}
            </span>
          ))}
        </Flexbox>
      )}
    </Flexbox>
  );
});

WalletDevTools.displayName = 'WalletDevTools';

export default BillingPage;
