'use client';

/**
 * Extrae datos de lead desde bloques ocultos en respuestas del AI.
 *
 * El chatbot incluye bloques como:
 *   <!--LEAD_DATA {"event_type":"boda","guest_count":150} LEAD_DATA-->
 *
 * Patrón existente: <!--WEDDING_ACTIONS [...] WEDDING_ACTIONS--> en weddingChatService.ts
 */

export interface LeadQualifyingData {
  budget?: string;
  event_date?: string;
  event_type?: string;
  guest_count?: number;
  location?: string;
  services_needed?: string[];
}

export interface LeadContact {
  email?: string;
  name?: string;
  phone?: string;
}

export interface ExtractedLeadData {
  budget?: string;
  contact?: LeadContact;
  email?: string;
  event_date?: string;
  // Flat fields — when AI emits { event_type: "..." } directly at root level
  event_type?: string;
  guest_count?: number;
  location?: string;
  name?: string;
  phone?: string;
  qualifying_data?: LeadQualifyingData;
  services_needed?: string[];
}

const LEAD_DATA_REGEX = /<!--LEAD_DATA\s*([\S\s]*?)\s*LEAD_DATA-->/g;

/**
 * Extrae datos de lead de los bloques ocultos en el contenido del mensaje AI.
 * Puede haber múltiples bloques; se mergean todos.
 */
export function extractLeadData(content: string): {
  cleanContent: string;
  data: ExtractedLeadData | null;
} {
  const matches: ExtractedLeadData[] = [];
  let match: RegExpExecArray | null;

  while ((match = LEAD_DATA_REGEX.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      matches.push(parsed);
    } catch {
      console.warn('[leadExtraction] Error parseando LEAD_DATA:', match[1]);
    }
  }

  // Reset regex lastIndex
  LEAD_DATA_REGEX.lastIndex = 0;

  if (matches.length === 0) {
    return { cleanContent: content, data: null };
  }

  // Merge all extracted data
  const merged: ExtractedLeadData = {};
  for (const m of matches) {
    if (m.qualifying_data || m.event_type || m.guest_count || m.budget || m.event_date || m.location || m.services_needed) {
      // Support both nested { qualifying_data: {...} } and flat { event_type: "..." } formats
      const qd = m.qualifying_data || {};
      merged.qualifying_data = {
        ...merged.qualifying_data,
        ...qd,
        // Flat fields override nested
        ...(m.event_type != null ? { event_type: m.event_type } : {}),
        ...(m.event_date != null ? { event_date: m.event_date } : {}),
        ...(m.guest_count != null ? { guest_count: m.guest_count } : {}),
        ...(m.budget != null ? { budget: m.budget } : {}),
        ...(m.location != null ? { location: m.location } : {}),
        ...(m.services_needed != null ? { services_needed: m.services_needed } : {}),
      } as LeadQualifyingData;
    }
    if (m.contact || m.name || m.email || m.phone) {
      const c = m.contact || {};
      merged.contact = {
        ...merged.contact,
        ...c,
        ...(m.name != null ? { name: m.name } : {}),
        ...(m.email != null ? { email: m.email } : {}),
        ...(m.phone != null ? { phone: m.phone } : {}),
      } as LeadContact;
    }
  }

  // Remove LEAD_DATA blocks from visible content
  const cleanContent = content.replace(LEAD_DATA_REGEX, '').trim();

  return { cleanContent, data: merged };
}

/**
 * Verifica si un contenido contiene bloques LEAD_DATA
 */
export function hasLeadData(content: string): boolean {
  LEAD_DATA_REGEX.lastIndex = 0;
  return LEAD_DATA_REGEX.test(content);
}
