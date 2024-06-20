export const DeleteConfirmation = ({modal, setModal, deleteItinerario}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
            <p className="text-azulCorporativo" >¿ Estas seguro de borrar todo el itinerario ?</p>
            <div className="space-x-5">
                <button onClick={() => setModal(!modal)} className=" bg-gray-400 h-10 w-24 rounded-lg text-white font-body hover:opacity-80">
                    Descartar
                </button>
                <button onClick={() => deleteItinerario()} className=" bg-primary h-10 w-24 rounded-lg text-white font-body  hover:opacity-80">
                    Eliminar
                </button>
            </div>
        </div>
    )
}