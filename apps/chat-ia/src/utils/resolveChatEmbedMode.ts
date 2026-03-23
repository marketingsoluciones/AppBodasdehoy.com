/**
 * Determina si el chat debe mostrarse en modo embebido (UI recortada: sin panel de sesiones, etc.).
 *
 * Por defecto, cualquier iframe o ?embed=1 activa el modo embed.
 * La integración en app-eventos pasa ?full_ui=1 para forzar la UI completa dentro del iframe.
 */
export function resolveChatEmbedMode(
  searchParams: Pick<URLSearchParams, 'get'> | null,
  win: Window | undefined,
): boolean {
  if (searchParams?.get('full_ui') === '1') return false;

  let isInIframe = false;
  try {
    isInIframe = !!win && win.self !== win.top;
  } catch {
    isInIframe = true;
  }

  return (
    isInIframe ||
    searchParams?.get('embed') === '1' ||
    searchParams?.get('embedded') === '1' ||
    searchParams?.get('minimal') === '1'
  );
}
