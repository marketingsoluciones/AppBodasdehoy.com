import {
  LoadingProvider,
  AuthProvider,
  EventsGroupProvider,
  EventProvider,
  ChatProvider,
  SocketProvider,
  AuthContextProvider,
  SocketContextProvider
} from "../context";
import { SocketControlator } from "../components/DefaultLayout/SocketControlator";
import Container from "../components/DefaultLayout/Container";
import { ToastProvider } from "../context/ToastContext";
import GoogleAnalytics from '../components/GoogleAnalitytcs';
import { NextSeo } from "next-seo";


const DefaultLayout = ({ children }) => {

  return (
    <div className="w-[100vw] h-[100vh]">
      <NextSeo
        title={` App organizador | Bodas de Hoyy `}
        description="Encuentra toda la información sobre el evento, itinerario y tareas relacionadas."
        canonical="https://testorganizador.bodasdehoy.com"
        openGraph={{
          url: 'https://testorganizador.bodasdehoy.com',
          siteName: 'Bodas de Hoy',
          title: 'Tu planificador de eventos preferido organizador.bodasdehoy.com',
          description: 'Descubre todos los detalles de este evento especial.',
          images: [       // Images must be in a 1.91:1 ratio.            
            {
              url: '/Pantalla.png',
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: '/Pantalla.png',
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: '/Pantalla.png',
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],

          site_name: 'Bodas de Hoy',
        }}
      />

      <AuthProvider>
        <SocketProvider>
          <EventsGroupProvider>
            <EventProvider>
              <ChatProvider>
                <LoadingProvider>
                  <ToastProvider>
                    <SocketControlator />
                    <Container>
                      {!!process?.env?.NEXT_PUBLIC_ID_ANALYTICS && <GoogleAnalytics />}
                      {children}
                    </Container>
                  </ToastProvider>
                </LoadingProvider>
              </ChatProvider>
            </EventProvider>
          </EventsGroupProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
};

export default DefaultLayout;
