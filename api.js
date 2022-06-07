import axios from "axios";
import Cookies from "js-cookie"
import { SubscriptionClient } from "graphql-subscriptions-client";

/* // llamada a wordpresss ref1001
const wp = axios.create({
  baseURL: "https://bodasdehoy.com/wp-json",
});*/

const WebSocket = process.env.NEXT_PUBLIC_URL_API_SOCKET

const instance = axios.create({ baseURL: "https://app.bodasdehoy.com" })

export const api = {
  //ref1001
  /*AuthUsuario: async (usuario) => {
    return await wp.post("/jwt-auth/v1/token", usuario);
  },

  UsuariosDetails: async() => {
    return await wp.get("/wp/v2/users")
  },*/

  ApiBodas: async (params, token) => {
    const token_final = token || Cookies.get("idToken")
    return await instance.post("/graphql", params, {
      headers: {
        'Authorization': `Bearer ${token_final}`
      }
    });
  },

  UploadFile: async (data, token) => {
    const token_final = token || Cookies.get("idToken")
    return await instance.post("/api/graphql", data, {
      headers: {
        'Authorization': `Bearer ${token_final}`,
        "Content-Type": "multipart/form-data"
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

  ApiBodasExpress: async (data, token) => {
    return axios.post('https://api.bodasdehoy.com/graphql', data)
  }
};



