import { useRouter } from "next/router";
import { useState, useContext, useEffect } from "react";
import {
  ChatContextProvider,
  EventContextProvider,
  AuthContextProvider,
  EventsGroupContextProvider,
  LoadingContextProvider,
} from "../../context";
import BarraLoading from "./BarraLoading";
import { api } from "../../api";
import NavigationMobile from "./NavigationMobile";
import Navigation from "./Navigation";

const Container = (props) => {
  const { children } = props;

  const { user } = AuthContextProvider();
  const { setChat } = ChatContextProvider();
  const { event } = EventContextProvider();
  const { setEventsGroup } = EventsGroupContextProvider();
  const { loading } = LoadingContextProvider();

  const [show, setShow] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setActive(router.pathname);
  }, [router]);

  useEffect(() => {
    setNotificaciones(event?.notificaciones_array);
  }, [event]);

  const [conectado, setConectado] = useState("false");

  useEffect(() => {
    async function Suscripcion() {
      if (user) {
        const query = `subscription{
          canal(usuario_id:"${user?.id}"){
            usuario_id,evento_id,_id,fecha_creacion,mensaje,tipo
          }
        }`;

        // para conectarse a supscripciones de graphql
        /*const cliente = await api.Suscripcion();
        setConectado("true");
        cliente.request({ query }).subscribe(({ data }) => {
          const noti = data.canal;
          if (noti.tipo == "notificacion") {
            setEventsGroup((eventos: any): any => {
              const index = eventos.findIndex(
                (evento) => evento._id == noti.evento_id
              );
              const arrNoti = eventos[index]?.notificaciones_array;
              arrNoti.push(noti);

              return [
                ...eventos,
                (eventos[index].notificaciones_array = arrNoti),
              ];
            });
          }
          //if (noti.tipo == "chat") {
          //  setChat((old) => ({ ...old, canales: ["1", "2", "3"] }));
          //}
        });*/
      }
    }
    if (conectado == "false") {
      Suscripcion();
    }
  }, [user]);

  return (
    <>
      {/* <div className="bg-red max-w-full max-h-full w-[90%] h-[90%] flex flex-col relative"> */}
      <NavigationMobile />
      <Navigation
        notificaciones={notificaciones}
        set={(accion: any) => setShow(accion)}
        state={show}
        active={active}
      />

      {loading && <BarraLoading />}
      <div className="*max-w-[70%] *max-h-[10%] w-[100%] h-[calc(100vh-144px)] overflow-auto ">
        <main>
          {children}
        </main>
      </div>
      {/* </div> */}
    </>
  );
};

export default Container;
