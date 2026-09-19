/**
 * Formatea bytes a una cadena legible (KB, MB, GB…)
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/**
 * Formatea bytes/segundo a una cadena legible de velocidad (KB/s, MB/s…)
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`;
}

/**
 * Formatea segundos a una cadena legible (1m 30s, 45s…)
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.ceil(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}
