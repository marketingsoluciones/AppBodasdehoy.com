import axios from "axios";
import Cookies from "js-cookie"
import { createClient } from "graphql-ws";
import { Manager } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { parseJwt } from "./utils/Authentication";
import { varGlobalDomain, varGlobalDevelopment, varGlobalSubdomain } from "./context/AuthContext"

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

const WebSocket = process.env.NEXT_PUBLIC_URL_API_SOCKET

//api app
// En desarrollo (localhost o dominios de test), usar proxy para evitar CORS
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.includes('-test.'));
const baseURL = isLocalhost ? '/api/proxy' : process.env.NEXT_PUBLIC_BASE_URL;
const instance = axios.create({ baseURL })

export const api = {
  ApiApp: async (params, token) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })
        }
      }
    } catch (error) {
      //
    }
    // Solo incluir Authorization si hay token válido
    const headers = {
      "Content-Type": "application/json",
      Development: varGlobalDevelopment || "bodasdehoy",
    }
    if (idToken) {
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
        Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })
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

  socketIO: ({ token, development, father, origin }) => {
    if (!development) return
    const manager = new Manager(process.env.NEXT_PUBLIC_BASE_API_BODAS ?? "", {
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

  Suscripcion: async () => {
    const token = Cookies.get("idTokenV0.1.0")
    const GRAPHQL_ENDPOINT = WebSocket;
    const client = createClient({
      url: GRAPHQL_ENDPOINT ?? "",
      lazy: true,
      retryAttempts: 5,
      connectionParams: () => ({
        headers: { Authorization: `Bearer ${token}` },
      }),
      on: {
        error: (error) => {
          console.error("GraphQL WS Error:", error);
        },
      },
    });
    return client
  },

  ApiBodas: async ({ data, development, token }) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    try {
      if (getAuth().currentUser) {
        //idToken = Cookies.get("idTokenV0.1.0")
        if (!idToken) {
          idToken = await getAuth().currentUser?.getIdToken(true)
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })
        }
      }
    } catch (error) {
      console.log("error no firebase")
    }

    // En desarrollo/test, usar proxy para evitar CORS
    const bodasApiUrl = isLocalhost ? '/api/proxy-bodas/graphql' : 'https://api.bodasdehoy.com/graphql';

    return axios.post(bodasApiUrl, data, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        Development: development,
        IsProduction: (process?.env?.NEXT_PUBLIC_PRODUCTION && !["testticket", "testinvitado"].includes(varGlobalSubdomain)) ?? false
      }
    })
  }
};

// Legacy: no se usa en el código actual. Endpoint unificado con el resto (HTTPS).
// Si se elimina, verificar que ningún flujo la use. Ver docs/LISTADO-LLAMADAS-API2-AUDITORIA.md
const API2_GRAPHQL_LEGACY = process.env.NEXT_PUBLIC_API2_GRAPHQL_URL || '';

export const fetchApiViewConfig = async (params) => {
  let idToken = Cookies.get("idTokenV0.1.0");
  try {
    if (getAuth().currentUser && !idToken) {
      idToken = await getAuth().currentUser?.getIdToken(true);
      const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000);
      Cookies.set("idTokenV0.1.0", idToken ?? "", {
        domain: process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO,
        expires: dateExpire
      });
    }
  } catch (error) {
    console.error("Error getting token:", error);
  }

  return axios.post(API2_GRAPHQL_LEGACY, params, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    }
  });
};



