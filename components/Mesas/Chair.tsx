import { FC, ReactNode } from "react";


interface propsChair {
  position?: number;
  title: string;
  index: number;
  className: string;
  tipoMesa: string;
  children?: ReactNode;
}

export const Chair: FC<propsChair> = ({ position, children, title, index, className, }) => {
  const canDrop = true
  const isOver = false

  return (
    <>
      <div
        id={`${title}-@-${index}`}
        // role={"Droppeable"}
        className={`js-drop silla w-5 h-5 rounded-full absolute border-2 shadow border-gray-500 overflow-hidden  ${isOver ? "bg-opacity-50" : null
          }  bg-white //${!children[0] && "js-dropListInvitados"} //${isOver || canDrop ? "bg-secondary" : "bg-white"
          } flex items-center justify-center ${className}`}
      >
        {children[0] ? children : <span />}
      </div>
      <style jsx>
        {`
          .radio {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: auto;
            transform: rotate(${position}deg) translate(200%);
          }
        `}
      </style>
    </>
  );
};