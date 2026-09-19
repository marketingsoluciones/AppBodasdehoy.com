import { describe, expect, it } from 'vitest';

import {
  looksLikeSessionJwt,
  resolveDevelopmentFromHost,
  resolveSessionIdentity,
} from './serverSessionAuth';

/** Construye un JWT de mentira pero bien formado, con el payload que se pida. */
function fakeJwt(payload: Record<string, any>): string {
  const b64 = (o: any) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma-no-verificada`;
}

const EN_UNA_HORA = Math.floor(Date.now() / 1000) + 3600;
const HACE_UNA_HORA = Math.floor(Date.now() / 1000) - 3600;

function peticion(
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { headers });
}

describe('looksLikeSessionJwt', () => {
  it('acepta un JWT bien formado y vigente', () => {
    expect(looksLikeSessionJwt(fakeJwt({ exp: EN_UNA_HORA, uid: 'u1' }))).toBe(true);
  });

  it('acepta el mismo token con el prefijo Bearer', () => {
    expect(looksLikeSessionJwt(`Bearer ${fakeJwt({ exp: EN_UNA_HORA, uid: 'u1' })}`)).toBe(true);
  });

  it('rechaza el bypass trivial que tenía el gate antes del fix', () => {
    // Esto es literalmente lo que colaba con `?token=x`.
    expect(looksLikeSessionJwt('x')).toBe(false);
    expect(looksLikeSessionJwt('Bearer x')).toBe(false);
  });

  it('rechaza un token caducado', () => {
    expect(looksLikeSessionJwt(fakeJwt({ exp: HACE_UNA_HORA, uid: 'u1' }))).toBe(false);
  });

  it('rechaza algo con 3 segmentos que no es un JWT', () => {
    expect(looksLikeSessionJwt('aaa.bbb.ccc')).toBe(false);
  });

  it('deja pasar un token sin exp — decide el backend', () => {
    expect(looksLikeSessionJwt(fakeJwt({ uid: 'u1' }))).toBe(true);
  });
});

describe('resolveDevelopmentFromHost', () => {
  it('saca la marca del dominio de producción', () => {
    expect(resolveDevelopmentFromHost('chat.bodasdehoy.com')).toBe('bodasdehoy');
    expect(resolveDevelopmentFromHost('chat-dev.eventosorganizador.com')).toBe(
      'eventosorganizador',
    );
    expect(resolveDevelopmentFromHost('app-test.vivetuboda.com')).toBe('vivetuboda');
  });

  it('funciona con dominios de dos niveles', () => {
    expect(resolveDevelopmentFromHost('chat-test.champagne-events.com.mx')).toBe(
      'champagne-events',
    );
  });

  it('ignora el puerto', () => {
    expect(resolveDevelopmentFromHost('chat.bodasdehoy.com:3210')).toBe('bodasdehoy');
  });

  it('cae al default cuando el host no dice nada', () => {
    expect(resolveDevelopmentFromHost('localhost:3210')).toBe('bodasdehoy');
    expect(resolveDevelopmentFromHost('')).toBe('bodasdehoy');
  });
});

describe('resolveSessionIdentity — el gate de IMG-01 / IMG-02 / MARCA-01', () => {
  const tokenValido = fakeJwt({ email: 'a@b.com', exp: EN_UNA_HORA, uid: 'uid-real' });

  it('rechaza una petición sin credencial', () => {
    expect(resolveSessionIdentity(peticion('https://chat.bodasdehoy.com/api/storage/upload'))).toBeNull();
  });

  it('IMG-01 · rechaza X-User-ID inventado sin token', () => {
    // El ataque exacto que la auditoría del front midió como 200/400.
    const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
      'X-Development': 'bodasdehoy',
      'X-User-ID': 'usuario-inventado-qa',
    });
    expect(resolveSessionIdentity(req)).toBeNull();
  });

  it('IMG-02 · rechaza una petición sin ninguna cabecera (antes caía en "anonymous")', () => {
    expect(resolveSessionIdentity(peticion('https://chat.bodasdehoy.com/api/storage/files/x'))).toBeNull();
  });

  it('acepta un token válido y saca el uid del claim, no de la cabecera', () => {
    const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
      authorization: `Bearer ${tokenValido}`,
      // La cabecera miente a propósito: debe ganar el claim.
      'X-User-ID': 'usuario-inventado-qa',
    });
    const identidad = resolveSessionIdentity(req);
    expect(identidad?.userId).toBe('uid-real');
    expect(identidad?.email).toBe('a@b.com');
  });

  it('MARCA-01 · la marca sale del hostname, no de X-Development', () => {
    const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
      authorization: `Bearer ${tokenValido}`,
      'X-Development': 'eventosorganizador',
    });
    expect(resolveSessionIdentity(req)?.development).toBe('bodasdehoy');
  });

  it('en local sí admite X-Development, para poder probar otras marcas', () => {
    const req = peticion('http://localhost:3210/api/storage/upload', {
      authorization: `Bearer ${tokenValido}`,
      host: 'localhost:3210',
      'X-Development': 'eventosorganizador',
    });
    expect(resolveSessionIdentity(req)?.development).toBe('eventosorganizador');
  });

  it('en local ignora una marca que no existe', () => {
    const req = peticion('http://localhost:3210/api/storage/upload', {
      authorization: `Bearer ${tokenValido}`,
      host: 'localhost:3210',
      'X-Development': 'marca-que-no-existe',
    });
    expect(resolveSessionIdentity(req)?.development).toBe('bodasdehoy');
  });

  it('admite el token por query — EventSource no puede mandar cabeceras', () => {
    const req = peticion(
      `https://chat.bodasdehoy.com/api/storage/upload?token=${tokenValido}`,
    );
    expect(resolveSessionIdentity(req)?.userId).toBe('uid-real');
  });

  it('rechaza un token válido en forma pero sin uid — no hay a quién atribuirlo', () => {
    const sinUid = fakeJwt({ exp: EN_UNA_HORA });
    const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
      authorization: `Bearer ${sinUid}`,
    });
    expect(resolveSessionIdentity(req)).toBeNull();
  });

  it('acepta los claims de Firebase (user_id / sub) además de uid', () => {
    for (const payload of [
      { exp: EN_UNA_HORA, user_id: 'fb-uid' },
      { exp: EN_UNA_HORA, sub: 'sub-uid' },
    ]) {
      const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
        authorization: `Bearer ${fakeJwt(payload)}`,
      });
      expect(resolveSessionIdentity(req)).not.toBeNull();
    }
  });

  it('normaliza la credencial a "Bearer <token>" para reenviarla', () => {
    const req = peticion('https://chat.bodasdehoy.com/api/storage/upload', {
      authorization: tokenValido, // sin prefijo
    });
    expect(resolveSessionIdentity(req)?.credential).toBe(`Bearer ${tokenValido}`);
  });
});
