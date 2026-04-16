/**
 * Seed Domain Agents Service
 * ==========================
 *
 * Crea agentes virtuales especializados al primer acceso del usuario
 * si aún no existen.
 *
 * Los agentes se filtran por developer/sector:
 * - Bodas de Hoy: solo presupuesto y distribución de mesas
 * - OBCRM / genérico: todos los agentes CRM
 *
 * Patron: sigue src/server/services/agent/index.ts → createInbox()
 */

import { LobeChatDatabase } from '@lobechat/database';

import { ACCOUNTING_AGENT_CONFIG, ACCOUNTING_AGENT_SLUG } from '@/const/agents/accountingAgent';
import { BUDGET_AGENT_CONFIG, BUDGET_AGENT_SLUG } from '@/const/agents/budgetAgent';
import { FINANCE_AGENT_CONFIG, FINANCE_AGENT_SLUG } from '@/const/agents/financeAgent';
import {
  MESSAGING_CAMPAIGN_AGENT_CONFIG,
  MESSAGING_CAMPAIGN_AGENT_SLUG,
} from '@/const/agents/messagingCampaignAgent';
import { SALES_CALL_AGENT_CONFIG, SALES_CALL_AGENT_SLUG } from '@/const/agents/salesCallAgent';
import { SCRAPING_AGENT_CONFIG, SCRAPING_AGENT_SLUG } from '@/const/agents/scrapingAgent';
import { SEATING_AGENT_CONFIG, SEATING_AGENT_SLUG } from '@/const/agents/seatingAgent';
import {
  SOCIAL_CONTENT_AGENT_CONFIG,
  SOCIAL_CONTENT_AGENT_SLUG,
} from '@/const/agents/socialContentAgent';
import { SessionModel } from '@/database/models/session';

interface DomainAgentDef {
  config: {
    description: string;
    plugins: string[];
    systemRole: string;
    tags: string[];
    title: string;
  };
  slug: string;
}

// ─── Agentes por sector ──────────────────────────────────────────────────────

/** Agentes relevantes para organización de bodas/eventos */
const BODAS_AGENTS: DomainAgentDef[] = [
  { config: BUDGET_AGENT_CONFIG, slug: BUDGET_AGENT_SLUG },
  { config: SEATING_AGENT_CONFIG, slug: SEATING_AGENT_SLUG },
];

/** Todos los agentes CRM (OBCRM, genérico) */
const CRM_AGENTS: DomainAgentDef[] = [
  { config: BUDGET_AGENT_CONFIG, slug: BUDGET_AGENT_SLUG },
  { config: SEATING_AGENT_CONFIG, slug: SEATING_AGENT_SLUG },
  { config: SCRAPING_AGENT_CONFIG, slug: SCRAPING_AGENT_SLUG },
  { config: SOCIAL_CONTENT_AGENT_CONFIG, slug: SOCIAL_CONTENT_AGENT_SLUG },
  { config: ACCOUNTING_AGENT_CONFIG, slug: ACCOUNTING_AGENT_SLUG },
  { config: FINANCE_AGENT_CONFIG, slug: FINANCE_AGENT_SLUG },
  { config: SALES_CALL_AGENT_CONFIG, slug: SALES_CALL_AGENT_SLUG },
  { config: MESSAGING_CAMPAIGN_AGENT_CONFIG, slug: MESSAGING_CAMPAIGN_AGENT_SLUG },
];

const BODAS_DEVELOPERS = new Set(['bodasdehoy', 'vivetuboda', 'organizador']);

function getAgentsForDevelopment(dev?: string): DomainAgentDef[] {
  return BODAS_DEVELOPERS.has(dev ?? '') ? BODAS_AGENTS : CRM_AGENTS;
}

/**
 * Crea los agentes de dominio si no existen para el usuario dado.
 * Filtra por developer (NEXT_PUBLIC_DEVELOPMENT) para no mostrar
 * agentes CRM en plataformas de bodas y viceversa.
 * Retorna el numero de agentes creados.
 */
export async function seedDomainAgents(
  db: LobeChatDatabase,
  userId: string,
): Promise<number> {
  const sessionModel = new SessionModel(db, userId);
  const agents = getAgentsForDevelopment(process.env.NEXT_PUBLIC_DEVELOPMENT);

  let created = 0;

  for (const def of agents) {
    try {
      // Verificar si ya existe por slug
      const existing = await sessionModel.findByIdOrSlug(def.slug);
      if (existing) continue;

      await sessionModel.create({
        config: {
          plugins: def.config.plugins,
          systemRole: def.config.systemRole,
          tags: def.config.tags,
        } as any,
        session: {
          description: def.config.description,
          title: def.config.title,
        } as any,
        slug: def.slug,
        type: 'agent',
      });

      created++;
      console.log(`[SeedAgents] Creado agente "${def.config.title}" (${def.slug}) para user ${userId}`);
    } catch (error) {
      console.warn(`[SeedAgents] Error creando agente ${def.slug}:`, error);
    }
  }

  return created;
}
