/**
 * Iniciales para avatar tipo “empresa” (2 letras máx.).
 * Emails → parte local; nombres “Nombre Apellido” → N + A.
 */
export function getAvatarInitials(label: string): string {
  const raw = label.trim();
  if (!raw) return '?';

  const emailMatch = raw.match(/^([^@]+)@/);
  const base = emailMatch ? emailMatch[1] : raw;

  if (base.includes(' ')) {
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0].charAt(0);
      const b = parts[parts.length - 1].charAt(0);
      return (a + b).toUpperCase();
    }
  }

  const cleaned = base.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '');
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  return base.slice(0, 2).toUpperCase() || '?';
}

/** True si la URL es el icono PWA genérico o el placeholder por defecto. */
export function isGenericPlaceholderAvatarUrl(url: string, defaultUrl: string): boolean {
  if (!url) return true;
  if (url === defaultUrl) return true;
  const u = url.toLowerCase();
  return u.includes('icon-192x192') || u.includes('/icons/icon-');
}
