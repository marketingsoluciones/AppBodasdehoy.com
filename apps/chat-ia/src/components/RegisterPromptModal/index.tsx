'use client';

import { Button, Icon, Modal } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CheckCircle, Sparkles, UserPlus, X } from 'lucide-react';
import { rgba } from 'polished';
import { memo, useCallback } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { CaptationResponse } from '@/hooks/useAuthCheck';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  closeButton: css`
    cursor: pointer;

    position: absolute;
    inset-block-start: 12px;
    inset-inline-end: 12px;

    opacity: 0.6;

    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  `,
  container: css`
    position: relative;
    padding: 32px;
    text-align: center;
  `,
  ctaPrimary: css`
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  `,
  ctaSecondary: css`
    cursor: pointer;
    color: ${token.colorTextSecondary};
    transition: color 0.2s;

    &:hover {
      color: ${token.colorText};
    }
  `,
  feature: css`
    display: flex;
    gap: 8px;
    align-items: center;

    font-size: 14px;
    color: ${token.colorText};
    text-align: start;
  `,
  featureIcon: css`
    flex-shrink: 0;
    color: ${token.colorSuccess};
  `,
  featureList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;

    margin-block: 24px;
    margin-inline: 0;
    padding: 20px;
    border-radius: 12px;

    background: ${isDarkMode ? rgba(token.colorPrimary, 0.1) : rgba(token.colorPrimary, 0.05)};
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 72px;
    height: 72px;
    margin-block-end: 16px;
    border-radius: 50%;

    background: linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover});
  `,
  subtitle: css`
    margin-block-end: 8px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    margin-block-end: 8px;

    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    color: ${token.colorText};
  `,
  urgency: css`
    margin-block-start: 16px;
    font-size: 13px;
    color: ${token.colorWarning};
  `,
}));

interface RegisterPromptModalProps {
  captationData: CaptationResponse | null;
  onClose: () => void;
  onContinueAsGuest?: () => void;
  onRegister?: () => void;
  open: boolean;
}

const RegisterPromptModal = memo<RegisterPromptModalProps>(
  ({ open, onClose, captationData, onRegister, onContinueAsGuest }) => {
    const { styles } = useStyles();

    const handleRegister = useCallback(() => {
      if (captationData?.cta?.register_url) {
        window.open(captationData.cta.register_url, '_blank');
      }
      onRegister?.();
      onClose();
    }, [captationData, onRegister, onClose]);

    const handleContinueAsGuest = useCallback(() => {
      onContinueAsGuest?.();
      onClose();
    }, [onContinueAsGuest, onClose]);

    if (!captationData?.message) {
      return null;
    }

    const { message, cta } = captationData;

    return (
      <Modal centered closable={false} footer={null} open={open} width={420}>
        <div className={styles.container}>
          {/* Close button */}
          <div className={styles.closeButton} onClick={onClose}>
            <Icon icon={X} size={20} />
          </div>

          {/* Icon */}
          <Center>
            <div className={styles.iconWrapper}>
              <Icon color="white" icon={Sparkles} size={32} />
            </div>
          </Center>

          {/* Title */}
          <h2 className={styles.title}>{message.title}</h2>

          {/* Subtitle */}
          <p className={styles.subtitle}>{message.subtitle}</p>

          {/* Features list */}
          <div className={styles.featureList}>
            {message.features?.map((feature, index) => (
              <div className={styles.feature} key={index}>
                <Icon className={styles.featureIcon} icon={CheckCircle} size={18} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <Flexbox gap={16}>
            <Button
              className={styles.ctaPrimary}
              icon={<Icon icon={UserPlus} />}
              onClick={handleRegister}
              type="primary"
            >
              {cta?.primary_text || message.cta_text || 'Crear cuenta gratis'}
            </Button>

            {(cta?.secondary_text || message.cta_secondary) && (
              <span className={styles.ctaSecondary} onClick={handleContinueAsGuest}>
                {cta?.secondary_text || message.cta_secondary}
              </span>
            )}
          </Flexbox>

          {/* Urgency message */}
          {message.urgency && <p className={styles.urgency}>{message.urgency}</p>}
        </div>
      </Modal>
    );
  },
);

RegisterPromptModal.displayName = 'RegisterPromptModal';

export default RegisterPromptModal;
