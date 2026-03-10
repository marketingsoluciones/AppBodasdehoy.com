/**
 * Componente para gestionar la renovación automática del JWT token
 * 
 * Se debe colocar en el layout principal para que funcione en toda la app
 * Características:
 * - Verificación automática cada 5 minutos
 * - Renovación silenciosa cuando quedan < 2 días
 * - Notificación al usuario cuando se renueva
 */

'use client';

import { useTokenRefresh } from '@/hooks/useTokenRefresh';

const TokenRefreshManager = () => {
  const { status } = useTokenRefresh();

  // Este componente no renderiza nada, solo ejecuta la lógica en el background
  return null;
};

export default TokenRefreshManager;




