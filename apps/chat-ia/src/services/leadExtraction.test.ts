/**
 * Tests de Lead Extraction
 * ========================
 * Simulan escenarios reales donde el AI extrae datos de leads
 * desde las respuestas del chatbot:
 * - AI detecta tipo de evento ("boda") en la conversación
 * - AI extrae número de invitados y presupuesto
 * - AI captura contacto del usuario (nombre, email, teléfono)
 * - Múltiples bloques LEAD_DATA se mergean progresivamente
 * - Formato nested vs flat se maneja correctamente
 * - Contenido visible queda limpio (sin bloques ocultos)
 */
import { describe, expect, it, vi } from 'vitest';

import { extractLeadData, hasLeadData } from './leadExtraction';

describe('Lead Extraction', () => {
  // ━━━ Escenario: AI detecta tipo de evento ━━━

  describe('AI responde con datos del evento', () => {
    it('extrae event_type del bloque LEAD_DATA', () => {
      const content =
        '¡Qué emocionante! Organizaré tu boda perfecta.' +
        '\n<!--LEAD_DATA {"event_type":"boda","guest_count":150} LEAD_DATA-->';

      const { data, cleanContent } = extractLeadData(content);

      expect(data).not.toBeNull();
      expect(data!.qualifying_data?.event_type).toBe('boda');
      expect(data!.qualifying_data?.guest_count).toBe(150);
      expect(cleanContent).toBe('¡Qué emocionante! Organizaré tu boda perfecta.');
    });

    it('extrae datos de formato nested (qualifying_data)', () => {
      const content =
        'Entendido, una boda para 200 personas.' +
        '\n<!--LEAD_DATA {"qualifying_data":{"event_type":"boda","guest_count":200,"budget":"15000€"}} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.event_type).toBe('boda');
      expect(data!.qualifying_data?.guest_count).toBe(200);
      expect(data!.qualifying_data?.budget).toBe('15000€');
    });

    it('extrae location y event_date', () => {
      const content =
        'Perfecto, boda en Madrid el 20 de junio.' +
        '\n<!--LEAD_DATA {"event_date":"2025-06-20","location":"Madrid"} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.event_date).toBe('2025-06-20');
      expect(data!.qualifying_data?.location).toBe('Madrid');
    });

    it('extrae services_needed como array', () => {
      const content =
        'Te ayudo con esos servicios.' +
        '\n<!--LEAD_DATA {"services_needed":["fotografía","catering","flores"]} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.services_needed).toEqual([
        'fotografía',
        'catering',
        'flores',
      ]);
    });
  });

  // ━━━ Escenario: AI captura datos de contacto ━━━

  describe('AI extrae datos de contacto del usuario', () => {
    it('extrae contacto en formato nested', () => {
      const content =
        'Gracias María, te contactaremos.' +
        '\n<!--LEAD_DATA {"contact":{"name":"María","email":"maria@test.com","phone":"+34600111222"}} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.contact?.name).toBe('María');
      expect(data!.contact?.email).toBe('maria@test.com');
      expect(data!.contact?.phone).toBe('+34600111222');
    });

    it('extrae contacto en formato flat', () => {
      const content =
        'Perfecto, ya tengo tus datos.' +
        '\n<!--LEAD_DATA {"name":"Juan","email":"juan@boda.com"} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.contact?.name).toBe('Juan');
      expect(data!.contact?.email).toBe('juan@boda.com');
    });

    it('campos flat sobreescriben campos nested', () => {
      const content =
        'Ok.' +
        '\n<!--LEAD_DATA {"contact":{"name":"Viejo"},"name":"Nuevo"} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.contact?.name).toBe('Nuevo');
    });
  });

  // ━━━ Escenario: Múltiples bloques LEAD_DATA se mergean ━━━

  describe('Múltiples bloques en un mismo mensaje', () => {
    it('mergea qualifying_data de dos bloques', () => {
      const content =
        'Entendido.' +
        '\n<!--LEAD_DATA {"event_type":"boda"} LEAD_DATA-->' +
        '\nMás info.' +
        '\n<!--LEAD_DATA {"guest_count":100,"budget":"10000€"} LEAD_DATA-->';

      const { data, cleanContent } = extractLeadData(content);

      expect(data!.qualifying_data?.event_type).toBe('boda');
      expect(data!.qualifying_data?.guest_count).toBe(100);
      expect(data!.qualifying_data?.budget).toBe('10000€');
      // Contenido limpio
      expect(cleanContent).toBe('Entendido.\n\nMás info.');
    });

    it('mergea contact y qualifying_data de bloques separados', () => {
      const content =
        'Ok.' +
        '\n<!--LEAD_DATA {"event_type":"comunión"} LEAD_DATA-->' +
        '\n<!--LEAD_DATA {"name":"Ana","phone":"+34611222333"} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.event_type).toBe('comunión');
      expect(data!.contact?.name).toBe('Ana');
      expect(data!.contact?.phone).toBe('+34611222333');
    });

    it('el segundo bloque sobreescribe campos del primero', () => {
      const content =
        'A.' +
        '\n<!--LEAD_DATA {"guest_count":50} LEAD_DATA-->' +
        '\n<!--LEAD_DATA {"guest_count":200} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.guest_count).toBe(200);
    });
  });

  // ━━━ Escenario: Contenido sin bloques LEAD_DATA ━━━

  describe('Mensaje sin datos de lead', () => {
    it('retorna null cuando no hay bloques', () => {
      const content = 'Hola, ¿en qué puedo ayudarte con tu boda?';

      const { data, cleanContent } = extractLeadData(content);

      expect(data).toBeNull();
      expect(cleanContent).toBe(content);
    });

    it('retorna null para contenido vacío', () => {
      const { data } = extractLeadData('');

      expect(data).toBeNull();
    });
  });

  // ━━━ Escenario: JSON malformado en LEAD_DATA ━━━

  describe('JSON inválido en bloque LEAD_DATA', () => {
    it('ignora bloques con JSON inválido y no crashea', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const content =
        'Info.' +
        '\n<!--LEAD_DATA {invalid json} LEAD_DATA-->';

      const { data, cleanContent } = extractLeadData(content);

      expect(data).toBeNull();
      expect(cleanContent).toBe(content);
    });

    it('extrae datos válidos e ignora bloques inválidos', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const content =
        'Info.' +
        '\n<!--LEAD_DATA {roto} LEAD_DATA-->' +
        '\n<!--LEAD_DATA {"event_type":"boda"} LEAD_DATA-->';

      const { data } = extractLeadData(content);

      expect(data!.qualifying_data?.event_type).toBe('boda');
    });
  });

  // ━━━ Escenario: limpieza del contenido visible ━━━

  describe('Limpieza del contenido visible', () => {
    it('remueve todos los bloques LEAD_DATA del contenido', () => {
      const content =
        'Texto antes.' +
        '\n<!--LEAD_DATA {"event_type":"boda"} LEAD_DATA-->' +
        '\nTexto medio.' +
        '\n<!--LEAD_DATA {"guest_count":50} LEAD_DATA-->' +
        '\nTexto después.';

      const { cleanContent } = extractLeadData(content);

      expect(cleanContent).not.toContain('LEAD_DATA');
      expect(cleanContent).toContain('Texto antes.');
      expect(cleanContent).toContain('Texto medio.');
      expect(cleanContent).toContain('Texto después.');
    });
  });

  // ━━━ hasLeadData ━━━

  describe('hasLeadData', () => {
    it('retorna true cuando hay un bloque LEAD_DATA', () => {
      expect(hasLeadData('Hola <!--LEAD_DATA {} LEAD_DATA-->')).toBe(true);
    });

    it('retorna false cuando no hay bloque', () => {
      expect(hasLeadData('Hola, ¿cómo estás?')).toBe(false);
    });

    it('retorna false para contenido vacío', () => {
      expect(hasLeadData('')).toBe(false);
    });

    it('funciona correctamente en llamadas consecutivas (regex lastIndex reset)', () => {
      // Este test verifica que el reset de lastIndex funciona
      expect(hasLeadData('<!--LEAD_DATA {} LEAD_DATA-->')).toBe(true);
      expect(hasLeadData('<!--LEAD_DATA {} LEAD_DATA-->')).toBe(true);
      expect(hasLeadData('sin datos')).toBe(false);
      expect(hasLeadData('<!--LEAD_DATA {} LEAD_DATA-->')).toBe(true);
    });
  });
});
