import axios from "axios";
import Cookies from "js-cookie"
import { Manager } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { parseJwt } from "./utils/Authentication";
import { resolveApiBodasGraphqlUrl } from "./utils/apiEndpoints";
import { varGlobalDomain, varGlobalDevelopment, varGlobalSubdomain } from "./context/AuthContext"

/** En localhost el navegador rechaza cookies con domain=.bodasdehoy.com */
const _isDevLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
function _cookieDomain() {
  if (_isDevLocal) return undefined;
  return process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO;
}

function isJwtLike(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split('.');
  return parts.length >= 3 && parts.every(Boolean);
}

const _socketManagersByUrl = new Map()

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
const baseURL = isLocalhost ? '/api/proxy' : process.env.NEXT_PUBLIC_BASE_URL;
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
  if (hasIdToken && isJwtLike(hasIdToken) && !hasFirebaseUser) {
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
  ApiApp: async (params, token) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", {
            domain: _cookieDomain(),
            expires: dateExpire,
            path: "/",
            secure: typeof window !== "undefined" && window.location.protocol === "https:",
            sameSite: "lax",
          })
        }
      }
    } catch (error) {
      //
    }
    // Solo incluir Authorization si hay token válido
    const headers = {
      "Content-Type": "application/json",
      Development: varGlobalDevelopment || "bodasdehoy",
    };
    if (idToken && isJwtLike(idToken)) {
      headers.Authorization = `Bearer ${idToken}`
    }
    return await instance.post("/graphql", params, { headers });
  },

  UploadFile: async (data, token) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    if (getAuth().currentUser) {
      //idToken = Cookies.get("idTokenV0.1.0")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idTokenV0.1.0", idToken ?? "", {
          domain: _cookieDomain(),
          expires: dateExpire,
          path: "/",
          secure: typeof window !== "undefined" && window.location.protocol === "https:",
          sameSite: "lax",
        })
      }
    }
    return await instance.post("/graphql", data, {
      headers: {
        ...(idToken && isJwtLike(idToken) ? { Authorization: `Bearer ${idToken}` } : {}),
        "Content-Type": "multipart/form-data",
        Development: "bodasdehoy"
      }
    });
  },

  socketIO: ({ token, development, father, origin }) => {
    if (!development) return
    const socketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || "").trim()
      || process.env.NEXT_PUBLIC_BASE_API_BODAS
      || ""
    if (!socketUrl) return
    const manager = _socketManagersByUrl.get(socketUrl) || (() => {
      const m = new Manager(socketUrl, {
        closeOnBeforeunload: true,
        transports: ["websocket"],
      })
      _socketManagersByUrl.set(socketUrl, m)
      return m
    })()
    const socket = manager.socket("/", {
      transports: ["websocket"],
      auth: {
        token: token ? `Bearer ${token}` : "anonymous",
        development,
        father,
        origin
      }
    })
    return socket
  },

  ApiBodas: async ({ data, development, token, type }) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", {
            domain: _cookieDomain(),
            expires: dateExpire,
            path: "/",
            secure: typeof window !== "undefined" && window.location.protocol === "https:",
            sameSite: "lax",
          })
        }
      }
    } catch (error) {
      console.log("error no firebase")
    }

    const bodasApiUrl = isLocalhost
      ? '/api/proxy-bodas/graphql'
      : resolveApiBodasGraphqlUrl();
    const bodasApiFallbackUrl = !isLocalhost
      ? process.env.NEXT_PUBLIC_API_BODAS_URL_FALLBACK
      : undefined;
    const headers = {
      Development: development || varGlobalDevelopment || "bodasdehoy",
      IsProduction: (process?.env?.NEXT_PUBLIC_PRODUCTION && !["testticket", "testinvitado"].includes(varGlobalSubdomain)) ?? false,
    };
    if (type !== "formData") {
      headers["Content-Type"] = "application/json";
    }
    if (idToken && isJwtLike(idToken)) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    try {
      return await axios.post(bodasApiUrl, data, { headers });
    } catch (err) {
      const isNetworkError = !err?.response;
      if (isNetworkError && bodasApiFallbackUrl && bodasApiFallbackUrl !== bodasApiUrl) {
        console.warn('[api.ApiBodas] Host primario falló, reintentando fallback');
        return await axios.post(bodasApiFallbackUrl, data, { headers });
      }
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

// Legacy: no se usa en el código actual. Endpoint unificado con el resto (HTTPS).
// Si se elimina, verificar que ningún flujo la use. Ver docs/LISTADO-LLAMADAS-API2-AUDITORIA.md
const MCP_GRAPHQL_LEGACY =
  process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_API2_GRAPHQL_URL ||
  '';

export const fetchApiViewConfig = async (params) => {
  let idToken = Cookies.get("idTokenV0.1.0");
  try {
    if (getAuth().currentUser && !idToken) {
      idToken = await getAuth().currentUser?.getIdToken(true);
      const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000);
      Cookies.set("idTokenV0.1.0", idToken ?? "", {
        domain: _cookieDomain(),
        expires: dateExpire,
        path: "/",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
        sameSite: "lax",
      });
    }
  } catch (error) {
    console.error("Error getting token:", error);
  }

  return axios.post(MCP_GRAPHQL_LEGACY, params, {
    headers: {
      ...(idToken && isJwtLike(idToken) ? { Authorization: `Bearer ${idToken}` } : {}),
      'Content-Type': 'application/json',
    }
  });
};
