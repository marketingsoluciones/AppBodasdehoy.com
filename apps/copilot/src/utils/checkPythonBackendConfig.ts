/**
 * Utilidad para verificar configuración de backend Python
 * Funciona tanto en cliente como en servidor
 *
 * IMPORTANTE: En Next.js, las variables de entorno accesibles en el cliente
 * deben tener el prefijo NEXT_PUBLIC_. En el servidor, se pueden usar ambas.
 */
export function getPythonBackendConfig() {
  const isClient = typeof window !== 'undefined';

  // En cliente, solo usar NEXT_PUBLIC_*
  // En servidor, intentar primero sin prefijo, luego con prefijo
  let USE_PYTHON_BACKEND: boolean;
  let PYTHON_BACKEND_URL: string | undefined;

  if (isClient) {
    // Cliente: solo NEXT_PUBLIC_*
    const envValue = process.env.NEXT_PUBLIC_USE_PYTHON_BACKEND;
    // ✅ CORRECCIÓN: Solo activar si está explícitamente configurado como 'true' o '1'
    // Si no está definido, NO activar (evita activación accidental)
    USE_PYTHON_BACKEND = envValue === 'true' || envValue === '1';
    PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  } else {
    // Servidor: intentar sin prefijo primero, luego con prefijo
    const serverValue = process.env.USE_PYTHON_BACKEND;
    const publicValue = process.env.NEXT_PUBLIC_USE_PYTHON_BACKEND;

    if (serverValue !== undefined) {
      USE_PYTHON_BACKEND = serverValue !== 'false' && serverValue !== '0';
    } else if (publicValue !== undefined) {
      USE_PYTHON_BACKEND = publicValue !== 'false' && publicValue !== '0';
    } else {
      USE_PYTHON_BACKEND = true; // Default: true
    }

    PYTHON_BACKEND_URL =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  return {
    PYTHON_BACKEND_URL: PYTHON_BACKEND_URL || undefined,
    USE_PYTHON_BACKEND,
  };
}













