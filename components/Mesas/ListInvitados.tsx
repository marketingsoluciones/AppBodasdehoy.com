import React, { FC } from "react";
import { EventContextProvider } from "../../context";
import { guests, signalItem } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";

interface propsListInvitados {
  InvitadoNoSentado: guests[]
}

const ListInvitados: FC<propsListInvitados> = ({ InvitadoNoSentado }) => {
  const { setEvent } = EventContextProvider()

  return (
    <>
      <div className="w-full py-4" >
        {InvitadoNoSentado?.map((invitado, index) => (
          <DragInvitado
            key={invitado._id}
            tipo={"invitado"}
            index={index}
            invitado={invitado}
          />
        ))}
      </div>
      <style jsx>
        {`
        ul {
          min-height: 15rem
        }
        `}
      </style>
    </>
  );
};

export default ListInvitados;
