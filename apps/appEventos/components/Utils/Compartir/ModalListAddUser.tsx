import { useState } from "react"
import ClickAwayListener from "react-click-away-listener"
/* componente sin usar... mantener por si se puede reutilizar */
export const ModalListAddUser = ({ set, state, evento }) => {
    return (
        <ClickAwayListener onClickAway={() => state && set(false)}>
                <div className={`${state ? "absolute top-[145px] right-12 z-50 " : "hidden"}  h-[calc(100vh-400px)] w-[80%]  bg-white overflow-y-auto border rounded-lg`}>
                    {
                        evento.compartido_array.map((item, idx) => {
                            return (
                                <div key={idx}>
                                    <User data={item} />
                                </div>
                            )
                        })
                    }
                </div>
         </ClickAwayListener> 
    )
}

const User = ({ data }) => {
    
    return (
        <div className="flex justify-center items-center py-5 px-2 space-x-4 hover:bg-slate-50 cursor-pointer ">
            <div className="hidden md:block">
                <img
                    src={data?.sexo == "hombre" ? "/profile_men.png": "profile_woman.png"}
                    className="object-cover w-11 h-11 rounded-full"
                />
            </div>
            <div className="flex flex-col text-[15px] w-[45%]">
                <span>{data?.nombre}</span>
                <span className="truncate">{data?.correo}</span>
            </div>
            <button className="bg-primary text-white rounded-lg py-1 px-2 text-xs">
                Añadir
            </button>
        </div>
    )
}