import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({

    resources: {
      en: {
        translation: {
          hello: "Hello world!",
          saludo: "hello"

        }
      },
      es: {
        translation: {
          hello: "¡Hola mundo!",
          saludo: "hola",
          myevents: "Mis eventos",
          resumen: "Resumen",
          guest: "Invitados",
          table: "Mesas",
          gifs: "Lista de regalos",
          budget: "Presupuesto",
          invitations: "Invitaciones",
          send: "enviadas",
          forsend: "por enviar",
          confirmed:"confirmadas",
          seemy:"Ver mis ",
          byconfirm:"por confirmar",
          cancelled:"cancelados",
          myguests:"Mis invitados",
          addguests:"Añadir Invitados",
          Itinerary:"Itinerarios",
          activatelist:"Activar lista",
          raised:"Recaudados",
          participants:"Participantes",
          eventvenue:"Lugar del evento",
          mytables:"Mis Mesas",
          totaltables:"total de mesas",
          seatedguests:"invitados sentados",
          viewtables:"Ver mesas",
          dear:"estimado",
          wornout:"gastado",
          addexpenses:"Añadir gastos",
          state:"Estado",
          letscelebratestarted:"¡A celebrar! ¿Empezamos?",
          stepstocompleteyourevent:"pasos para completar tu evento",
          guestsseatedatyourevent:"invitados sentados en tu evento",
          edit:"Editar",
          event:"Evento",
          cancel:"Cancelar",

        }
      }
    },
    lng: 'es', // Idioma por defecto
    fallbackLng: 'en', // Idioma al que caer si no se encuentra el idioma del usuario
    interpolation: {
      escapeValue: false // Permite usar HTML en las traducciones
    }
  });

export default i18n;