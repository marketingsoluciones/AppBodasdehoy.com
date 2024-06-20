import { AuthContextProvider } from "../../../context"

export const WarningMessage = ({ modal, setModal, title }) => {
    const { user, config } = AuthContextProvider()

    return (
        <div className="p-10 flex flex-col items-center justify-center h-full space-y-5">
            <div className="capitalize text-primary text-[20px]">
                {title}
            </div>
            <div>
                <p className="text-[12px]">
                    <span className="text-[15px]"> Estimado/a <span className="capitalize font-semibold">  {user.displayName} </span> .</span><br /><br />

                    Para habilitar esta función específica, debes ponerte en contacto con nuestro equipo. Ellos estarán encantados de ayudarte a activar esta función que necesitas.<br />

                    Por favor, comunícate con nosotros a través de nuestro Whatsapp para obtener más información y asistencia.<br />

                    ¡Gracias por tu interés en nuestros servicios!<br /><br />

                    Atentamente, <span className="capitalize font-semibold">{config.development}</span>
                </p>
            </div>
            <div className="flex flex-col space-y-1">

                <button className="bg-primary rounded-lg px-3 py-1 text-white text-[15px]">Contactanos</button>
                <button className="text-primary text-[12px]" onClick={() => setModal(!modal)}>Cerrar</button>
            </div>
        </div>
    )
}