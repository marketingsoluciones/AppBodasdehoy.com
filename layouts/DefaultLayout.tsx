//@ts-check
import Head from "next/head";

import {
  LoadingProvider,
  AuthProvider,
  EventsGroupProvider,
  EventProvider,
  ChatProvider,
} from "../context";
import Container from "../components/DefaultLayout/Container";
import { ToastProvider } from "../context/ToastContext";

const DefaultLayout = ({ children }) => {
  return (
    <>
      <Head>
        <title>Bodas de hoy - Organizador de Bodas</title>
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click." />
      </Head>

      <AuthProvider>
        <EventsGroupProvider>
          <EventProvider>
            <ChatProvider>
              <LoadingProvider>
                <ToastProvider>
                  <Container>{children}</Container>
                </ToastProvider>
              </LoadingProvider>
            </ChatProvider>
          </EventProvider>
        </EventsGroupProvider>
      </AuthProvider>
    </>
  );
};

export default DefaultLayout;
