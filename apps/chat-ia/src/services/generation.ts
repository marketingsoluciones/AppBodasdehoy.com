// CAPA 2 PASO C 2026-06-05: generation NO tiene cobertura en api-ia (READ/RUNTIME
// solo, NO CRUD por id de generation). Quedan stubs documentados que retornan
// valores neutros (no rompen la UI de generation feed).
//
// Pregunta abierta a api-ia (ver docs/backend-asks/slack-ready/):
//   - getGenerationStatus(generationId, asyncTaskId) → ¿endpoint poll?
//   - deleteGeneration(generationId)                 → ¿endpoint DELETE?
//
// Mientras llega, el flujo del front:
//   - createImage YA va a api-ia (image.ts /webapi/text-to-image)
//   - Status/delete de generations persistidas viven en api-mcp.
//     api-ia los proxearía si los expusiera.

class GenerationService {
  async getGenerationStatus(_generationId: string, _asyncTaskId: string) {
    // TODO api-ia: endpoint /api/generations/{id}/status. Mientras: stub.
    return { status: 'unknown' as const };
  }

  async deleteGeneration(_generationId: string) {
    // TODO api-ia: endpoint DELETE /api/generations/{id}. Mientras: no-op.
    return;
  }
}

export const generationService = new GenerationService();
