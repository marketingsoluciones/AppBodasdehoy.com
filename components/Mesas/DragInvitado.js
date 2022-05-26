import { useDrag } from "react-dnd";
import { ImageProfile } from "../../utils/Funciones";
import { MesaIcon, PendienteIcon } from "../icons";

const DragInvitado = (props) => {
  const { tipo, invitado, index } = props;
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: tipo,
    item: { tipo: tipo, invitado: invitado, index },
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
      };
    },
  }));

  return (
    <>
      <li
        ref={drag}
        role="Handle"
        className="flex justify-between px-5 py-2 hover:bg-base transition"
      >
        <span className="flex gap-3 items-center">
        <img
          ref={dragPreview}
          className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300"
          src={ImageProfile[invitado.sexo].image}
          alt={ImageProfile[invitado.sexo].alt}
        />
        <p className="font-display text-gray-500 text-sm">{invitado?.nombre}</p>
        </span>
        
      </li>
    </>
  );
};

export default DragInvitado;
