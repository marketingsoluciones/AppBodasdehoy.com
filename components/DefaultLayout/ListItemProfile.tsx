import { FC, MouseEventHandler, cloneElement } from "react";
import { useTranslation } from "react-i18next";

export interface Option {
  title: string;
  icon: any;
  onClick?: MouseEventHandler;
  sizeIcon?: keyof typeof sizesIcon;
  target?: string;
  development: string[]
  rol: string[] | undefined
}

const sizesIcon: { xs: string; sm: string } = {
  xs: "w-3 h-3",
  sm: "w-5 h-5",
};

export const ListItemProfile: FC<Option> = ({ title, icon, sizeIcon = "sm", target = "", onClick }) => {
  /* Validacion de opciones  visibles en el menu desplegable en el navbar dependiendo del tipo de usuario  */
  const { t } = useTranslation()
  return (
    <>
      <li onClick={onClick && onClick}
        className="flex text-gray-700 gap-2 hover:bg-color-base transition cursor-pointer rounded-lg py-1 px-2 items-center justify-start">
        {cloneElement(icon, { className: sizesIcon[sizeIcon] })}
        {t(title)}
      </li>
    </>
  );
};