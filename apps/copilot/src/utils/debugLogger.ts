/**
 * Debug Logger - Escribe logs directamente a localStorage para análisis
 * Se usa cuando el servidor de logging no está disponible
 */

const DEBUG_LOG_KEY = 'DEBUG_LOGS';
const MAX_LOGS = 100;

interface DebugLog {
  data?: any;
  hypothesisId?: string;
  location: string;
  message: string;
  timestamp: number;
}

export const debugLog = (location: string, message: string, data?: any, hypothesisId?: string) => {
  if (typeof window === 'undefined') return;

  const log: DebugLog = {
    data,
    hypothesisId,
    location,
    message,
    timestamp: Date.now(),
  };

  // También a console con formato mejorado para Chrome DevTools
  const logPrefix = `%c[DEBUG-${hypothesisId || 'X'}]%c ${location}`;
  const logStyle = 'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;';
  const messageStyle = 'color: #333; font-weight: normal;';
  console.log(logPrefix, logStyle, messageStyle, message, data || '');
  
  // También log estructurado para mejor visualización en DevTools
  console.groupCollapsed(`🔍 [DEBUG-${hypothesisId || 'X'}] ${location}: ${message}`);
  if (data) {
    console.table ? console.table(data) : console.log('Data:', data);
  }
  console.log('Timestamp:', new Date(log.timestamp).toLocaleTimeString());
  console.groupEnd();

  // Guardar en localStorage
  try {
    const existingLogs = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]') as DebugLog[];
    existingLogs.push(log);
    
    // Mantener solo los últimos MAX_LOGS
    if (existingLogs.length > MAX_LOGS) {
      existingLogs.shift();
    }
    
    localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(existingLogs));

    // ✅ Enviar al backend también (sin bloquear)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
    fetch(`${BACKEND_URL}/api/debug-logs/upload`, {
      body: JSON.stringify({ logs: [log] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    }).catch(() => {}); // Ignorar errores de red
  } catch (error) {
    // Si localStorage falla, solo usar console
    console.warn('⚠️ No se pudo guardar log en localStorage:', error);
  }
};

export const getDebugLogs = (): DebugLog[] => {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]') as DebugLog[];
  } catch {
    return [];
  }
};

export const clearDebugLogs = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEBUG_LOG_KEY);
};

































