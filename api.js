import axios from "axios";
import Cookies from "js-cookie"
import { SubscriptionClient } from "graphql-subscriptions-client";

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

const WebSocket = process.env.NEXT_PUBLIC_URL_API_SOCKET

//api app
const instance = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_URL })

export const api = {
  //ref1001
  /*AuthUsuario: async (usuario) => {
    return await wp.post("/jwt-auth/v1/token", usuario);
  },

  UsuariosDetails: async() => {
    return await wp.get("/wp/v2/users")
  },*/

  ApiApp: async (params, token) => {
    const token_final = token || Cookies.get("idToken")
    return await instance.post("/graphql", params, {
      headers: {
        Authorization: `Bearer ${token_final}`,
      }
    });
  },

  UploadFile: async (data, token) => {
    const token_final = token || Cookies.get("idToken")
    return await instance.post("/graphql", data, {
      headers: {
        Authorization: `Bearer ${token_final}`,
        "Content-Type": "multipart/form-data",
        Development: "bodasdehoy"
      }
    });
  },
  //ref1001
  /*MiUsuario: async(token) => {
      return await wp.get("/wp/v2/users/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    
    
  },

  Listings: async() => {
    return await wp.get("wp/v2/listing?page=1&per_page=1")
  },*/

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

  ApiBodasExpress: async ({ data, development, token }) => {
    const tokenFinal = Cookies.get("idToken")
    return axios.post('https://api.bodasdehoy.com/graphql', data, {
      headers: {
        Authorization: `Bearer ${tokenFinal}`,
        Development: development
      }
    })
  }
};



