'use client';

import { AlertTriangle, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useBilling } from '@/hooks/useBilling';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useWallet } from '@/hooks/useWallet';
import { useChatStore } from '@/store/chat';
import { canAccessDaily, isUnlimited, usagePercent } from '@bodasdehoy/shared/plans';
import type { UsageStats } from '@/services/api2/invoices';

/**
 * Banner above chat input showing quota warnings.
 * - Daily limit reached: Red block (resets tomorrow)
 * - 80-99% monthly: Yellow warning with remaining queries
 * - 100% monthly: Red block with CTA to recharge/upgrade
 */
const QuotaBanner = memo(() => {
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isGuest = !currentUserId || currentUserId === 'visitante@guest.local';
  const { plan, loading: planLoading } = usePlanLimits();
  const { usageStats, usageStatsLoading, fetchUsageStats } = useBilling();
  const { isCreditExhausted, totalBalance, creditLimit, loading: walletLoading } = useWallet();
  const [todayStats, setTodayStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (!isGuest) {
      fetchUsageStats('TODAY').then(() => {}).catch(() => {});
    }
  }, [isGuest, fetchUsageStats]);

  // Fetch today stats separately
  useEffect(() => {
    if (isGuest) return;
    import('@/services/api2/invoices').then(({ invoicesService }) => {
      invoicesService.getUsageStats('TODAY').then((res) => {
        if (res.success && res.stats) setTodayStats(res.stats);
      }).catch(() => {});
    });
  }, [isGuest]);

  if (isGuest || planLoading || usageStatsLoading || walletLoading || !plan) return null;

  const aiLimit = plan.product_limits.find((l) => l.sku === 'ai-tokens');
  if (!aiLimit || isUnlimited('ai-tokens', aiLimit.free_quota)) return null;

  // --- Límite diario ---
  if (aiLimit.daily_quota) {
    const todayTokens = todayStats?.totalTokens ?? 0;
    const dailyCheck = canAccessDaily('ai-tokens', todayTokens, plan);
    if (dailyCheck && !dailyCheck.allowed) {
      return (
        <Flexbox
          align="center"
          gap={8}
          horizontal
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 6,
            padding: '8px 12px',
          }}
        >
          <Lock size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span style={{ color: '#991b1b', flex: 1 }}>
            Has alcanzado el límite diario de consultas. Vuelve mañana o actualiza tu plan.
          </span>
          <Link
            href="/settings/billing/planes"
            style={{
              background: '#667eea',
              borderRadius: 6,
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Ver planes
          </Link>
        </Flexbox>
      );
    }
    // Daily warning: 80-99% of daily quota (only show when there's at least 1 query left)
    if (dailyCheck && dailyCheck.allowed && dailyCheck.percentUsed >= 80) {
      const dailyRemaining = Math.max(0, Math.round(dailyCheck.remaining / 500));
      if (dailyRemaining === 0) return null;
      return (
        <Flexbox
          align="center"
          gap={8}
          horizontal
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 6,
            padding: '6px 12px',
          }}
        >
          <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ color: '#92400e', flex: 1 }}>
            Te quedan ~{dailyRemaining} consultas hoy.
          </span>
          <Link
            href="/settings/billing/planes"
            style={{
              alignItems: 'center',
              background: '#f59e0b',
              borderRadius: 6,
              color: 'white',
              display: 'flex',
              fontSize: 12,
              fontWeight: 600,
              gap: 4,
              padding: '3px 10px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={12} />
            Actualizar
          </Link>
        </Flexbox>
      );
    }
  }

  // --- Límite mensual ---
  const currentTokens = usageStats?.totalTokens ?? 0;
  const percent = usagePercent(currentTokens, aiLimit.free_quota, 'ai-tokens');

  if (percent < 80) return null;

  // remaining: queries left (each ~500 tokens). 0 means effectively exhausted even if percent is 99.x%
  const remaining = Math.max(0, Math.round((aiLimit.free_quota - currentTokens) / 500));
  const isEffectivelyExhausted = percent >= 100 || remaining === 0;
  // isPayPerUse: plan exhausted AND overage enabled AND wallet has credit → user pays per query
  const isPayPerUse = isEffectivelyExhausted && aiLimit.overage_enabled && !isCreditExhausted;
  // isBlocked: exhausted and cannot continue (no overage, or overage but no credit)
  const isBlocked = isEffectivelyExhausted && !isPayPerUse;
  // Available funds: positive balance OR remaining credit limit
  const availableFunds = totalBalance >= 0 ? totalBalance : Math.max(0, creditLimit + totalBalance);

  if (isBlocked) {
    return (
      <Flexbox
        align="center"
        gap={8}
        horizontal
        style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 6,
          padding: '8px 12px',
        }}
      >
        <Lock size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
        <span style={{ color: '#991b1b', flex: 1 }}>
          Has agotado tus consultas IA del mes.
        </span>
        <Flexbox gap={8} horizontal>
          <Link
            href="/settings/billing/packages"
            style={{
              background: '#667eea',
              borderRadius: 6,
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Recargar
          </Link>
          <Link
            href="/settings/billing/planes"
            style={{
              border: '1px solid #667eea',
              borderRadius: 6,
              color: '#667eea',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Ver planes
          </Link>
        </Flexbox>
      </Flexbox>
    );
  }

  // Plan exhausted, wallet covers the rest
  if (isPayPerUse) {
    return (
      <Flexbox
        align="center"
        gap={8}
        horizontal
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #86efac',
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 6,
          padding: '6px 12px',
        }}
      >
        <Zap size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
        <span style={{ color: '#15803d', flex: 1 }}>
          Plan agotado · Crédito disponible: €{availableFunds.toFixed(2)}
        </span>
        <Link
          href="/settings/billing/planes"
          style={{
            border: '1px solid #16a34a',
            borderRadius: 6,
            color: '#16a34a',
            fontSize: 12,
            fontWeight: 600,
            padding: '3px 10px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Ampliar plan
        </Link>
      </Flexbox>
    );
  }

  // Warning: 80-99% (only show when there's at least 1 query left to avoid "~0" confusion)
  if (remaining === 0) return null;
  return (
    <Flexbox
      align="center"
      gap={8}
      horizontal
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid #fde68a',
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 6,
        padding: '6px 12px',
      }}
    >
      <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }} />
      <span style={{ color: '#92400e', flex: 1 }}>
        Te quedan ~{remaining} consultas IA este mes.
      </span>
      <Link
        href="/settings/billing/planes"
        style={{
          alignItems: 'center',
          background: '#f59e0b',
          borderRadius: 6,
          color: 'white',
          display: 'flex',
          fontSize: 12,
          fontWeight: 600,
          gap: 4,
          padding: '3px 10px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <Zap size={12} />
        Actualizar
      </Link>
    </Flexbox>
  );
});

QuotaBanner.displayName = 'QuotaBanner';

export default QuotaBanner;
