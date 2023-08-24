import { FC } from "react";
import { EventContextProvider } from "../../context";
import { api } from "../../api";


export const ConfirmationBlock: FC<any> = ({ arrEnviarInvitaciones, set }) => {
  const { event, setEvent } = EventContextProvider();

  const Cancelar = () => {
    set([]);
  };

  const Aceptar = async () => {
    const params = {
      query: `mutation enviaInvitacion (
          $evento_id : String,
          $invitados_ids_array : [String],
          $dominio: String
        ){
          enviaInvitacion(
            evento_id:$evento_id,
            invitados_ids_array:$invitados_ids_array,
            dominio:$dominio
          ){
            _id,
            invitados_array{
              _id,
              invitacion,
              nombre,
              correo,
              rol,
              chats_array{
                _id,
                tipo
              }
            }
          }
        }        
        `,
      variables: {
        evento_id: event?._id,
        invitados_ids_array: arrEnviarInvitaciones,
        dominio: process.env.NEXT_PUBLIC_BASE_URL
      },
    };

    try {
      await api.ApiApp(params);
    } catch (error) {
      console.log(error);
    } finally {
      setEvent((old) => {
        arrEnviarInvitaciones.forEach((invitado) => {
          const idxInvitado = event?.invitados_array?.findIndex(
            (inv) => inv._id == invitado
          );
          old.invitados_array[idxInvitado] = {
            ...old.invitados_array[idxInvitado],
            invitacion: true,
          };
        });

        return { ...old };
      });
      set([])
    }
  };
  return (
    <div className="w-full h-full absolute grid place-items-center p-4">
      <div className="bg-white rounded-xl relative w-max h-max p-6 z-30 flex flex-col gap-3">
        <p className="font-display text-gray-500">{`¿Desea enviar ${arrEnviarInvitaciones.length
          } ${arrEnviarInvitaciones.length > 1 ? "invitaciones" : "invitacion"
          } de su evento?`}</p>
        <div className="w-full flex gap-10 justify-center h-max items-center">
          <button
            onClick={Aceptar}
            className="rounded-md font-display focus:outline-none bg-green text-white hover:opacity-90 transition px-2 py-1"
          >
            Aceptar
          </button>
          <button
            onClick={Cancelar}
            className="rounded-md font-display focus:outline-none bg-primary text-white hover:opacity-90 transition px-2 py-1"
          >
            Cancelar
          </button>
        </div>
      </div>
      <div className="w-full h-full absolute bg-black rounded-xl opacity-50 z-20" />
    </div>
  );
};