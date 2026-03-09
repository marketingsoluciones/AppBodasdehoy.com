/**
 * Componente para actualizar el favicon dinámicamente según el developer
 * Se ejecuta en el cliente para cambiar el favicon cuando cambia el developer
 */

'use client';

import { useEffect } from 'react';
import { useDeveloperBranding } from '@/hooks/useDeveloperBranding';

/**
 * Actualizar el favicon en el DOM
 */
function updateFavicon(url: string) {
  // Buscar el link del favicon
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

  if (!link) {
    // Crear nuevo link si no existe
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.append(link);
  }

  // Actualizar href
  link.href = url;

  // También actualizar shortcut icon si existe
  const shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
  if (shortcut) {
    shortcut.href = url;
  }
}

/**
 * Actualizar el apple-touch-icon en el DOM
 */
function updateAppleTouchIcon(url: string) {
  let link: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");

  if (!link) {
    // Crear nuevo link si no existe
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.append(link);
  }

  // Actualizar href
  link.href = url;
}

const DynamicFavicon = () => {
  const { branding, loading } = useDeveloperBranding();

  useEffect(() => {
    if (loading || !branding) return;

    // Actualizar favicon
    if (branding.favicon) {
      updateFavicon(branding.favicon);
    }

    // Actualizar apple-touch-icon
    if (branding.apple_touch_icon) {
      updateAppleTouchIcon(branding.apple_touch_icon);
    }
  }, [branding, loading]);

  return null;
};

export default DynamicFavicon;




