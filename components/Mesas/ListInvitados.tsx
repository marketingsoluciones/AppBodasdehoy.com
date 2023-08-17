import React, { FC } from "react";
import { EventContextProvider } from "../../context";
import { guests, signalItem } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";

interface propsListInvitados {
  InvitadoNoSentado: guests[]
  setEditInv:any
  editInv:any
  setSelected:any
}

const ListInvitados: FC<propsListInvitados> = ({ InvitadoNoSentado, editInv, setEditInv,setSelected }) => {
  const { setEvent } = EventContextProvider()
  return (
    <>
      <div className="w-full py-5 md:py-4" >
        {InvitadoNoSentado?.map((invitado, index) => (
          <DragInvitado
            key={invitado._id}
            tipo={"invitado"}
            index={index}
            invitado={invitado}
            editInv={editInv}
            setEditInv={setEditInv}
            setSelected={setSelected}
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
