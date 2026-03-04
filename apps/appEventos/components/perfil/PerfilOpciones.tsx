import { FC, cloneElement, ReactNode } from "react";
import { optionComponent } from "../../pages/configuracion";

interface propsPerfilOpciones {
  components: optionComponent[],
  onClick: CallableFunction,
  actived: number,
  setAlertDev: any,
  alertDev: any
}

export const PerfilOpciones: FC<propsPerfilOpciones> = ({ components, onClick, actived, setAlertDev, alertDev }) => {
  return (
    <ul className="w-full flex overflow-auto md:flex-col md:rounded-xl md:overflow-hidden ">
      {components?.map((item, idx) => (
        <li key={idx} onClick={() => item.state ? setAlertDev(!alertDev) : onClick(idx)} className={""}>
          <button className={`flex w-max md:w-full items-center gap-2 p-5 md:p-3 transition-all cursor-pointer ${actived === idx ? "bg-primary text-white" : "bg-white md:hover:bg-gray-100 text-gray-700"}`}>{cloneElement(item.icon, { className: "w-5 h-5" })}{item.title}</button>
        </li>
      ))}
    </ul>
  );
};
