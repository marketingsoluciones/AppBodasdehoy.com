import { describe, expect, it } from 'vitest';

import { isWhatsAppWindowExpired } from './useWhatsAppTemplates';

const HACE_DOS_DIAS = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
const HACE_UNA_HORA = new Date(Date.now() - 3600 * 1000).toISOString();

/**
 * La ventana de 24h y las plantillas HSM son de WhatsApp Cloud API (Meta). Un número
 * vinculado por QR no las tiene. Hasta el 18-09 se bloqueaba también el QR, y además se daba
 * por cerrada la ventana de cualquier conversación sin mensajes entrantes: el operador veía
 * "selecciona una plantilla aprobada por Meta" en conversaciones donde podía escribir gratis.
 */
describe('ventana de 24h de WhatsApp', () => {
  it('no aplica a un número vinculado por QR, por antiguo que sea', () => {
    expect(isWhatsAppWindowExpired('whatsapp', HACE_DOS_DIAS, 'WEB_QR')).toBe(false);
  });

  it('sí aplica a la API de Meta cuando han pasado más de 24h', () => {
    expect(isWhatsAppWindowExpired('whatsapp', HACE_DOS_DIAS, 'WAB')).toBe(true);
  });

  it('no bloquea a la API de Meta dentro de las 24h', () => {
    expect(isWhatsAppWindowExpired('whatsapp', HACE_UNA_HORA, 'WAB')).toBe(false);
  });

  it('sin mensajes entrantes no se afirma que esté cerrada', () => {
    expect(isWhatsAppWindowExpired('whatsapp', null, 'WAB')).toBe(false);
  });

  it('sin tipo de conexión conocido no bloquea: impedir responder es peor que no bloquear', () => {
    expect(isWhatsAppWindowExpired('whatsapp', HACE_DOS_DIAS, undefined)).toBe(false);
  });

  it('no aplica a otros canales', () => {
    expect(isWhatsAppWindowExpired('instagram', HACE_DOS_DIAS, 'WAB')).toBe(false);
  });
});
