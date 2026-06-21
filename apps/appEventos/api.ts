import axios from "axios";
import Cookies from "js-cookie"
import { Manager } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { parseJwt, safeJwtExpiry } from "./utils/Authentication";
import { varGlobalDomain, varGlobalDevelopment, varGlobalSubdomain } from "./context/AuthContext"
import { resolveApiBodasAuthGraphqlUrl, resolveApiEventosOrigin } from "./utils/apiEndpoints";

/** En localhost el navegador rechaza cookies con domain=.bodasdehoy.com */
const _isDevLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
function _cookieDomain() {
  if (_isDevLocal) return undefined;
  return process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO;
}

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

//api app
// En desarrollo (localhost, dominios -dev o -test), usar proxy para evitar CORS
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.includes('-test.') ||
   window.location.hostname.includes('-dev.'));
const baseURL = isLocalhost ? '/api/proxy' : resolveApiEventosOrigin();
const instance = axios.create({ baseURL });

// Ante 403/401: limpiar sesión y redirigir a login con mensaje (evita "Request failed with status code 403" en pantalla).
// NO redirigir si el SSO cross-domain está en curso (idTokenV0.1.0 presente pero sin sesión local):
// la mutation `auth` puede devolver 403 transitoriamente y borrar la cookie causaría un bucle.
function handleSessionExpired() {
  if (typeof window === 'undefined') return;
  const pathname = window.location?.pathname || '';
  if (pathname === '/login' || pathname.startsWith('/login?')) return;

  // Si hay idTokenV0.1.0 pero NO hay usuario Firebase local, el SSO cross-domain
  // está en curso (AuthContext aún no completó signInWithCustomToken).
  // No borrar la cookie ni redirigir — dejar que AuthContext complete el flujo SSO.
  const hasIdToken = Cookies.get('idTokenV0.1.0');
  let hasFirebaseUser = false;
  try { hasFirebaseUser = !!getAuth().currentUser; } catch (_) {}
  if (hasIdToken && !hasFirebaseUser) {
    console.warn('[handleSessionExpired] SSO en curso (idTokenV0.1.0 presente, sin Firebase user). No redirigir.');
    return;
  }

  try {
    Cookies.remove('idTokenV0.1.0', { domain: _cookieDomain() });
    Cookies.remove('idTokenV0.1.0');
  } catch (_) {}
  const returnPath = pathname + (window.location.search || '');
  const params = new URLSearchParams({ session_expired: '1' });
  if (returnPath && returnPath !== '/') params.set('d', returnPath);
  window.location.href = `/login?${params.toString()}`;
}

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 403 || status === 401) {
      handleSessionExpired();
    }
    return Promise.reject(err);
  }
);

export const api = {
  ApiApp: async (params: any, token?: any) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          // BUG-1: safeJwtExpiry devuelve undefined si el token es null/inválido/expirado;
          // Cookies.set sin `expires` queda como session cookie (no persiste tras cerrar
          // pestaña) — comportamiento seguro vs. crash por .exp en null.
          const dateExpire = safeJwtExpiry(idToken)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: _cookieDomain(), expires: dateExpire })
        }
      }
    } catch (error) {
      //
    }
    // Solo incluir Authorization si hay token válido
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Development: varGlobalDevelopment || "bodasdehoy",
    }
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`
    }
    return await instance.post("/graphql", params, { headers });
  },

  UploadFile: async (data: any, token?: any) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    if (getAuth().currentUser) {
      //idToken = Cookies.get("idTokenV0.1.0")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        // BUG-1: safeJwtExpiry undefined → session cookie sin TTL, seguro.
        const dateExpire = safeJwtExpiry(idToken)
        Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: _cookieDomain(), expires: dateExpire })
      }
    }
    return await instance.post("/graphql", data, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "multipart/form-data",
        Development: "bodasdehoy"
      }
    });
  },

  socketIO: ({ token, development, father, origin }: { token?: any; development?: any; father?: any; origin?: any }) => {
    if (!development) return
    const rawSocketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || "").trim()
    const socketUrl = (() => {
      // socket.io VIVE en api-ia.bodasdehoy.com (verificado 16-jun: /socket.io → 200).
      // BUG (informe 16-jun, BUG-02): este bloque DESCARTABA api-ia (`if api-ia → fallback`)
      // y caía al fallback = api-mcp, donde /socket.io da 404 → reconexión infinita, realtime
      // roto. Era un resto de cuando api-ia no tenía socket. Ahora SÍ lo tiene → usar
      // NEXT_PUBLIC_SOCKET_URL tal cual; solo caer al fallback si la env var falta o es inválida.
      if (!rawSocketUrl) return resolveApiEventosOrigin() || ""
      try {
        // valida que sea una URL bien formada
        // eslint-disable-next-line no-new
        new URL(rawSocketUrl)
        return rawSocketUrl
      } catch {
        return resolveApiEventosOrigin() || ""
      }
    })()
    const manager = new Manager(socketUrl, {
      closeOnBeforeunload: true,
    })
    const socket = manager.socket("/", {
      auth: {
        token: token ? `Bearer ${token}` : "anonymous",
        development,
        father,
        origin
      }
    })
    return socket
  },

  ApiBodas: async ({ data, development, token }: { data?: any; development?: any; token?: any }) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          // BUG-1: safeJwtExpiry devuelve undefined si el token es null/inválido/expirado;
          // Cookies.set sin `expires` queda como session cookie (no persiste tras cerrar
          // pestaña) — comportamiento seguro vs. crash por .exp en null.
          const dateExpire = safeJwtExpiry(idToken)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: _cookieDomain(), expires: dateExpire })
        }
      }
    } catch (error) {
      console.log("error no firebase")
    }

    const bodasApiUrl = isLocalhost ? '/api/proxy-bodas/graphql' : resolveApiBodasAuthGraphqlUrl();
    const headers: Record<string, any> = {
      Development: development,
      IsProduction: (process?.env?.NEXT_PUBLIC_PRODUCTION && !["testticket", "testinvitado"].includes(varGlobalSubdomain)) ?? false,
      "Content-Type": "application/json",
    };
    // T-501 (2026-05-24): el param `token` (p.ej. sessionBodas HS256) tiene prioridad
    // sobre idTokenV0.1.0 (Firebase RS256, 1h TTL). Necesario para validar sesión vía
    // getCurrentUser cuando NO hay user Firebase pero sí sessionBodas válido.
    // BUG-11 (informe QA 21-jun): si la cookie sessionBodas fue rechazada por el browser
    // (tamaño, ITP, third-party), Authentication.tsx guarda el JWT en localStorage como
    // fallback. Aquí lo usamos para que la sesión funcione aunque la cookie falte.
    let fallbackToken: string | undefined
    try {
      if (!token && typeof window !== 'undefined') {
        fallbackToken = localStorage.getItem('sessionBodas_fallback') ?? undefined
      }
    } catch { /* private mode */ }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (fallbackToken) {
      headers.Authorization = `Bearer ${fallbackToken}`;
    } else if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    try {
      return await axios.post(bodasApiUrl, data, { headers });
    } catch (err) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        handleSessionExpired();
      }
      // 400 en auth mutations: no relanzar como excepción ruidosa — devolver response con error
      if (err?.response?.status === 400) {
        console.warn('[api.ApiBodas] 400:', err?.response?.data?.errors?.[0]?.message || 'Bad Request');
        return err.response;
      }
      throw err;
    }
  }
};

export const fetchApiViewConfig = async (params: any) => {
  let idToken = Cookies.get("idTokenV0.1.0");
  try {
    if (getAuth().currentUser && !idToken) {
      idToken = await getAuth().currentUser?.getIdToken(true);
      // BUG-1: safeJwtExpiry undefined → session cookie sin TTL, seguro.
      const dateExpire = safeJwtExpiry(idToken);
      Cookies.set("idTokenV0.1.0", idToken ?? "", {
        domain: _cookieDomain(),
        expires: dateExpire
      });
    }
  } catch (error) {
    console.error("Error getting token:", error);
  }

  const graphqlUrl = isLocalhost ? '/api/proxy-bodas/graphql' : resolveApiBodasAuthGraphqlUrl();
  return axios.post(graphqlUrl, params, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    }
  });
};
