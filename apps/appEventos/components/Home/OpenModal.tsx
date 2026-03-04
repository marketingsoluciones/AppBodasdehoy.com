import { FC } from "react";
import { ModalAddUserToEvent } from "../Utils/Compartir";

export const OpenModal: FC<any> = ({ openModal, setOpenModal }) => {
  return (
    <div className="fixed w-[100vw] h-[100vh] top-0 left-0 z-50">
      <ModalAddUserToEvent openModal={openModal.state} setOpenModal={setOpenModal} event={openModal.data} />
    </div>
  )
}