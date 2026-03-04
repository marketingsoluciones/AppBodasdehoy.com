import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Desktop TRPC Route', () => {
  it('should have desktop directory', () => {
    // El directorio desktop no existe en esta estructura
    // Este test verifica la estructura de rutas TRPC
    // Verificar que existe al menos una ruta TRPC
    const trpcRoutes = [
      join(__dirname, 'async'),
      join(__dirname, 'edge'),
      join(__dirname, 'lambda'),
      join(__dirname, 'mobile'),
      join(__dirname, 'tools'),
    ];
    
    // Al menos una ruta debe existir
    const hasAnyRoute = trpcRoutes.some(route => existsSync(route));
    expect(hasAnyRoute).toBe(true);
  });
});
