import { describe, it, expect } from 'vitest';

import { developments, getDevelopmentConfig, getDevelopmentNameFromHostname } from '../../types/developments';
import { resolveTenantBranding, resolveTenantBrandingByKey } from '../useTenantBranding';

describe('whitelabel multi-tenant', () => {
  it('shared tiene exactamente 11 tenants', () => {
    expect(developments).toHaveLength(11);
  });

  it('champagne-events existe con guión', () => {
    const ce = getDevelopmentConfig('champagne-events');
    expect(ce).toBeDefined();
    expect(ce!.domain).toBe('.champagne-events.com.mx');
    expect(ce!.headTitle).toBe('App Champagne Event Planner');
  });

  it('todos los tenants tienen development y domain', () => {
    for (const d of developments) {
      expect(d.development).toBeTruthy();
      expect(d.domain).toBeTruthy();
      expect(d.name).toBeTruthy();
    }
  });

  it('hostname detection: champagne-events.com.mx', () => {
    expect(getDevelopmentNameFromHostname('app-test.champagne-events.com.mx')).toBe('champagne-events');
    expect(getDevelopmentNameFromHostname('chat-test.champagne-events.com.mx')).toBe('champagne-events');
    expect(getDevelopmentNameFromHostname('champagne-events.com.mx')).toBe('champagne-events');
  });

  it('hostname detection: bodasdehoy', () => {
    expect(getDevelopmentNameFromHostname('chat-test.bodasdehoy.com')).toBe('bodasdehoy');
    expect(getDevelopmentNameFromHostname('app.bodasdehoy.com')).toBe('bodasdehoy');
    expect(getDevelopmentNameFromHostname('organizador.bodasdehoy.com')).toBe('bodasdehoy');
  });

  it('hostname detection: otros tenants', () => {
    expect(getDevelopmentNameFromHostname('app.vivetuboda.com')).toBe('vivetuboda');
    expect(getDevelopmentNameFromHostname('annloevents.com')).toBe('annloevents');
    expect(getDevelopmentNameFromHostname('app.miamorcitocorazon.mx')).toBe('miamorcitocorazon');
    expect(getDevelopmentNameFromHostname('theweddingplanner.mx')).toBe('theweddingplanner');
  });

  it('hostname detection: localhost default', () => {
    expect(getDevelopmentNameFromHostname('localhost')).toBe('bodasdehoy');
  });

  it('resolveTenantBranding devuelve datos correctos', () => {
    const b = resolveTenantBranding('app-test.champagne-events.com.mx');
    expect(b.development).toBe('champagne-events');
    expect(b.name).toBe('App Champagne Event Planner');
    expect(b.primaryColor).toBe('#ecb290');
    expect(b.secondaryColor).toBe('#d07a49');
    expect(b.domain).toBe('champagne-events.com.mx');
  });

  it('resolveTenantBrandingByKey funciona', () => {
    const b = resolveTenantBrandingByKey('annloevents');
    expect(b.development).toBe('annloevents');
    expect(b.name).toBe('Annlo Events');
    expect(b.primaryColor).toBe('#b8a9c9');
  });

  it('resolveTenantBrandingByKey con key inexistente fallback a bodasdehoy', () => {
    const b = resolveTenantBrandingByKey('noexiste');
    expect(b.development).toBe('bodasdehoy');
  });

  it('lista completa de tenants', () => {
    const names = developments.map((d) => d.development).sort();
    expect(names).toEqual([
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
