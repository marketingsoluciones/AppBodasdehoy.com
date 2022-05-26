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
        <title>App Bodasdehoy</title>
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
