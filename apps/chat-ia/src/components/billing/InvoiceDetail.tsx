'use client';

import { Breadcrumb, Divider, Skeleton, Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Download, FileText, Printer, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useBilling } from '@/hooks/useBilling';
import { INVOICE_STATUS_LABELS } from '@/services/api2/invoices';

const useStyles = createStyles(({ css, token }) => ({
  actionButton: css`
    background: ${token.colorPrimary};
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
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
    padding: 24px;
  `,
  header: css`
    margin-bottom: 24px;
  `,
  infoLabel: css`
    color: ${token.colorTextSecondary};
    font-size: 14px;
    font-weight: 500;
  `,
  infoRow: css`
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 0;
  `,
  infoValue: css`
    color: ${token.colorText};
    font-size: 14px;
    font-weight: 600;
  `,
  secondaryButton: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorText};
    cursor: pointer;
    font-size: 14px;
    padding: 8px 16px;
    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
  section: css`
    margin-bottom: 32px;
  `,
  sectionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  totalLabel: css`
    font-size: 18px;
    font-weight: 600;
  `,
  totalRow: css`
    background: ${token.colorFillTertiary};
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    padding: 16px;
  `,
  totalValue: css`
    color: ${token.colorPrimary};
    font-size: 24px;
    font-weight: 700;
  `,
}));

interface InvoiceDetailProps {
  invoiceId: string;
  onBack?: () => void;
}

const InvoiceDetail = memo<InvoiceDetailProps>(({ invoiceId, onBack }) => {
  const { styles } = useStyles();
  const router = useRouter();
  const { invoiceDetail, invoiceDetailLoading, downloadInvoicePDF, fetchInvoiceById } = useBilling();

  // Cargar factura al montar
  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceById(invoiceId);
    }
  }, [invoiceId, fetchInvoiceById]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbol = currency === 'EUR' ? '€' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

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

  const handleDownloadPDF = async () => {
    try {
      console.log('🔍 [InvoiceDetail] Descargando PDF de factura:', invoiceId);
      const result = await downloadInvoicePDF(invoiceId);
      if (!result.success) {
        console.error('❌ [InvoiceDetail] Error al descargar PDF:', result.error_message);
        // El error ya se muestra en el hook (alert)
      }
    } catch (error) {
      console.error('❌ [InvoiceDetail] Excepción al descargar PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && invoiceDetail) {
      try {
        await navigator.share({
          text: `Factura ${invoiceDetail.invoice_number} - ${formatCurrency(invoiceDetail.total, invoiceDetail.currency)}`,
          title: `Factura ${invoiceDetail.invoice_number}`,
          url: window.location.href,
        });
      } catch (err) {
        // Usuario canceló o error
        console.log('Error compartiendo:', err);
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href);
      // Aquí podrías mostrar un toast de confirmación
    }
  };

  if (invoiceDetailLoading) {
    return (
      <div className={styles.card}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!invoiceDetail) {
    return (
      <div className={styles.card}>
        <Flexbox align="center" gap={16} justify="center" style={{ padding: '48px 24px' }}>
          <FileText size={48} style={{ opacity: 0.3 }} />
          <div>
            <h3 style={{ margin: 0 }}>Factura no encontrada</h3>
            <p style={{ color: 'var(--lobe-color-text-secondary)', margin: '8px 0 0' }}>
              No se pudo cargar la información de la factura.
            </p>
          </div>
        </Flexbox>
      </div>
    );
  }

  return (
    <Flexbox gap={24} style={{ maxWidth: 1024, padding: 24, width: '100%' }}>
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          {
            title: (
              <button
                onClick={() => router.push('/settings?active=billing')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Facturación
              </button>
            ),
          },
          { title: `Factura ${invoiceDetail.invoice_number}` },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Header */}
      <div className={styles.card}>
        <Flexbox align="center" horizontal justify="space-between" style={{ marginBottom: 24 }}>
          <Flexbox gap={8}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
              Factura {invoiceDetail.invoice_number}
            </h1>
            <Tag color={getStatusColor(invoiceDetail.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
              {INVOICE_STATUS_LABELS[invoiceDetail.status] || invoiceDetail.status}
            </Tag>
          </Flexbox>

          <Flexbox gap={12} horizontal>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push('/settings?active=billing')}
            >
              <Flexbox align="center" gap={6} horizontal>
                <ArrowLeft size={16} />
                Volver
              </Flexbox>
            </button>
            <button className={styles.secondaryButton} onClick={handleShare}>
              <Flexbox align="center" gap={6} horizontal>
                <Share2 size={16} />
                Compartir
              </Flexbox>
            </button>
            <button className={styles.secondaryButton} onClick={handlePrint}>
              <Flexbox align="center" gap={6} horizontal>
                <Printer size={16} />
                Imprimir
              </Flexbox>
            </button>
            <button className={styles.actionButton} onClick={handleDownloadPDF}>
              <Flexbox align="center" gap={6} horizontal>
                <Download size={16} />
                Descargar PDF
              </Flexbox>
            </button>
          </Flexbox>
        </Flexbox>

        {/* Información General */}
        <Divider style={{ margin: '16px 0' }} />
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Información de la Factura</div>
          <Flexbox gap={8}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha de Emisión:</span>
              <span className={styles.infoValue}>{formatDate(invoiceDetail.created_at)}</span>
            </div>
            {invoiceDetail.due_date && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fecha de Vencimiento:</span>
                <span className={styles.infoValue}>{formatDate(invoiceDetail.due_date)}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Período:</span>
              <span className={styles.infoValue}>
                {formatDate(invoiceDetail.period_start)} - {formatDate(invoiceDetail.period_end)}
              </span>
            </div>
            {invoiceDetail.payment_date && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fecha de Pago:</span>
                <span className={styles.infoValue}>{formatDate(invoiceDetail.payment_date)}</span>
              </div>
            )}
            {invoiceDetail.payment_method && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Método de Pago:</span>
                <span className={styles.infoValue}>{invoiceDetail.payment_method}</span>
              </div>
            )}
          </Flexbox>
        </div>

        {/* Información de Facturación */}
        {invoiceDetail.billing_info && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Información de Facturación</div>
              <Flexbox gap={8}>
                {invoiceDetail.billing_info.name && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nombre:</span>
                    <span className={styles.infoValue}>{invoiceDetail.billing_info.name}</span>
                  </div>
                )}
                {invoiceDetail.billing_info.company_name && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Empresa:</span>
                    <span className={styles.infoValue}>{invoiceDetail.billing_info.company_name}</span>
                  </div>
                )}
                {invoiceDetail.billing_info.email && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span className={styles.infoValue}>{invoiceDetail.billing_info.email}</span>
                  </div>
                )}
                {invoiceDetail.billing_info.address && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Dirección:</span>
                    <span className={styles.infoValue}>{invoiceDetail.billing_info.address}</span>
                  </div>
                )}
                {invoiceDetail.billing_info.tax_id && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>NIF/CIF:</span>
                    <span className={styles.infoValue}>{invoiceDetail.billing_info.tax_id}</span>
                  </div>
                )}
              </Flexbox>
            </div>
          </>
        )}

        {/* Línea de Items */}
        <Divider style={{ margin: '16px 0' }} />
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Detalle de Items</div>
          <Table
            columns={[
              {
                dataIndex: 'description',
                key: 'description',
                title: 'Descripción',
                width: '40%',
              },
              {
                dataIndex: 'quantity',
                key: 'quantity',
                render: (qty: number) => qty.toLocaleString(),
                title: 'Cantidad',
                width: '15%',
              },
              {
                dataIndex: 'unit_price',
                key: 'unit_price',
                render: (price: number) => formatCurrency(price, invoiceDetail.currency),
                title: 'Precio Unitario',
                width: '20%',
              },
              {
                dataIndex: 'amount',
                key: 'amount',
                render: (amount: number) => (
                  <span style={{ fontWeight: 600 }}>{formatCurrency(amount, invoiceDetail.currency)}</span>
                ),
                title: 'Total',
                width: '25%',
              },
            ]}
            dataSource={invoiceDetail.line_items}
            pagination={false}
            rowKey={(record, index) => `item-${index}`}
            size="middle"
          />
        </div>

        {/* Totales */}
        <Divider style={{ margin: '16px 0' }} />
        <Flexbox gap={8} style={{ marginTop: 16 }}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Subtotal:</span>
            <span className={styles.infoValue}>{formatCurrency(invoiceDetail.subtotal, invoiceDetail.currency)}</span>
          </div>
          {invoiceDetail.tax_amount > 0 && (
            <div className={styles.infoRow}>
                <span className={styles.infoLabel}>
                  IVA ({invoiceDetail.tax_rate ? `${(invoiceDetail.tax_rate * 100).toFixed(0)}%` : 'N/A'}):
                </span>
                <span className={styles.infoValue}>
                  {formatCurrency(invoiceDetail.tax_amount, invoiceDetail.currency)}
                </span>
              </div>
          )}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalValue}>
              {formatCurrency(invoiceDetail.total, invoiceDetail.currency)}
            </span>
          </div>
        </Flexbox>
      </div>
    </Flexbox>
  );
});

InvoiceDetail.displayName = 'InvoiceDetail';

export default InvoiceDetail;
