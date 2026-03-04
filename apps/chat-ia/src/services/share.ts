import type { PartialDeep } from 'type-fest';

import { LOBE_URL_IMPORT_NAME } from '@/const/url';
import { UserSettings } from '@/types/user/settings';

class ShareService {
  /**
   * Creates a share settings URL with the provided settings.
   * @param settings - The settings object to be encoded in the URL.
   * @returns The share settings URL.
   */
  public createShareSettingsUrl = (settings: PartialDeep<UserSettings>) => {
    return `/?${LOBE_URL_IMPORT_NAME}=${encodeURI(JSON.stringify(settings))}`;
  };

  /**
   * Decode share settings from search params
   * @param settings
   * @returns
   */
  decodeShareSettings = (settings: string) => {
    try {
      // ✅ FIX: Validar que sea JSON válido antes de parsear
      const trimmed = settings.trim();
      if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
        console.warn('⚠️ [shareService] Settings no parece ser JSON válido');
        return { message: 'Invalid JSON format' };
      }
      
      // ✅ FIX: Intentar decodificar URL si está encoded
      let decoded = trimmed;
      try {
        decoded = decodeURIComponent(trimmed);
      } catch {
        // Si no está encoded, usar el valor original
        decoded = trimmed;
      }
      
      return { data: JSON.parse(decoded) as PartialDeep<UserSettings> };
    } catch (e) {
      console.error('❌ [shareService] Error decodificando settings:', e);
      return { message: e instanceof Error ? e.message : 'Error parsing settings' };
    }
  };
}

export const shareService = new ShareService();
