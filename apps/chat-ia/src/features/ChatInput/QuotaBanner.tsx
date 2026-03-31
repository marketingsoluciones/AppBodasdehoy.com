'use client';

import { AlertTriangle, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useBilling } from '@/hooks/useBilling';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useChatStore } from '@/store/chat';
import { usagePercent } from '@bodasdehoy/shared/plans';

/**
 * Banner above chat input showing quota warnings.
 * - 80-99%: Yellow warning with remaining queries
 * - 100%: Red block with CTA to recharge/upgrade
 */
const QuotaBanner = memo(() => {
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isGuest = !currentUserId || currentUserId === 'visitante@guest.local';
  const { plan, loading: planLoading } = usePlanLimits();
  const { usageStats, usageStatsLoading } = useBilling();

  if (isGuest || planLoading || usageStatsLoading || !plan) return null;

  const aiLimit = plan.product_limits.find((l) => l.sku === 'ai-tokens');
  if (!aiLimit || aiLimit.free_quota >= 999_999) return null;

  const currentTokens = usageStats?.totalTokens ?? 0;
  const percent = usagePercent(currentTokens, aiLimit.free_quota);

  // Only show when usage is high
  if (percent < 80) return null;

  const isBlocked = percent >= 100 && !aiLimit.overage_enabled;
  const remaining = Math.max(0, Math.round((aiLimit.free_quota - currentTokens) / 500));

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

  // Warning: 80-99%
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
