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
