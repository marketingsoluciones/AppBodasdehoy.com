import React, { FC } from "react";
import { guests } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";
import { EventContextProvider } from "../../context";

interface propsListInvitados {
  setEditInv: any
  editInv: any
  setSelected: any
}

const ListInvitados: FC<propsListInvitados> = ({ editInv, setEditInv, setSelected }) => {
  const { filterGuests } = EventContextProvider()
  return (
    <>
      <div className="w-full" >
        {filterGuests?.noSentados?.map((invitado, index) => (
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
