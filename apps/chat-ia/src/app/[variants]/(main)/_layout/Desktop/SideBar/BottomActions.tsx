import { ActionIcon, ActionIconProps } from '@lobehub/ui';
import { FlaskConical, Github, LogIn } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { GITHUB } from '@/const/url';
import { WalletWidget } from '@/components/Wallet';
import { useChatStore } from '@/store/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useBilling } from '@/hooks/useBilling';
import { usagePercent, usageColor } from '@bodasdehoy/shared/plans';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 36,
  size: 20,
  strokeWidth: 1.5,
};

/** Plan tier badge — nudges FREE/TRIAL users to upgrade */
const PlanBadge = memo(() => {
  const { tier, isTrial, trialDaysLeft, loading, isFreePlan } = usePlanLimits();

  if (loading) return null;
  if (!isFreePlan && !isTrial) return null;

  const label = isTrial
    ? trialDaysLeft > 0 ? `Trial · ${trialDaysLeft}d` : 'Trial expirado'
    : `Plan ${tier}`;
  const color = isTrial ? (trialDaysLeft <= 3 ? '#f59e0b' : '#667eea') : '#9ca3af';

  return (
    <Link href="/settings/billing/planes" style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: `${color}22`,
          border: `1px solid ${color}55`,
          borderRadius: 20,
          color,
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          padding: '3px 8px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
        title="Ver planes disponibles"
      >
        {label} ↑
      </div>
    </Link>
  );
});

PlanBadge.displayName = 'PlanBadge';

/** Mini quota bar for AI usage in sidebar */
const QuotaMiniBar = memo(() => {
  const { plan, loading } = usePlanLimits();
  const { usageStats } = useBilling();

  if (loading || !plan) return null;

  const aiLimit = plan.product_limits.find((l) => l.sku === 'ai-tokens');
  if (!aiLimit || aiLimit.free_quota >= 999_999) return null;

  const currentTokens = usageStats?.totalTokens ?? 0;
  const percent = usagePercent(currentTokens, aiLimit.free_quota);
  const color = usageColor(percent);

  if (percent === 0) return null;

  return (
    <Link href="/settings/billing" style={{ textDecoration: 'none' }}>
      <Flexbox
        gap={2}
        style={{
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: 8,
          transition: 'background 0.2s',
        }}
        title={`${percent}% IA usado — Click para ver detalles`}
      >
        <div
          style={{
            width: '100%',
            height: 3,
            backgroundColor: 'rgba(128,128,128,0.2)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 9, color, fontWeight: 500, textAlign: 'center' }}>
          {percent}% IA
        </span>
      </Flexbox>
    </Link>
  );
});

QuotaMiniBar.displayName = 'QuotaMiniBar';

const BottomActions = memo(() => {
  const { t } = useTranslation('common');
  const { hideGitHub } = useServerConfigStore(featureFlagsSelectors);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isGuest = !currentUserId || currentUserId === 'visitante@guest.local';
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  return (
    <Flexbox gap={8}>
      {/* Wallet + Quota + Plan badge for authenticated users */}
      {isServerMode && !isGuest && (
        <Flexbox gap={4} align="center">
          <WalletWidget size="small" />
          <QuotaMiniBar />
          <PlanBadge />
        </Flexbox>
      )}
      {isGuest && (
        <Link aria-label="Iniciar sesión" href="/login">
          <ActionIcon
            icon={LogIn}
            size={ICON_SIZE}
            style={{ color: '#667eea' }}
            title="Iniciar sesión / Registrarse"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {!hideGitHub && (
        <Link aria-label={'GitHub'} href={GITHUB} target={'_blank'}>
          <ActionIcon
            icon={Github}
            size={ICON_SIZE}
            title={'GitHub'}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      <Link aria-label={t('labs')} href={'/labs'} suppressHydrationWarning>
        <ActionIcon
          icon={FlaskConical}
          size={ICON_SIZE}
          title={t('labs')}
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
    </Flexbox>
  );
});

export default BottomActions;
