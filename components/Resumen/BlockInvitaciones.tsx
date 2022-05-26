//@ts-check
import Link from "next/link";
import { EventContextProvider } from "../../context";

const BlockInvitaciones = () => {
  const { event } = EventContextProvider();
  
  const Invitaciones : {enviadas: number, pendientes: number, total: number} = event?.invitados_array?.reduce(
    (acc, invitado) => {
      if (invitado.invitacion) {
        acc.enviadas++;
        acc.total++;
      } else {
        acc.pendientes++;
        acc.total++;
      }
      return acc;
    },
    { enviadas: 0, pendientes: 0, total: 0 }
  );

  const ListaBlockInvitaciones : {title:string, amount: number}[] = [
    { title: "enviadas", amount: Invitaciones?.enviadas },
    { title: "por enviar", amount: Invitaciones?.pendientes },
    { title: "confirmadas", amount: 0 },
  ];
  
  return (
    <div className="w-full bg-primary rounded-2xl h-16 flex shadow-md md:overflow-hidden relative">
      <div className="w-full md:w-4/5 flex items-center justify-between px-10 ">
        <h3 className="font-display font-semibold hidden md:block text-2xl text-white">
          Invitaciones
        </h3>
        <div className="flex gap-6 w-full justify-center md:justify-end ">
          {ListaBlockInvitaciones.map((item, idx) => (
            <p key={idx} className="font-display text-xs md:text-lg text-white font-light flex gap-2 items-center">
              {item?.title}
              <span className="text-lg md:text-2xl font-semibold">{item?.amount}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="w-1/2 md:w-1/5 h-1/2 md:h-full top-0 right-0 transform -translate-y-2/3 md:translate-y-0 absolute md:relative bg-white rounded-2xl md:rounded-l-2xl flex items-center justify-center shadow">
          <Link href="/invitaciones">
        <p className="font-display font-ligth text-sm text-primary cursor-pointer hover:scale-105 transition transform ">
          Ver mis <span className="font-bold">invitaciones</span>
        </p>
          </Link>
      </div>
    </div>
  );
};

export default BlockInvitaciones;
