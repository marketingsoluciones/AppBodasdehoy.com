//@ts-check
import Head from "next/head";

import {
  LoadingProvider,
  AuthProvider,
  EventsGroupProvider,
  EventProvider,
  ChatProvider,
  SocketProvider
} from "../context";
import { SocketControlator } from "../components/DefaultLayout/SocketControlator";
import Container from "../components/DefaultLayout/Container";
import { ToastProvider } from "../context/ToastContext";

const DefaultLayout = ({ children }) => {
  return (
    <>
      {/* <Head>
        <title>Bodas de hoy - Organizador de Bodas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head> */}

      <AuthProvider>
        <SocketProvider>
          <EventsGroupProvider>
            <EventProvider>
              <ChatProvider>
                <LoadingProvider>
                  <ToastProvider>
                    <SocketControlator />
                    <Container>{children}</Container>
                  </ToastProvider>
                </LoadingProvider>
              </ChatProvider>
            </EventProvider>
          </EventsGroupProvider>
        </SocketProvider>
      </AuthProvider>
    </>
  );
};

export default DefaultLayout;
