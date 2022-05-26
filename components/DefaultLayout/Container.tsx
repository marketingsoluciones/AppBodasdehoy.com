import { useRouter } from "next/router";
import { useState, useContext, useEffect } from "react";
import {
  ChatContextProvider,
  EventContextProvider,
  AuthContextProvider,
  EventsGroupContextProvider,
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
        const cliente = await api.Suscripcion();
        setConectado("true");
        cliente.request({ query }).subscribe(({ data }) => {
          const noti = data.canal;
          if (noti.tipo == "notificacion") {
            setEventsGroup((eventos) => {
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
          if (noti.tipo == "chat") {
            setChat((old) => ({ ...old, canales: ["1", "2", "3"] }));
          }
        });
      }
    }
    if (conectado == "false") {
      Suscripcion();
    }
  }, [user]);

  return (
    <>
      <NavigationMobile />
      <Navigation
        notificaciones={notificaciones}
        set={(accion) => setShow(accion)}
        state={show}
        active={active}
      />

      <BarraLoading />
      <main>{children}</main>
    </>
  );
};

export default Container;
