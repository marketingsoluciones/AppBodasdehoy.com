import { describe, expect, it } from 'vitest';

import { developments } from '@bodasdehoy/shared/types';

/**
 * Cuando la llamada de branding no contesta a tiempo, la aplicación ENTERA se pinta con los
 * colores de respaldo. Hasta el 18-09 ese respaldo era #667eea —un morado azulado que no es
 * de ninguna marca—, así que un timeout de red se veía exactamente igual que "la app no
 * respeta los colores de mi marca".
 *
 * Esta prueba comprueba lo único que hace falta para que el respaldo sirva: que la tabla de
 * marcas se pueda buscar por `development` y traiga color. Escrito como índice
 * (`developments[dev]`) devolvía undefined SIEMPRE, porque la tabla es un array — y nada
 * habría fallado: se habría seguido pintando el morado.
 */
describe('respaldo de branding', () => {
  it('la tabla de marcas se busca por development y trae color', () => {
    // El color vive en `theme`, no suelto en la raíz: escribirlo en la raíz —como hice al
    // primer intento— devolvía undefined y el respaldo habría seguido siendo el morado.
    const lista = developments as Array<{ development?: string; theme?: { primaryColor?: string } }>;
    const marca = lista.find((m) => m?.development === 'bodasdehoy');
    expect(marca?.theme?.primaryColor).toBeTruthy();
    expect(marca?.theme?.primaryColor).not.toBe('#667eea');
  });

  it('indexar la tabla por clave no funciona: es un array', () => {
    // Deja constancia del error concreto que se cometió, para que no se repita al refactorizar.
    expect((developments as never)['bodasdehoy' as never]).toBeUndefined();
  });

  it('todas las marcas de la tabla tienen color propio', () => {
    const lista = developments as Array<{ development?: string; theme?: { primaryColor?: string } }>;
    const sinColor = lista.filter((m) => !m?.theme?.primaryColor).map((m) => m?.development);
    expect(sinColor).toEqual([]);
  });
});
