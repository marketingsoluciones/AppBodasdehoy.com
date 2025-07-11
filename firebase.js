import { GoogleAuthProvider, FacebookAuthProvider, getAuth, OAuthProvider } from "firebase/auth";
import { LogoEventosOrganizador, LogoEventosPlanificador, LogoNuevoBodasBlanco, LogoVivetuboda } from "./components/icons";


const firebaseConfigBodas = {
  apiKey: "AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM",
  authDomain: "bodasdehoy-1063.firebaseapp.com",
  projectId: "bodasdehoy-1063",
  storageBucket: "bodasdehoy-1063.appspot.com",
  messagingSenderId: "593952495916",
  appId: "1:593952495916:web:c63cf15fd16a6796f6f489",
  measurementId: "G-GWQ17NF2YR",
};
const firebaseConfigPlanificador = {
  apiKey: "AIzaSyA_BIthVz_uwQR7gObnKPjI2KincIvP5lo",
  authDomain: "eventosplanificador-74e59.firebaseapp.com",
  projectId: "eventosplanificador-74e59",
  storageBucket: "eventosplanificador-74e59.appspot.com",
  messagingSenderId: "1087923505585",
  appId: "1:1087923505585:web:7573effc0a8663d5429590",
  measurementId: "G-BJK5EBV8H0"
};
const firebaseConfigOrganizador = {
  apiKey: "AIzaSyD3O0Nb4du1DPZod-6ZGpzw4jLGjXXKKUI",
  authDomain: "eventosorganizador-2ed10.firebaseapp.com",
  projectId: "eventosorganizador-2ed10",
  messagingSenderId: "492151341830",
  appId: "1:492151341830:web:35178ccf72d2dbcf6d1487",
  measurementId: "G-FC99T7WZS8"
};
const firebaseConfigVivetuboda = {
  apiKey: "AIzaSyCkj2D1mO-jdMUDwAQVL7tXCGuNusT5ubc",
  authDomain: "vivetuboda-l.firebaseapp.com",
  projectId: "vivetuboda-l",
  storageBucket: "vivetuboda-l.appspot.com",
  messagingSenderId: "209046290590",
  appId: "1:209046290590:web:db0fbe47c3963ddd143b8f",
  measurementId: "G-PTQM1HELZC"
};
const firebaseConfigChampagneEvents = {
  apiKey: "AIzaSyAhDpYfpElzfl-RNP9Tyz7GTaF5N_hHKlA",
  authDomain: "champagne-events-mx.firebaseapp.com",
  projectId: "champagne-events-mx",
  storageBucket: "champagne-events-mx.appspot.com",
  messagingSenderId: "70019683977",
  appId: "1:70019683977:web:10648516be16afd5879858",
  measurementId: "G-8X6QVM9165"
};
const firebaseConfigAnnloevents = {
  apiKey: "AIzaSyC9mUmQ_wiIu-itBfgSlVNLdzRcZbjI3MM",
  authDomain: "annloevents-app.firebaseapp.com",
  projectId: "annloevents-app",
  storageBucket: "annloevents-app.firebasestorage.app",
  messagingSenderId: "204540888172",
  appId: "1:204540888172:web:2f174c646cb822116f0449",
  measurementId: "G-4W4VHN7TVN"
};
const firebaseConfigMiamorcitocorazon = {
  apiKey: "AIzaSyABo01h3OYGUa-edeknZ2-F1b3ltGudbYo",
  authDomain: "miamorcitocorazon-planificador.firebaseapp.com",
  projectId: "miamorcitocorazon-planificador",
  storageBucket: "miamorcitocorazon-planificador.firebasestorage.app",
  messagingSenderId: "621496856930",
  appId: "1:621496856930:web:87aa45e6977b3ea2813c3b",
  measurementId: "G-ZRY28E6YPG"
};

const firebaseConfigEventosintegrados = {
  apiKey: "AIzaSyD2oie-ze53bnkwGs84O07dg-vooDnLY-g",
  authDomain: "eventosintegrados-app.firebaseapp.com",
  projectId: "eventosintegrados-app",
  storageBucket: "eventosintegrados-app.firebasestorage.app",
  messagingSenderId: "251095054818",
  appId: "1:251095054818:web:ad74627e3112f20504a1bb",
  measurementId: "G-4WVS9SGEY5"
};

const firebaseConfigOhmaratilano = {
  apiKey: "AIzaSyDgog0QuV2ZAduEGYroBUoDp_COwgh-ePc",
  authDomain: "ohmaratilano-app.firebaseapp.com",
  projectId: "ohmaratilano-app",
  storageBucket: "ohmaratilano-app.firebasestorage.app",
  messagingSenderId: "834371259019",
  appId: "1:834371259019:web:dd8d6a7bf21a4e4e56228e",
  measurementId: "G-4XH8FBGR1R"
};

const firebaseConfigCorporativozr = {
  apiKey: "AIzaSyCyNPFSVkh7u7JkiYYI2oHzSSnIKok5JpE",
  authDomain: "corporativozr-app.firebaseapp.com",
  projectId: "corporativozr-app",
  storageBucket: "corporativozr-app.firebasestorage.app",
  messagingSenderId: "798723721379",
  appId: "1:798723721379:web:3c13e3999ab357f1fad716",
  measurementId: "G-M58YVQJ0LS"
};

const firebaseConfigTheweddingplanner = {
  apiKey: "AIzaSyDaJcojMTSdMkjxCLY3rEtL0Htf51sFUik",
  authDomain: "theweddingplanner-app.firebaseapp.com",
  projectId: "theweddingplanner-app",
  storageBucket: "theweddingplanner-app.firebasestorage.app",
  messagingSenderId: "557540930291",
  appId: "1:557540930291:web:518494e9c89789ffbcfd86",
  measurementId: "G-FW08N94PTL"
};

export const developments = [
  {
    name: "bodasdehoy",
    development: "bodasdehoy",
    fileConfig: firebaseConfigBodas,
    cookie: "sessionBodas",
    domain: ".bodasdehoy.com",
    cookieGuest: "guestbodas",
    pathDomain: "https://bodasdehoy.com",
    pathLogin: "https://bodasdehoy.com/login",
    pathSignout: "https://bodasdehoy.com/signout",
    pathPerfil: "https://bodasdehoy.com/configuracion",
    pathDirectory: "https://bodasdehoy.com",
    logoDirectory: <LogoNuevoBodasBlanco className="hover:opacity-80 transition text-primary w-full h-full object-contain" />,
    navbarDirectory: [{
      title: "Novia",
      path: "categoria/novias"
    },
    {
      title: "Novio",
      path: "categoria/novios"
    },
    {
      title: "Proveedores",
      path: "categoria/proveedores"
    },
    {
      title: "Lugares para bodas",
      path: "categoria/lugares-para-bodas"
    }],
    headTitle: "Bodas de hoy - Organizador de Bodas",
    theme: {
      primaryColor: "#F7628C",
      secondaryColor: "#87F3B5",
      tertiaryColor: "#FBFF4E",
      baseColor: "#F2F2F2",
      colorScroll: "#ffc0cb"
    }
  },
  {
    name: "eventosplanificador",
    development: "eventosplanificador",
    fileConfig: firebaseConfigPlanificador,
    cookie: "sessionPlanificador",
    domain: ".eventosplanificador.com",
    cookieGuest: "guestplanicador",
    pathDomain: "https://eventosplanificador.com",
    pathLogin: "",
    logoDirectory: <LogoEventosOrganizador className="hover:opacity-80 transition text-primary w-full h-full object-contain" />,
    headTitle: "Planificador de Eventos",
    theme: {
      primaryColor: "#6771ae",
      secondaryColor: "#c589a9",
      tertiaryColor: "#b3dbb4",
      baseColor: "#F2F2F2",
      colorScroll: "#adb6ed"
    }
  },
  {
    name: "eventosorganizador",
    development: "eventosorganizador",
    fileConfig: firebaseConfigOrganizador,
    cookie: "sessionOrganizador",
    domain: ".eventosorganizador.com",
    cookieGuest: "guestorganizador",
    pathDomain: "https://eventosorganizador.com",
    pathLogin: "",
    logoDirectory: <LogoEventosOrganizador className="hover:opacity-80 transition text-primary w-full h-full object-contain" />,
    headTitle: "Organizador de Eventos",
    theme: {
      primaryColor: "#6096B9"/* "#6771ae" */,
      secondaryColor: "#284C77" /* "#c589a9" */,
      tertiaryColor: "#F4C02F" /* "#b3dbb4" */,
      baseColor: "#F2F2F2",
      colorScroll: "#adb6ed"
    },
  },
  {
    name: "vivetuboda",
    development: "vivetuboda",
    fileConfig: firebaseConfigVivetuboda,
    cookie: "sessionVivetuboda",
    domain: ".vivetuboda.com",
    cookieGuest: "guestvivetuboda",
    pathDomain: "https://vivetuboda.com",
    pathLogin: "",
    pathDirectory: "http://vivetuboda.com",
    logoDirectory: <img className="hover:opacity-80 transition text-primary w-full h-full object-contain" src="/LogoVivetuboda.png" />,
    headTitle: "Organizador de Eventos",
    theme: {
      primaryColor: "#F4A4A4"/* "#6771ae" */,
      secondaryColor: "#284C77" /* "#c589a9" */,
      tertiaryColor: "#F4C02F" /* "#b3dbb4" */,
      baseColor: "#F2F2F2",
      colorScroll: "#adb6ed"
    },
    metaPixel_id: "1104927187970356",
  },
  {
    name: "champagne-events",
    development: "champagne-events",
    fileConfig: firebaseConfigChampagneEvents,
    cookie: "sessionChampagne-events",
    domain: ".champagne-events.com.mx",
    cookieGuest: "guestchampagne-events",
    pathDomain: "https://www.champagne-events.com.mx/",
    pathLogin: "",
    pathDirectory: "champagne-events.com.mx",
    logoDirectory: <img className="hover:opacity-80 transition text-primary w-full h-full object-contain" src="https://i.ibb.co/Nsr8LgX/cropped-Logo-Gray-Champagne-1.png" />,
    headTitle: "App Champagne Event Planner",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://champagne-events.com.mx/en/destination-weddings&size=16",
    theme: {
      primaryColor: "#ecb290",
      secondaryColor: "#d07a49",
      tertiaryColor: "#dadbdb",
      baseColor: "#fafae4",
      colorScroll: "#f4d7c5"
    },
  },
  {
    name: "annloevents",
    development: "annloevents",
    fileConfig: firebaseConfigAnnloevents,
    cookie: "sessionAnnloevents",
    domain: ".annloevents.com",
    cookieGuest: "guestannloevents",
    pathDomain: "https://annloevents.com/",
    pathLogin: "",
    pathDirectory: "annloevents.com",
    logoDirectory: <img className="hover:opacity-80 transition text-primary w-full h-full object-contain" src="https://i.ibb.co/R6by86b/logotipo-annlo-events.png" />,
    headTitle: "Planificador Ann Lo Events",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://annloevents.com&size=16",
    theme: {
      primaryColor: "#DB8686",
      secondaryColor: "#d07a49",
      tertiaryColor: "#c8c4c2",
      baseColor: "#fdf3ef",
      colorScroll: "#f4cdc5"
    },
  },
  {
    name: "miamorcitocorazon",
    development: "miamorcitocorazon",
    fileConfig: firebaseConfigMiamorcitocorazon,
    cookie: "sessionMiamorcitocorazon",
    domain: ".miamorcitocorazon.mx",
    cookieGuest: "guestmiamorcitocorazon",
    pathDomain: "https://miamorcitocorazon.mx/",
    pathLogin: "",
    pathDirectory: "miamorcitocorazon.mx",
    logoDirectory: <img className="hover:opacity-80 transition text-primary w-full h-full object-contain" src="https://i.ibb.co/L8bTqBf/Amorcito-Corazon2.png" />,
    headTitle: "Planificador de Eventos",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://miamorcitocorazon.mx&size=16",
    theme: {
      primaryColor: "#DB8686",
      secondaryColor: "#d07a49",
      tertiaryColor: "#c8c4c2",
      baseColor: "#fdf3ef",
      colorScroll: "#f4cdc5"
    },
  },
  {
    name: "eventosintegrados",
    development: "eventosintegrados",
    fileConfig: firebaseConfigEventosintegrados,
    cookie: "sessionEventosintegrados",
    domain: ".eventosintegrados.com",
    cookieGuest: "guesteventosintegrados",
    pathDomain: "https://eventosintegrados.com/",
    pathLogin: "",
    pathDirectory: "eventosintegrados.com",
    logoDirectory: <img className="hover:opacity-80 transition text-primary w-full h-full object-contain" src="https://i.ibb.co/p3qm62p/image-2-1.png" />,
    headTitle: "App - Eventos Empresariales, bodas a nivel nacional, wennding planner",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://eventosintegrados.com&size=16",
    theme: {
      primaryColor: "#CC2149",
      secondaryColor: "#E39D2F",
      tertiaryColor: "#c8c4c2",
      baseColor: "#fff6fa",
      colorScroll: "#f4c5ce"
    },
  },
  {
    name: "ohmaratilano",
    development: "ohmaratilano",
    fileConfig: firebaseConfigOhmaratilano,
    cookie: "sessionOhmaratilano",
    domain: ".ohmaratilano.com",
    cookieGuest: "guestohmaratilano",
    pathDomain: "https://ohmaratilano.com/",
    pathLogin: "",
    pathDirectory: "ohmaratilano.com",
    logoDirectory: <img className="hover:opacity-80 transition text-primary h-full object-contain bg-primary p-1" src="https://apiapp.bodasdehoy.com/logos/Logo-OHMARATILANO-blanco.png" />,
    headTitle: "App profesional que te ayudará a planear la boda de tus sueños con éxito",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.ohmaratilano.com&size=16",
    theme: {
      primaryColor: "#c1bba3",// c1bba3 8f867a
      secondaryColor: "#deab38",
      tertiaryColor: "#e0d6b2",
      baseColor: "#fff6fa",//fff6fa
      colorScroll: "#e0d6b2"
    },
  },
  {
    name: "corporativozr",
    development: "corporativozr",
    fileConfig: firebaseConfigCorporativozr,
    cookie: "sessionCorporativozr",
    domain: ".corporativozr.com",
    cookieGuest: "guestcorporativozr",
    pathDomain: "https://corporativozr.com/2024/",
    pathLogin: "",
    pathDirectory: "corporativozr.com",
    logoDirectory: <img className="hover:opacity-80 transition text-primary h-full object-contain bg-primary p-1" src="https://apiapp.bodasdehoy.com/logos/Logo-CORPORATIVOZR-gris.png" />,
    headTitle: "App profesional que te ayudará a planear la boda de tus sueños con éxito",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://corporativozr.com/2024/&size=16",
    theme: {
      primaryColor: "#c1bba3",// c1bba3 8f867a
      secondaryColor: "#deab38",
      tertiaryColor: "#e0d6b2",
      baseColor: "#fff6fa",//fff6fa
      colorScroll: "#e0d6b2"
    },
  },
  {
    name: "theweddingplanner",
    development: "theweddingplanner",
    fileConfig: firebaseConfigTheweddingplanner,
    cookie: "sessionTheweddingplanner",
    domain: ".theweddingplanner.mx",
    cookieGuest: "guesttheweddingplanner",
    pathDomain: "https://theweddingplanner.com/",
    pathLogin: "",
    pathDirectory: "theweddingplanner.mx",
    logoDirectory: <img className="hover:opacity-80 transition text-primary h-full object-contain p-1" src="https://www.theweddingplanner.mx/assets/imgs/theweddingplanner.mx-logo.png" />,
    headTitle: "Desde una elegante boda hasta una íntima ceremonia!",
    favicon: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.theweddingplanner.mx/&size=16",
    theme: {
      primaryColor: "#eba696",// c1bba3 8f867a
      secondaryColor: "#ee976c",
      tertiaryColor: "#eec6ba",
      baseColor: "#f4f4f4",//fff6fa
      colorScroll: "#eba696"
    },
  },
]

const GoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  return provider;
};

const FacebookProvider = new FacebookAuthProvider();

const AppleProvidor = () => {
  try {
    const provider = new OAuthProvider('apple.com');
    return provider
  } catch (error) {
    console.log("error 1504", "AppleProvidor en firebase.ts", error)
  }
}

export { GoogleProvider, FacebookProvider, AppleProvidor };