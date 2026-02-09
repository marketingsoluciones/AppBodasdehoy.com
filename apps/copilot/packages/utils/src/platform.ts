import UAParser from 'ua-parser-js';

import { isOnServerSide } from './env';

export const getParser = () => {
  if (isOnServerSide) return new UAParser('Node');

  try {
    let ua = navigator.userAgent;
    if (!ua) {
      console.warn('⚠️ navigator.userAgent no disponible, usando fallback');
      return new UAParser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    }
    return new UAParser(ua);
  } catch (error) {
    console.warn('⚠️ Error creando UAParser, usando fallback:', error);
    return new UAParser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }
};

export const getPlatform = () => {
  try {
    const os = getParser().getOS().name;
    return os || 'Unknown';
  } catch (error) {
    console.warn('⚠️ Error obteniendo platform, usando fallback:', error);
    return 'Unknown';
  }
};

export const getBrowser = () => {
  try {
    const browser = getParser().getResult().browser.name;
    // ✅ Normalizar nombres de navegadores Chromium
    if (browser) {
      const browserLower = browser.toLowerCase();
      // Normalizar variantes de Chromium
      if (browserLower.includes('chromium') || browserLower === 'chrome') {
        return 'Chrome';
      }
      if (browserLower.includes('edge')) {
        return 'Edge';
      }
      if (browserLower.includes('opera')) {
        return 'Opera';
      }
      if (browserLower.includes('brave')) {
        return 'Brave';
      }
    }
    return browser || 'Unknown';
  } catch (error) {
    console.warn('⚠️ Error obteniendo browser, usando fallback:', error);
    return 'Chrome'; // Fallback a Chrome (Chromium)
  }
};

export const browserInfo = {
  browser: getBrowser(),
  isMobile: getParser().getDevice().type === 'mobile',
  os: getParser().getOS().name,
};

export const isMacOS = () => getPlatform() === 'Mac OS';

export const isArc = () => {
  if (isOnServerSide) return false;
  return (
    window.matchMedia('(--arc-palette-focus: var(--arc-background-simple-color))').matches ||
    Boolean('arc' in window || 'ArcControl' in window || 'ARCControl' in window) ||
    Boolean(getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-title'))
  );
};

export const isInStandaloneMode = () => {
  if (isOnServerSide) return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as any).standalone === true)
  );
};

export const isSonomaOrLaterSafari = () => {
  if (isOnServerSide) return false;

  // refs: https://github.com/khmyznikov/pwa-install/blob/0904788b9d0e34399846f6cb7dbb5efeabb62c20/src/utils.ts#L24
  const userAgent = navigator.userAgent.toLowerCase();
  if (navigator.maxTouchPoints || !/macintosh/.test(userAgent)) return false;

  // check safari version >= 17
  const version = /version\/(\d{2})\./.exec(userAgent);
  if (!version || !version[1] || !(parseInt(version[1]) >= 17)) return false;

  try {
    // hacky way to detect Sonoma
    const audioCheck = document.createElement('audio').canPlayType('audio/wav; codecs="1"');
    const webGLCheck = new OffscreenCanvas(1, 1).getContext('webgl');
    return Boolean(audioCheck) && Boolean(webGLCheck);
  } catch {
    return false;
  }
};
