import { AuthContextProvider } from "../../../context"

export const WarningMessage = ({ modal, setModal, title }) => {
    const { user, config } = AuthContextProvider()

    return (
        <div className="p-10 flex flex-col items-center justify-center h-full space-y-5">
            <div className="capitalize text-primary text-[20px]">
                {title}
            </div>
            <div>
                <span className="text-[15px]"> Estimado/a <span className="capitalize font-semibold">  {user.displayName} </span> .</span><br /><br />
                <p className="text-[14px] w-[350px] ">
                    Para habilitar esta función específica, debes habilitar la version <sapn className="font-semibold"> Premium.</sapn><br /><br />
                    Comunícate con nosotros a través de nuestro Whatsapp para solicitar un periodo de prueba.<br /><br />
                </p>
                Atentamente, <span className="capitalize font-semibold">{config.development}</span>
            </div>
            <div className="flex flex-col space-y-1">

                <button className="bg-primary rounded-lg px-3 py-1 text-white text-[15px]">Contactanos</button>
                <button className="text-primary text-[12px]" onClick={() => setModal(!modal)}>Cerrar</button>
            </div>
        </div>
    )
}