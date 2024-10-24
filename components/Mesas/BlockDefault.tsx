import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, ElementRef, FC, MutableRefObject, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { useScreenSize } from "./FuntionsDragable";
import { useTranslation } from 'react-i18next';

interface propsBlockDefault {
  children: ReactNode
  listaLength: number
}

const BlockDefault: FC<propsBlockDefault> = ({ children, listaLength }) => {
  const { t } = useTranslation();
  const refDiv: MutableRefObject<HTMLDivElement> = useRef(null)

  const handleResize = () => {
    const width = refDiv?.current?.clientWidth
    const widthChild = refDiv?.current?.children[0]?.clientWidth
    const gap = Math.trunc((width - widthChild * Math.trunc(width / widthChild)) / (Math.trunc(width / widthChild) - 1))
    refDiv.current.setAttribute("style", `column-gap: ${gap - 2}px`)
  }

  useEffect((): any => {
    handleResize()
  }, [])

  useEffect((): any => {
    window.addEventListener('resize', handleResize)
    return _ => window.removeEventListener('resize', handleResize)
  }, [])


  return (
    <div className="w-full h-full overflow-auto text-sm">
      <div ref={refDiv} className={`w-full truncate flex flex-wrap`}>
        {children}
      </div>
    </div>
  );
};

export default BlockDefault;