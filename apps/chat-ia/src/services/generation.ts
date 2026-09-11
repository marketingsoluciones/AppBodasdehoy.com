// CAPA 2 PASO C — generation vía api-ia REST. Estado 2026-06-12 (auditado por curl + RE api-ia):
//   ✅ deleteGeneration → DELETE /image/generations/{gen_id}?topic_id=  (verificado: endpoint existe)
//   ✅ getGenerationStatus → CERRADO (IA-5): api-ia confirmó que la generación de imágenes es SÍNCRONA
//      (POST /webapi/text-to-image devuelve la imagen al momento; no hay job async). Por tanto el stub
//      que retorna status:Pending es CORRECTO — detiene el polling SWR sin marcar success/error falso.
//      No se necesita un /status async. (GET /image/generations/{id} existe para leer el registro si hiciera falta.)
//   - createImage YA va a api-ia (image.ts /webapi/text-to-image).

import { AsyncTaskStatus } from '@/types/asyncTask';

// Type local — antes vivía en server/routers/lambda/generation.ts (eliminado en
// refactor runtime-only-api-ia 2026-06-24).
type GetGenerationStatusResult = {
  error: unknown | null;
  generation: unknown | null;
  status: AsyncTaskStatus;
};

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';

function getCtx(): { development: string; idToken?: string; userId?: string } {
  if (typeof window === 'undefined') {
    return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
  }
  const development =
    localStorage.getItem('current_development') ||
    process.env.NEXT_PUBLIC_DEVELOPMENT ||
    'bodasdehoy';
  return {
    development,
    idToken: localStorage.getItem('jwt_token') || localStorage.getItem('mcp_jwt_token') || undefined,
    userId: localStorage.getItem('user_id') || undefined,
  };
}

function authHeaders(): Record<string, string> {
  const { idToken, development, userId } = getCtx();
  const headers: Record<string, string> = { 'X-Development': development };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

class GenerationService {
  async getGenerationStatus(
    _generationId: string,
    _asyncTaskId: string,
  ): Promise<GetGenerationStatusResult> {
    // ✅ IA-5 CERRADO (api-ia 2026-06-12): generación SÍNCRONA, no hay job async que pollear.
    // status:Pending detiene el polling SWR — correcto para el flujo síncrono. No es un stub pendiente.
    return { error: null, generation: null, status: AsyncTaskStatus.Pending };
  }

  // ✅ 2026-06-11: des-stubeado. api-ia expone DELETE /image/generations/{gen_id}?topic_id=
  // (verificado por curl: GET /image/generations y /image/topics OK). El caller pasa el topic.
  async deleteGeneration(generationId: string, topicId?: string) {
    if (!topicId) return; // sin topic no se puede ubicar la generation en api-ia
    const qs = new URLSearchParams({ topic_id: topicId });
    const res = await fetch(
      `${API_IA_BASE}/image/generations/${encodeURIComponent(generationId)}?${qs.toString()}`,
      { headers: authHeaders(), method: 'DELETE' },
    );
    if (!res.ok) {
      throw new Error(`api-ia DELETE /image/generations HTTP ${res.status}`);
    }
  }
}

export const generationService = new GenerationService();
