/**
 * Componente para aplicar colores del developer al tema dinámicamente
 */

'use client';

import { useEffect } from 'react';
import { useDeveloperColors } from '@/hooks/useDeveloperBranding';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

const DeveloperTheme = () => {
  const developerColors = useDeveloperColors();
  const currentPrimaryColor = useUserStore(userGeneralSettingsSelectors.primaryColor);

  useEffect(() => {
    if (!developerColors) return;

    // Si el usuario no ha configurado un color personalizado, aplicar el del developer
    // Nota: Esto puede ser más complejo dependiendo de cómo quieras manejar las preferencias del usuario
    // Por ahora, solo actualizamos si no hay un color personalizado guardado
    
    // Podemos aplicar colores CSS variables directamente al document root
    const root = document.documentElement;
    
    if (developerColors.primary) {
      root.style.setProperty('--developer-primary-color', developerColors.primary);
    }
    
    if (developerColors.secondary) {
      root.style.setProperty('--developer-secondary-color', developerColors.secondary);
    }
    
    if (developerColors.accent) {
      root.style.setProperty('--developer-accent-color', developerColors.accent);
    }
  }, [developerColors, currentPrimaryColor]);

  return null;
};

export default DeveloperTheme;


