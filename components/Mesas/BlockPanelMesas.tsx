import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";

interface propsBlockPanelMesas {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
  setModelo: Dispatch<SetStateAction<string>>
}

const BlockPanelMesas: FC<propsBlockPanelMesas> = ({ set, state, setModelo }) => {
  const [classNameGrid, setClassNameGrid] = useState("")
  const ListaMesas = [
    { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada" },
    { icon: <MesaPodio className="relative w-max" />, title: "podio" },
    { icon: <MesaRedonda className="relative w-max" />, title: "redonda" },
    { icon: <MesaImperial className="relative w-max" />, title: "imperial" },
  ];

  const handleClick = (item: string) => {
    set(!state)
    setModelo(item)
  }

  const handleResize = () => {
    let a = 0
    if (window.innerWidth < 1536) {
      const r = Math.trunc(ListaMesas.length / 3 + 1)
      if (r == 1) setClassNameGrid("h-[50%] grid-rows-1 grid-cols-3")
      if (r == 2) setClassNameGrid("h-[100%] grid-rows-2 grid-cols-3")
      if (r == 3) setClassNameGrid("h-[150%] grid-rows-3 grid-cols-3")
      if (r == 4) setClassNameGrid("h-[200%] grid-rows-4 grid-cols-3")
      if (r == 5) setClassNameGrid("h-[250%] grid-rows-5 grid-cols-3")
    }
    // if (window.innerWidth > 768 && window.innerWidth < 1536) {
    //   const r = Math.trunc(ListaMesas.length / 3 + 1)
    //   if (r == 1) setClassNameGrid("h-[33.67%] grid-rows-1 grid-cols-3")
    //   if (r == 2) setClassNameGrid("h-[66.67%] grid-rows-2 grid-cols-3")
    //   if (r == 3) setClassNameGrid("h-[100%] grid-rows-3 grid-cols-3")
    //   if (r == 4) setClassNameGrid("h-[133.33%] grid-rows-4 grid-cols-3")
    //   if (r == 5) setClassNameGrid("h-[166.67%] grid-rows-5 grid-cols-3")
    // }
    if (window.innerWidth > 1536) {
      const r = Math.trunc(ListaMesas.length / 4 + 1)
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

    // <div className="bg-secondary w-full rounded-lg pb-6 md:pb-3 shadow-lg ">
    //   <div className="relative">
    //     <h1 className="font-display font-semibold text-2xl text-white px-6 py-4 md:py-1 relative">
    //       Mesas
    //     </h1>
    //     <span className="bg-tertiary flex gap-2 text-primary font-medium text-sm items-center px-3 rounded-lg absolute bottom-0 right-0 transform translate-y-1/2"> <PlusIcon /> escoge tu mesa con un click </span>
    //   </div>
    <div className="w-full h-[100%] overflow-auto">
      <div className={`grid ${classNameGrid}`} >
        {ListaMesas.map((item, idx) => (
          <div onClick={() => handleClick(item.title)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
            <div key={idx} className="jkrelative w-full h-full flex transform hover:scale-105 transition justify-center items-center">
              {item.icon}

              <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
            </div>
          </div>
        ))}
      </div>
    </div>
    // </div>

  );
};

export default BlockPanelMesas;