'use client';

import { Alert, InputNumber, Switch, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { CreditCard, RefreshCw, Zap } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { StoredPaymentMethod, WalletAutoRechargeConfig, walletService } from '@/services/api2/wallet';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 20px;
  `,
  form: css`
    background: ${token.colorFillQuaternary};
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  `,
  hint: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    margin-top: 2px;
  `,
  label: css`
    color: ${token.colorTextSecondary};
    font-size: 12px;
    margin-bottom: 4px;
  `,
  sectionTitle: css`
    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
    display: flex;
    align-items: center;
    gap: 8px;
  `,
}));

interface AutoRechargeCardProps {
  /** Si la auto-recarga está habilitada según wallet_getBalance */
  autoRechargeEnabled?: boolean;
  onConfigChange?: () => void;
}

const AutoRechargeCard = memo<AutoRechargeCardProps>(
  ({ autoRechargeEnabled = false, onConfigChange }) => {
    const { styles } = useStyles();

    const [enabled, setEnabled] = useState(autoRechargeEnabled);
    const [config, setConfig] = useState<WalletAutoRechargeConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<StoredPaymentMethod[]>([]);

    // Form state
    const [threshold, setThreshold] = useState<number>(10);
    const [amount, setAmount] = useState<number>(50);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Cargar config + métodos de pago en paralelo
    const loadConfig = useCallback(async () => {
      setLoadingConfig(true);
      const [cfg, methods] = await Promise.all([
        walletService.getAutoRechargeConfig(),
        walletService.getPaymentMethods(),
      ]);
      setLoadingConfig(false);

      if (cfg) {
        setConfig(cfg);
        setEnabled(cfg.enabled);
        setThreshold(cfg.threshold ?? 10);
        setAmount(cfg.amount ?? 50);
      }
      setPaymentMethods(methods);
    }, []);

    useEffect(() => {
      loadConfig();
    }, [loadConfig]);

    // Sync enabled from parent (wallet balance flag) if config not loaded
    useEffect(() => {
      if (!config) {
        setEnabled(autoRechargeEnabled);
      }
    }, [autoRechargeEnabled, config]);

    const handleToggle = useCallback(
      async (checked: boolean) => {
        setSaveError(null);
        setSaveSuccess(false);

        if (!checked) {
          // Deshabilitar via api2 GraphQL
          setSaving(true);
          const result = await walletService.configureAutoRecharge(false);
          setSaving(false);

          if (result.success) {
            setEnabled(false);
            setSaveSuccess(true);
            onConfigChange?.();
            setTimeout(() => setSaveSuccess(false), 3000);
          } else {
            setSaveError(result.errors?.[0] ?? 'No se pudo deshabilitar la auto-recarga');
          }
        } else {
          // Solo activar el estado visual — el formulario guardará al hacer clic en "Guardar"
          setEnabled(true);
        }
      },
      [onConfigChange],
    );

    const handleSave = useCallback(async () => {
      if (!threshold || !amount) return;
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const result = await walletService.configureAutoRecharge(true, threshold, amount);
      setSaving(false);

      if (result.success) {
        setSaveSuccess(true);
        setConfig((prev) => prev
          ? { ...prev, amount, enabled: true, threshold }
          : { amount, enabled: true, threshold }
        );
        onConfigChange?.();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.errors?.[0] ?? 'No se pudo guardar la configuración');
        // Revertir toggle si falló al activar
        if (!config?.enabled) setEnabled(false);
      }
    }, [threshold, amount, config, onConfigChange]);

    return (
      <div className={styles.card}>
        <Flexbox align="center" horizontal justify="space-between">
          <div className={styles.sectionTitle}>
            <Zap size={20} />
            Auto-recarga
            {config && (
              <Tag color={enabled ? 'green' : 'default'}>{enabled ? 'Activa' : 'Inactiva'}</Tag>
            )}
            {!config && !loadingConfig && (
              <Tooltip title="No se pudo cargar la configuración actual. Verifica tu conexión o activa la auto-recarga para establecer nuevos valores.">
                <Tag color="orange">Config. no disponible</Tag>
              </Tooltip>
            )}
          </div>

          <Switch
            checked={enabled}
            loading={saving}
            onChange={handleToggle}
          />
        </Flexbox>

        <p className={styles.hint} style={{ marginTop: 8 }}>
          Recarga automáticamente tu saldo cuando baje de un umbral. Requiere un método de pago
          guardado en Stripe.
        </p>

        {saveError && (
          <Alert
            closable
            message={saveError}
            onClose={() => setSaveError(null)}
            showIcon
            style={{ marginTop: 12 }}
            type="error"
          />
        )}

        {saveSuccess && (
          <Alert
            message="Configuración guardada correctamente"
            showIcon
            style={{ marginTop: 12 }}
            type="success"
          />
        )}

        {enabled && (
          <div className={styles.form}>
            <Flexbox gap={16}>
              <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
                {/* Threshold */}
                <Flexbox gap={4} style={{ flex: 1, minWidth: 180 }}>
                  <div className={styles.label}>Recargar cuando el saldo baje de</div>
                  <InputNumber
                    addonAfter="€"
                    min={1}
                    onChange={(v) => setThreshold(v ?? 10)}
                    placeholder="10"
                    style={{ width: '100%' }}
                    value={threshold}
                  />
                  <div className={styles.hint}>Mínimo recomendado: €5</div>
                </Flexbox>

                {/* Amount */}
                <Flexbox gap={4} style={{ flex: 1, minWidth: 180 }}>
                  <div className={styles.label}>Importe a recargar</div>
                  <InputNumber
                    addonAfter="€"
                    min={5}
                    onChange={(v) => setAmount(v ?? 50)}
                    placeholder="50"
                    style={{ width: '100%' }}
                    value={amount}
                  />
                  <div className={styles.hint}>Mínimo: €5</div>
                </Flexbox>
              </Flexbox>

              {/* Info sobre método de pago */}
              {(() => {
                const defaultMethod = paymentMethods.find((m) => m.is_default) ?? paymentMethods[0];
                if (defaultMethod) {
                  const hasCardDetails = defaultMethod.last4;
                  const brand = defaultMethod.brand
                    ? defaultMethod.brand.charAt(0).toUpperCase() + defaultMethod.brand.slice(1)
                    : 'Tarjeta';
                  const expiry = defaultMethod.exp_month && defaultMethod.exp_year
                    ? ` · caduca ${String(defaultMethod.exp_month).padStart(2, '0')}/${defaultMethod.exp_year}`
                    : '';
                  return (
                    <Flexbox
                      align="center"
                      gap={10}
                      horizontal
                      style={{
                        background: 'var(--ant-color-fill-quaternary, #f5f5f5)',
                        borderRadius: 8,
                        padding: '10px 14px',
                      }}
                    >
                      <CreditCard size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontSize: 13 }}>
                        {hasCardDetails ? (
                          <>
                            <strong>{brand}</strong> ···· {defaultMethod.last4}
                            <span style={{ color: '#9ca3af' }}>{expiry}</span>
                          </>
                        ) : (
                          'Tarjeta guardada en Stripe'
                        )}
                      </span>
                      {paymentMethods.length > 1 && (
                        <Tag color="blue" style={{ marginLeft: 'auto' }}>
                          +{paymentMethods.length - 1} más
                        </Tag>
                      )}
                    </Flexbox>
                  );
                }
                return (
                  <Alert
                    message={
                      <span>
                        La auto-recarga usa el método de pago por defecto guardado en tu cuenta
                        Stripe. Para cambiar la tarjeta, realiza una recarga manual y marca la
                        opción de guardar.
                      </span>
                    }
                    showIcon
                    type="info"
                  />
                );
              })()}

              {config?.last_triggered_at && (
                <Flexbox gap={4} horizontal>
                  <RefreshCw size={14} style={{ color: '#6b7280', marginTop: 2 }} />
                  <span style={{ color: '#6b7280', fontSize: 12 }}>
                    Última recarga automática:{' '}
                    {new Date(config.last_triggered_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    {config.attempts_count ? `(${config.attempts_count} veces en total)` : ''}
                  </span>
                </Flexbox>
              )}

              <Flexbox horizontal>
                <button
                  disabled={saving || !threshold || !amount}
                  onClick={handleSave}
                  style={{
                    background: saving ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 8,
                    color: saving ? '#9ca3af' : 'white',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '10px 24px',
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </Flexbox>
            </Flexbox>
          </div>
        )}
      </div>
    );
  },
);

AutoRechargeCard.displayName = 'AutoRechargeCard';

export default AutoRechargeCard;
