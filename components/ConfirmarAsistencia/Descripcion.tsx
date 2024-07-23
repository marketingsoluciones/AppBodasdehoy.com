import { CorazonIcono } from "../icons"

export const DescripcionComponente = () => {
    const pointsArry = [
        {
            icon: <CorazonIcono />,
            text: "Confirma tu lista de compañantes"
        },
        {
            icon: <CorazonIcono />,
            text: "¿Son alérgicos a algún alimento? apúntalo para que el catering lo tome en cuenta"
        },
        {
            icon: <CorazonIcono />,
            text: "Confirmar su asistencia al evento "
        }
    ]
    return (
        <div className="font-body space-y-5">
            <p className="text-4xl text-secondary font-semibold pt-10  md:px-32">
                Eres un invitado especial al evento
            </p>
            <p className="text-md text-secondary font-regular  md:px-32">
                Registra aquí los detalles de tus acompañantes para así brindarles una experiencia inolvidable.
            </p>
            <div className="md:px-32 space-y-4">
                {
                    pointsArry.map((item, idx) => {
                        return (
                            <div key={idx} className="flex items-center gap-2 ">

                                <span className="text-acento">
                                    {item.icon}
                                </span>
                                <p className="text-primary"> {item.text}</p>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}