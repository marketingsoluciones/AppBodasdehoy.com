import axios from "axios";
import Cookies from "js-cookie"
import { SubscriptionClient } from "graphql-subscriptions-client";
import { Manager, io } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { parseJwt } from "./utils/Authentication";

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

const WebSocket = process.env.NEXT_PUBLIC_URL_API_SOCKET

//api app
const instance = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_URL })

export const api = {
  ApiApp: async (params, token) => {
    let idToken = Cookies.get("idToken")
    if (getAuth().currentUser) {
      //idToken = Cookies.get("idToken")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idToken", idToken ?? "", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "", expires: dateExpire })
      }
    }
    return await instance.post("/graphql", params, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      }
    });
  },

  UploadFile: async (data, token) => {
    let idToken = Cookies.get("idToken")
    if (getAuth().currentUser) {
      //idToken = Cookies.get("idToken")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idToken", idToken ?? "", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "", expires: dateExpire })
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
    const socket = io(process.env.NEXT_PUBLIC_BASE_API_BODAS ?? "", {
      auth: {
        token: `Bearer ${token}`,
        development,
        father,
        origin
      }
    })
    return socket
  },

  Suscripcion: async () => {
    const token = Cookies.get("idToken")
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
    let idToken = Cookies.get("idToken")
    if (getAuth().currentUser) {
      //idToken = Cookies.get("idToken")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idToken", idToken ?? "", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "", expires: dateExpire })
      }
    }
    return axios.post('https://api.bodasdehoy.com/graphql', data, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        Development: development
      }
    })
  }
};



