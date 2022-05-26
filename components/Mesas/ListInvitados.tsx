import React, { FC } from "react";
import { useDrop } from "react-dnd";
import { EventContextProvider } from "../../context";
import { guests, signalItem } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";

interface propsListInvitados {
  InvitadoNoSentado : guests[]
  AddInvitado: CallableFunction
}

const ListInvitados: FC <propsListInvitados>= ({ InvitadoNoSentado, AddInvitado }) => {
  const {setEvent} = EventContextProvider()
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "invitado",
    drop: (item : signalItem) => {
      console.log("hol44a", item)
      item && AddInvitado({ ...item, nombre_mesa: "no asignado"}, setEvent)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <>
      <ul className="w-full py-4" ref={drop}>
        {InvitadoNoSentado?.map((invitado, index) => (
          <DragInvitado
            key={invitado._id}
            tipo={"invitado"}
            index={index}
            invitado={invitado}
          />
        ))}
      </ul>
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
