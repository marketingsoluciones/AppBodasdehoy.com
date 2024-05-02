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
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";

const DefaultLayout = ({ children }) => {
  // const router = useRouter()
  // const [isMounted, setIsMounted] = useState<boolean>(false)
  // const [showPreview, setShowPreview] = useState<string | string[] | null>(null)

  // useEffect(() => {
  //   if (!isMounted) {
  //     if (["tiktok", "instagram", "facebook", "x", "youtube"].includes(router?.query?.m?.toString())) {
  //       console.log(router?.query, { router })
  //       router.push("/login")
  //     }
  //     setShowPreview(router?.query?.m)
  //     setIsMounted(true)
  //   }
  //   return () => {
  //     setIsMounted(false)
  //   }
  // }, [])
  return (
    <>
      {/* <Head>
        <title>Bodas de hoy - Organizador de Bodas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head> */}
      {/* {isMounted &&
        showPreview
        ? <></>
        : */}
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
      {/*      }       */}
    </>
  );
};

export default DefaultLayout;
