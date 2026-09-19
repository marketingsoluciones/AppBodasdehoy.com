import { describe, it, expect } from 'vitest';

import { DEVELOPMENTS_CONFIG, getDeveloperDisplayName } from '../developmentDetector';

describe('developmentDetector — DEVELOPMENTS_CONFIG', () => {
  it('tiene 11 tenants (generados desde shared)', () => {
    const keys = Object.keys(DEVELOPMENTS_CONFIG);
    expect(keys.length).toBe(11);
  });

  it('champagne-events existe con guión (no champagneevents)', () => {
    expect(DEVELOPMENTS_CONFIG['champagne-events']).toBeDefined();
    expect(DEVELOPMENTS_CONFIG['champagneevents']).toBeUndefined();
  });

  it('champagne-events tiene datos correctos', () => {
    const ce = DEVELOPMENTS_CONFIG['champagne-events'];
    expect(ce.development).toBe('champagne-events');
    expect(ce.domain).toBe('https://champagne-events.com.mx');
    expect(ce.corsOrigin).toContain('https://champagne-events.com.mx');
    expect(ce.name).toBe('App Champagne Event Planner');
  });

  // Unificación 15-09: se retiró el mapa COLOR_OVERRIDES. El primario sale del paquete
  // compartido y el resto se deriva, así que ninguna marca depende de un override manual.
  // (Este test exigía el morado #667eea que el fix de marca del 6-sep ya había corregido:
  //  llevaba fallando desde entonces.)
  it('bodasdehoy toma el primario de la marca compartida, sin override', () => {
    const b = DEVELOPMENTS_CONFIG['bodasdehoy'];
    expect(b.colors.primary).toBe('#F7628C');
    expect(b.colors.secondary).not.toBe(b.colors.primary);
    expect(b.colors.primary).not.toBe('#667eea');
  });

  it('vivetuboda tiene colores generados desde shared theme', () => {
    const v = DEVELOPMENTS_CONFIG['vivetuboda'];
    expect(v).toBeDefined();
    expect(v.colors.primary).toBe('#F4A4A4'); // theme.primaryColor de shared
  });

  it('todos los tenants tienen api, colors y corsOrigin', () => {
    for (const [key, config] of Object.entries(DEVELOPMENTS_CONFIG)) {
      expect(config.api.graphqlEndpoint, `${key} graphql`).toBeTruthy();
      expect(config.colors.primary, `${key} primary`).toBeTruthy();
      expect(config.corsOrigin.length, `${key} corsOrigin`).toBeGreaterThan(0);
    }
  });

  it('getDeveloperDisplayName resuelve champagne-events', () => {
    expect(getDeveloperDisplayName('champagne-events')).toBe('App Champagne Event Planner');
  });

  it('getDeveloperDisplayName resuelve bodasdehoy', () => {
    expect(getDeveloperDisplayName('bodasdehoy')).toBe('Bodas de hoy - Organizador de Bodas');
  });

  it('getDeveloperDisplayName humaniza key desconocida', () => {
    expect(getDeveloperDisplayName('mi-tenant-nuevo')).toBe('Mi tenant nuevo');
  });

  it('lista completa de claves', () => {
    const keys = Object.keys(DEVELOPMENTS_CONFIG).sort();
    expect(keys).toEqual([
      'annloevents',
      'bodasdehoy',
      'champagne-events',
      'corporativozr',
      'eventosintegrados',
      'eventosorganizador',
      'eventosplanificador',
      'miamorcitocorazon',
      'ohmaratilano',
      'theweddingplanner',
      'vivetuboda',
    ]);
  });
});
