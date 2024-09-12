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
          writeyourtheme:"Escribe tu tematica",
          eventtheme:"Tématica del evento",
          colour:"color",
          yellow:"Amarillo",
          celestial:"Celeste",
          pink:"Rosado",
          red:"Rojo",
          purple:"Morado",
          beige:"Beige",
          gold:"Dorado",
          silver:"Plata",
          season:"temporada",
          Winter:"Invierno",
          Spring:"Primavera",
          Summer:"Verano",
          Autumn:"Otoño",
          style:"estilo",
          openair:"Aire libre",
          livingroom:"Salón",
          swimmingpool:"Piscina",
          athome:"En casa",
          theme:"tematica",
          cake:"tarta",
          aboutmyevent:"Sobre mi evento",
          payments:"El costo final del producto debe ser mayor a 0 para agregar pagos",
          estimatedcost:"Coste estimado:",
          actualcost:"Coste real:",
          balanceagainst:"Saldo en contra de",
          total:"Total",
          addservice:"Añadir servicio",
          state:"Estado",
          supplier:"Proveedor",
          paymentdate:"Fecha de pago",
          amount:"Importe",
          paymentmethod:"Modo de pago",
          concept:"Concepto",
          futurepaymentdate:"Fecha de futuro pago",
          paymenttoview:"no tienes pago para visualizar ",
          paymentdetails:"Detalles de pagos",
          payment:"#PAGO",
          amount:"IMPORTE",
          details:"DETALLES",
          addnewpayment:"Añadir nuevo pago",
          success:"Nombre actualizado con exito",
          warning:"Error al actualizar el nombre",
          passwordsuccess:"Contraseña actualizada con éxito",
          warningpassword:"Contraseña actual inválida",
          warningpasswordagain:"Error al cambiar la contraseña, intente nuevamente",
          accessdata:"Datos de acceso",
          email:"Correo electronico",
          displayname:"Nombre visible",
          currentpassword:"Contraseña Actual",
          newpassword:"Nuevo Contraseña",
          save:"Guardar",
          edit:"Editar",
          update:"Actualizar",
          imagesuccessfully:"la imagen fue actualizado con exito",
          errorloadingimage:"error al cargar la imagen",


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