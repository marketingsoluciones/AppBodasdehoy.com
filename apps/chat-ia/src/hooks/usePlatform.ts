import { useMemo, useRef } from 'react';

import {
  getBrowser,
  getPlatform,
  isArc,
  isInStandaloneMode,
  isSonomaOrLaterSafari,
} from '@/utils/platform';

export const usePlatform = () => {
  // ✅ Agregar try-catch para evitar errores en la detección
  let platform: string | undefined;
  let browser: string | undefined;

  try {
    platform = getPlatform();
  } catch (error) {
    console.warn('⚠️ Error obteniendo platform en usePlatform:', error);
    platform = 'Unknown';
  }

  try {
    browser = getBrowser();
  } catch (error) {
    console.warn('⚠️ Error obteniendo browser en usePlatform:', error);
    browser = 'Chrome'; // Fallback a Chrome
  }

  const platformRef = useRef(platform);
  const browserRef = useRef(browser);

  const platformInfo = {
    isApple: platformRef.current && ['mac os', 'ios'].includes(platformRef.current?.toLowerCase()),
    isArc: (() => {
      try {
        return isArc();
      } catch {
        return false;
      }
    })(),
    isChrome: browserRef.current?.toLowerCase() === 'chrome',
    isChromium:
      browserRef.current &&
      ['chrome', 'edge', 'opera', 'brave', 'chromium'].includes(browserRef.current?.toLowerCase()),
    isEdge: browserRef.current?.toLowerCase() === 'edge',
    isFirefox: browserRef.current?.toLowerCase() === 'firefox',
    isIOS: platformRef.current?.toLowerCase() === 'ios',
    isMacOS: platformRef.current?.toLowerCase() === 'mac os',
    isPWA: (() => {
      try {
        return isInStandaloneMode();
      } catch {
        return false;
      }
    })(),
    isSafari: browserRef.current?.toLowerCase() === 'safari',
    isSonomaOrLaterSafari: (() => {
      try {
        return isSonomaOrLaterSafari();
      } catch {
        return false;
      }
    })(),
  };

  return useMemo(
    () => ({
      ...platformInfo,
      isSupportInstallPWA:
        !platformInfo.isArc &&
        !platformInfo.isFirefox &&
        ((platformInfo.isChromium && !platformInfo.isIOS) ||
          (platformInfo.isMacOS && platformInfo.isSonomaOrLaterSafari)),
    }),
    [],
  );
};
