import Link from "next/link"

export const Footer = () => {

    const DataLinks = [
        {
            title: "Condiciones empresas",
            router: "/",
        },
        {
            title: "Preguntas frecuentes",
            router: "/",
        },
        {
            title: "Políticas de cookies",
            router: "/",
        },
        {
            title: "¿Cómo funciona la lista de regalos",
            router: "/",
        },
        {
            title: "Privacidad",
            router: "/",
        },
    ]

    return (
        <>
            <div className="grid grid-cols-2 justify-items-center font-display  px-10 md:pb-0 md:px-0">
                <div className="grid md:grid-cols-2 md:ml-48 space-y-3 md:space-y-0">
                    {
                        DataLinks.map((itemm, idx) => (
                            <div key={idx} className="text-white text-sm  md:text-base ">
                                <Link href={itemm.router} passHref>{itemm.title}</Link>
                            </div>
                        ))
                    }

                </div>
                <div  >
                    <img src="/logoFoot.png" alt="Logo eventoorganizador.com" className="" />
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center md:mr-5 space-x-2 ">
                        <p className="text-white">Producto de</p>
                        <img src="/logoBodas.png" alt="Logo Bodasdehoy.com" />
                    </div>
                </div>
            </div>
            <div className="flex items-center md:mr-5 space-x-2 pb-16 px-10 md:hidden  ">
                <p className="text-white">Producto de</p>
                <img src="/logoBodas.png" alt="Logo Bodasdehoy.com" />
            </div>

        </>
    )
}