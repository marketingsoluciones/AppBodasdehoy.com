/**
 * useReferral — Hook para el sistema de referidos de Memories.
 * Obtiene el código de referido del usuario y sus estadísticas desde API2.
 *
 * Modelo de recompensa: 5 referidos convertidos = 1 evento Boda gratis
 *
 * API2 queries required:
 *   query getMyReferral: { code, stats: { invited, converted, freeEvents, nextRewardIn } }
 */
import { useEffect, useState } from 'react';
import { authBridge } from '@bodasdehoy/shared';

import { resolvePublicMcpGraphqlUrl } from '../utils/endpoints';

const API2_URL = resolvePublicMcpGraphqlUrl();
const DEVELOPMENT = (process.env.NEXT_PUBLIC_DEVELOPMENT || 'memories').trim();
const MEMORIES_BASE =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://memories.bodasdehoy.com';

export const REFERRALS_PER_REWARD = 5;

export interface ReferralStats {
  invited: number;
  converted: number;
  freeEvents: number;
  /** Cuántos referidos faltan para el próximo evento gratis */
  nextRewardIn: number;
}

export interface UseReferralReturn {
  code: string | null;
  referralLink: string | null;
  stats: ReferralStats;
  loading: boolean;
  apiSupported: boolean;
}

export function useReferral(): UseReferralReturn {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    invited: 0,
    converted: 0,
    freeEvents: 0,
    nextRewardIn: REFERRALS_PER_REWARD,
  });
  const [loading, setLoading] = useState(true);
  const [apiSupported, setApiSupported] = useState(false);

  useEffect(() => {
    const authState = authBridge.getSharedAuthState();
    if (!authState.idToken) {
      setLoading(false);
      return;
    }

    fetch(API2_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.idToken}`,
        'X-Development': DEVELOPMENT,
      },
      body: JSON.stringify({
        query: `query GetMyReferral {
          getMyReferral {
            code
            stats { invited converted freeEvents nextRewardIn }
          }
        }`,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        const data = json.data?.getMyReferral;
        if (data) {
          setCode(data.code);
          const s = data.stats ?? {};
          const converted = s.converted ?? 0;
          const freeEvents = s.freeEvents ?? Math.floor(converted / REFERRALS_PER_REWARD);
          const nextRewardIn = REFERRALS_PER_REWARD - (converted % REFERRALS_PER_REWARD);
          setStats({
            invited: s.invited ?? 0,
            converted,
            freeEvents,
            nextRewardIn: converted % REFERRALS_PER_REWARD === 0 && converted > 0 ? REFERRALS_PER_REWARD : nextRewardIn,
          });
          setApiSupported(true);
        }
      })
      .catch(() => {
        // API not yet supported — graceful degradation
      })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = code ? `${MEMORIES_BASE}/?ref=${code}` : null;

  return { code, referralLink, stats, loading, apiSupported };
}
