export const dataMetaData = [
  {
    ruta: "/resumen-evento",
    metaData: (dataConfig) => {
      return {
        title: `Todos los detalles de tus eventos en un solo lugar | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra toda la información sobre tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/resumen-evento`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/resumen-evento`,
          siteName: `${dataConfig?.name}`,
          title: `Resumen del evento | ${dataConfig?.name}`,
          description: 'Descubre todos los detalles de este evento especial.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/invitados",
    metaData: (dataConfig) => {
      return {
        title: `Lista de invitados | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra toda la información sobre tus invitados en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/invitados`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/invitados`,
          siteName: `${dataConfig?.name}`,
          title: `Lista de invitados | ${dataConfig?.name}`,
          description: 'Encuentra toda la información sobre tus invitados en nuestro organizador de eventos...',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/mesas",
    metaData: (dataConfig) => {
      return {
        title: `Mesas | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Organiza las mesas de tu evento con nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/mesas`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/mesas`,
          siteName: `${dataConfig?.name}`,
          title: `Mesas | ${dataConfig?.name}`,
          description: 'Organiza las mesas de tu evento con nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/lista-regalos",
    metaData: (dataConfig) => {
      return {
        title: `Lista de regalos | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Crea tu lista de regalos en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/lista-regalos`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/lista-regalos`,
          siteName: `${dataConfig?.name}`,
          title: `Lista de regalos | ${dataConfig?.name}`,
          description: 'Crea tu lista de regalos en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/presupuesto",
    metaData: (dataConfig) => {
      return {
        title: `Presupuesto | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Organiza tu presupuesto en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/presupuesto`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/presupuesto`,
          siteName: `${dataConfig?.name}`,
          title: `Presupuesto | ${dataConfig?.name}`,
          description: 'Organiza tu presupuesto en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/invitaciones",
    metaData: (dataConfig) => {
      return {

      }
    }
  },
  {
    ruta: "/itinerario",
    metaData: (dataConfig) => {
      return {
        title: `Invitaciones | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Crea tus invitaciones en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/invitaciones`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/invitaciones`,
          siteName: `${dataConfig?.name}`,
          title: `Invitaciones | ${dataConfig?.name}`,
          description: 'Crea tus invitaciones en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/servicios",
    metaData: (dataConfig) => {
      return {
        title: `Servicios | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra los servicios para tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/servicios`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/servicios`,
          siteName: `${dataConfig?.name}`,
          title: `Servicios | ${dataConfig?.name}`,
          description: 'Encuentra los servicios para tu evento en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
  {
    ruta: "/",
    metaData: (dataConfig) => {
      return {
        title: `Tu organizador de eventos favoritos, todo en uno| ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra los servicios para tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/servicios`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/servicios`,
          siteName: `${dataConfig?.name}`,
          title: `Servicios | ${dataConfig?.name}`,
          description: 'Encuentra los servicios para tu evento en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    }
  },
]