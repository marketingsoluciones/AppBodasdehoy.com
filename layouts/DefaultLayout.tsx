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
import GoogleAnalytics from '../components/GoogleAnalitytcs';
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";

const DefaultLayout = ({ children }) => {
  // const router = useRouter()
  // const [isMounted, setIsMounted] = useState<boolean>(false)
  // const [showPreview, setShowPreview] = useState<string | string[] | null>(null)

  // useEffect(() => {
  //   if (!isMounted) {
  //     if (![].includes(router?.query?.m?.toString())) {
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
    <div className="w-[100vw] h-[100vh]">
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
      {/*      }       */}
    </div>
  );
};

export default DefaultLayout;
