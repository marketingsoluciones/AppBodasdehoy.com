import React from "react"

export const SetNickname = ({ setShowModalNickname }) => {

    return (
        <div className="flex flex-col space-y-2 w-full">
            <div>
                <h1 className="text-sm font-bold text-gray-700 capitalize">tu apodo</h1>
                <p className="text-xs text-gray-500 capitalize">Escribe un apodo para identificarte</p>
            </div>
            <input type="text"
                className="border-[1px] border-gray-300 h-7 w-full text-xs text-gray-700 px-2 py-1 flex items-center rounded-xl"
            />
            <div className="flex justify-end items-center space-x-2">
                <button onClick={() => setShowModalNickname(false)} className="capitalize text-xs rounded-md bg-gray-400 p-1  text-white">
                    cancelar
                </button>
                <button className="capitalize text-xs  rounded-md bg-primary p-1 text-white">
                    guardar
                </button>
            </div>

        </div>
    )
}