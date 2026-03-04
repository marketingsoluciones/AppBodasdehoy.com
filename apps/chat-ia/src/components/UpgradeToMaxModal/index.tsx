'use client';

import { Button, Modal } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Infinity, CheckCircle } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 24px;
    text-align: center;
  `,
  ctaPrimary: css`
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  `,
  ctaSecondary: css`
    width: 100%;
    height: 40px;
  `,
  feature: css`
    display: flex;
    gap: 12px;
    align-items: center;

    padding-block: 12px;
    padding-inline: 0;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }
  `,
  featureIcon: css`
    flex-shrink: 0;
    color: #52c41a;
  `,
  featureList: css`
    margin-block: 24px;
    margin-inline: 0;
    text-align: start;
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 64px;
    height: 64px;
    margin-block: 0 16px;
    margin-inline: auto;
    border-radius: 50%;

    background: linear-gradient(135deg, #52c41a 0%, #1890ff 100%);
  `,
  price: css`
    margin-block: 16px;
    margin-inline: 0;

    font-size: 32px;
    font-weight: 700;
    color: ${token.colorPrimary};
  `,
  priceLabel: css`
    margin-block-end: 8px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  subtitle: css`
    margin-block: 0 24px;
    margin-inline: 0;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    margin-block: 0 8px;
    margin-inline: 0;

    font-size: 20px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

interface UpgradeToMaxModalProps {
  onClose: () => void;
  onSubscribe: () => void;
  open: boolean;
}

const UpgradeToMaxModal = memo<UpgradeToMaxModalProps>(({ open, onClose, onSubscribe }) => {
  const { styles } = useStyles();

  const handleSubscribe = useCallback(() => {
    onSubscribe();
    onClose();
  }, [onSubscribe, onClose]);

  return (
    <Modal centered closable footer={null} onCancel={onClose} open={open} title={null} width={480}>
      <div className={styles.container}>
        {/* Icon */}
        <Center>
          <div className={styles.iconWrapper}>
            <Infinity size={32} strokeWidth={2.5} style={{ color: 'white' }} />
          </div>
        </Center>

        {/* Title */}
        <h2 className={styles.title}>Upgrade a Auto Max</h2>
        <p className={styles.subtitle}>Desbloquea la máxima calidad de IA con modelos premium</p>

        {/* Price */}
        <div>
          <div className={styles.priceLabel}>Precio mensual</div>
          <div className={styles.price}>150€/mes</div>
        </div>

        {/* Features */}
        <div className={styles.featureList}>
          <div className={styles.feature}>
            <CheckCircle className={styles.featureIcon} size={20} />
            <span>
              <strong>Auto Max</strong> - Selección automática de modelos premium
            </span>
          </div>
          <div className={styles.feature}>
            <CheckCircle className={styles.featureIcon} size={20} />
            <span>
              <strong>Máxima calidad</strong> - Claude Opus, GPT-4, modelos más avanzados
            </span>
          </div>
          <div className={styles.feature}>
            <CheckCircle className={styles.featureIcon} size={20} />
            <span>
              <strong>Sin límites</strong> - Tokens ilimitados para Auto Max
            </span>
          </div>
          <div className={styles.feature}>
            <CheckCircle className={styles.featureIcon} size={20} />
            <span>
              <strong>Soporte prioritario</strong> - Respuesta en menos de 2 horas
            </span>
          </div>
          <div className={styles.feature}>
            <CheckCircle className={styles.featureIcon} size={20} />
            <span>
              <strong>Acceso anticipado</strong> - Nuevos modelos antes que nadie
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <Flexbox gap={12}>
          <Button className={styles.ctaPrimary} onClick={handleSubscribe} type="primary">
            Suscribirse por 150€/mes
          </Button>
          <Button className={styles.ctaSecondary} onClick={onClose}>
            Cancelar
          </Button>
        </Flexbox>
      </div>
    </Modal>
  );
});

UpgradeToMaxModal.displayName = 'UpgradeToMaxModal';

export default UpgradeToMaxModal;
















































