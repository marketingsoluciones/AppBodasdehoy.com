import axios from "axios";
import Cookies from "js-cookie"
import { SubscriptionClient } from "graphql-subscriptions-client";
import { Manager, io } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { parseJwt } from "./utils/Authentication";
import { varGlobalDomain, varGlobalDevelopment, varGlobalSubdomain } from "./context/AuthContext"

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

const WebSocket = process.env.NEXT_PUBLIC_URL_API_SOCKET

//api app
const instance = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_URL })

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
    return await instance.post("/graphql", params, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        Development: varGlobalDevelopment || "bodasdehoy",
      }
    });
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
    console.log(
      {
        reconnectionAttempts: manager.reconnectionAttempts(),
        reconnectionDelay: manager.reconnectionDelay(),
        reconnectionDelayMax: manager.reconnectionDelayMax(),
        timeout: manager.timeout(),
      }
    )
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
    const client = new SubscriptionClient(GRAPHQL_ENDPOINT, {
      reconnect: true,
      lazy: true, // only connect when there is a query
      connectionParams: {
        headers: { Authorization: `Bearer ${token}` },
      },
      connectionCallback: (error) => {
        error && console.error(error);
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
    return axios.post('https://api.bodasdehoy.com/graphql', data, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        Development: development,
        IsProduction: (process?.env?.NEXT_PUBLIC_PRODUCTION && !["testticket", "testinvitado"].includes(varGlobalSubdomain)) ?? false
      }
    })
  }
};

export const fetchApiViewConfig = async (params) => {
  const endpoint = 'http://api2.eventosorganizador.com:3000/graphql';

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

  return axios.post(endpoint, params, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    }
  });
};



