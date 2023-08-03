import { LogoEventosOrganizador, LogoEventosPlanificador, LogoNuevoBodasBlanco } from "./components/icons";

const firebaseConfigBodas = {
  apiKey: "AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM",
  authDomain: "bodasdehoy-1063.firebaseapp.com",
  projectId: "bodasdehoy-1063",
  messagingSenderId: "593952495916",
  appId: "1:593952495916:web:c63cf15fd16a6796f6f489",
  measurementId: "G-GWQ17NF2YR",
};

const firebaseConfigEventos = {
  apiKey: "AIzaSyA_BIthVz_uwQR7gObnKPjI2KincIvP5lo",
  authDomain: "eventosplanificador-74e59.firebaseapp.com",
  projectId: "eventosplanificador-74e59",
  messagingSenderId: "1087923505585",
  appId: "1:1087923505585:web:7573effc0a8663d5429590",
  measurementId: "G-BJK5EBV8H0"
};

export const developments = [
  {
    name: "bodasdehoy",
    fileConfig: firebaseConfigBodas,
    cookie: "sessionBodas",
    domain: "https://bodasdehoy.com",
    cookieGuest: "guestbodas",
    pathLogin: "",
    pathDirectory: "https://bodasdehoy.com",
    logoDirectory: <LogoNuevoBodasBlanco className="hover:opacity-80 transition text-primary" />,
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
    fileConfig: firebaseConfigEventos,
    cookie: "sessionEventos",
    domain: "https://eventosplanificador.com",
    cookieGuest: "guesteventos",
    pathLogin: "",
    logoDirectory: <LogoEventosOrganizador className="hover:opacity-80 transition text-primary" />,
    headTitle: "Planificador de Eventos",
    theme: {
      primaryColor: "#6096B9"/* "#6771ae" */,
      secondaryColor: "#284C77" /* "#c589a9" */,
      tertiaryColor: "#F4C02F" /* "#b3dbb4" */,
      baseColor: "#F2F2F2",
      colorScroll: "#adb6ed"
    }
  },
  {
    name: "eventosorganizador",
    fileConfig: firebaseConfigEventos,
    cookie: "sessionEventos",
    domain: "https://eventosorganizador.com",
    cookieGuest: "guesteventos",
    pathLogin: "",
    logoDirectory: <LogoEventosOrganizador className="hover:opacity-80 transition text-primary" />,
    headTitle: "Organizador de Eventos",
    theme: {
      primaryColor: "#6096B9"/* "#6771ae" */,
      secondaryColor: "#284C77" /* "#c589a9" */,
      tertiaryColor: "#F4C02F" /* "#b3dbb4" */,
      baseColor: "#F2F2F2",
      colorScroll: "#adb6ed"
    }
  },
]

