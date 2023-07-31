export const Coordina = () => {
    return (
        <>
            <div className="grid md:grid-cols-2 space-x-10 font-display " >
                <div>
                    <img src="/Pantalla.png" alt="Pantalla" />
                </div>
                <div className="flex flex-col justify-center items-center md:items-start mt-10 md:mt-0 px-10 md:px-0">
                    <p className="md:text-6xl hidden md:block text-secondaryOrg">Coordina<br/> todo tu evento</p>
                    <p className="text-3xl block md:hidden text-secondaryOrg">Coordina todo tu evento</p>
                    <p className="text-2xl text-primaryOrg">desde una sola herramienta</p>
                </div>
            </div>
        </>
    )
}