


export const setCookie = (values) => {
    if (document) {
      const { nombre, valor, dias } = values;
      let expires = "";
      if (dias) {
        let date = new Date();
        date.setTime(date.getTime() + dias * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
      }
  
      document.cookie = nombre + "=" + (valor || "") + expires + "; path=/";
    }
  };
  
  export const getCookie = (name) => {
    if (document) {
      const cookies = document?.cookie;
      const valor = cookies
        ?.split(";")
        ?.filter((cookie) => cookie.includes(`${name}=`))[0]
        ?.split("=")[1];
      return valor;
    }
  
    return null;
  };
  

export const deleteCookie = (name) => {
    if(document){
       document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
   };
   