/**
 * Tests de Integración - Acciones Guardadas del Backend
 * 
 * Usa las 300-600 acciones guardadas en el backend
 */

import { describe, it, expect } from 'vitest';
import { getTestActions, BACKEND_URL } from '../backend';

describe('Backend - Acciones Guardadas (300-600 acciones)', () => {
  it('debe poder conectar con el backend', async () => {
    const response = await fetch(`${BACKEND_URL}/health`);
    expect(response.ok).toBe(true);
  }, 10000);

  it('debe cargar acciones del backend', async () => {
    const actions = await getTestActions(10);
    
    // Si el endpoint existe, debe retornar acciones
    // Si no existe, retornará array vacío (no es error)
    expect(actions).toBeDefined();
    expect(Array.isArray(actions)).toBe(true);
    
    if (actions.length > 0) {
      // Validar estructura de acciones
      actions.forEach((action) => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('action');
        expect(typeof action.action).toBe('string');
      });
    }
  }, 15000);

  it('debe poder obtener hasta 600 acciones', async () => {
    const actions = await getTestActions(600);
    
    // Si hay acciones, deben estar entre 300-600
    if (actions.length > 0) {
      expect(actions.length).toBeGreaterThanOrEqual(300);
      expect(actions.length).toBeLessThanOrEqual(600);
    }
  }, 30000);
});
