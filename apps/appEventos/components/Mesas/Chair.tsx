import { FC, ReactNode } from "react";
import { table } from "../../utils/Interfaces";
import { useTranslation } from 'react-i18next';


interface propsChair {
  table: table
  position?: number;
  index: number;
  className: string;
  children?: ReactNode;
  radio?: number
}

export const Chair: FC<propsChair> = ({ position = 0, children, table, index, className, radio }) => {
  const { t } = useTranslation();
  const canDrop = true
  const isOver = false
  return (
    <div id="contentChair-2">
      <div
        id={`${table._id}-@-${index}`}
        // role={"Droppeable"}
        className={`js-dropGuests silla w-[45px] h-[45px] rounded-full absolute border-2 border-gray-500 overflow-hidden *${isOver ? "bg-opacity-50" : null}  ${children[0] ? "bg-primary" : "bg-white"}  flex items-center justify-center ${className}`}
      >
        {children[0]
          ? <span style={{ rotate: `-${position + table?.rotation}deg` }} className="w-full">{children}</span>
          : <span style={{ rotate: `-${position + table?.rotation}deg` }} className="font-display font-bold text-gray-500">{index + 1}</span>}
      </div>
      <style jsx>
        {`
          .radio {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: auto;
            transform: rotate(${position}deg) translate(${radio + 18}px);
          }
        `}
      </style>
    </div>
  );
};