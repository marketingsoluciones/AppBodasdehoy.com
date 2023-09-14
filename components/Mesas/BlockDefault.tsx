import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from "react";

interface propsBlockDefault {
  children: ReactNode
  listaLength: number
}

const BlockDefault: FC<any> = ({ children, listaLength }) => {
  const [classNameGrid, setClassNameGrid] = useState("")

  const handleResize = () => {
    let a = 0
    if (window.innerWidth < 1536) {
      const r = Math.trunc(listaLength / 3 + 1)
      if (r == 1) setClassNameGrid("h-[50%] grid-rows-1 grid-cols-3")
      if (r == 2) setClassNameGrid("h-[100%] grid-rows-2 grid-cols-3")
      if (r == 3) setClassNameGrid("h-[150%] grid-rows-3 grid-cols-3")
      if (r == 4) setClassNameGrid("h-[200%] grid-rows-4 grid-cols-3")
      if (r == 5) setClassNameGrid("h-[250%] grid-rows-5 grid-cols-3")
    }
    // if (window.innerWidth > 768 && window.innerWidth < 1536) {
    //   const r = Math.trunc(listaMesasLength / 3 + 1)
    //   if (r == 1) setClassNameGrid("h-[33.67%] grid-rows-1 grid-cols-3")
    //   if (r == 2) setClassNameGrid("h-[66.67%] grid-rows-2 grid-cols-3")
    //   if (r == 3) setClassNameGrid("h-[100%] grid-rows-3 grid-cols-3")
    //   if (r == 4) setClassNameGrid("h-[133.33%] grid-rows-4 grid-cols-3")
    //   if (r == 5) setClassNameGrid("h-[166.67%] grid-rows-5 grid-cols-3")
    // }
    if (window.innerWidth > 1536) {
      const r = Math.trunc(listaLength / 4 + 1)
      if (r == 1) setClassNameGrid("h-[25%] grid-rows-1 grid-cols-4")
      if (r == 2) setClassNameGrid("h-[50%] grid-rows-2 grid-cols-4")
      if (r == 3) setClassNameGrid("h-[100%] grid-rows-3 grid-cols-4")
      if (r == 4) setClassNameGrid("h-[150%] grid-rows-4 grid-cols-4")
      if (r == 5) setClassNameGrid("h-[200%] grid-rows-5 grid-cols-4")
    }
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
      <div className={`grid ${classNameGrid}`} >
        {children}
      </div>
    </div>
  );
};

export default BlockDefault;