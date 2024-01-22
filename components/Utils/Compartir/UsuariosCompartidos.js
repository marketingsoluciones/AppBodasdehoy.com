export const UsuariosCompartidos = () => {
    const Users = [
    
    ]

    const SliceUsers = Users.slice(0, 4)

    return (
        <>
            <div style={{ left: 11 }} className="flex relative ">
                {SliceUsers.map((item, idx) => {
                    return (
                        <div key={idx} style={{ right: 20 * idx }} className="absolute z-20">
                            <div className=" bg-white rounded-full w-8 h-8 flex items-center justify-center  border relative">
                                {item.nombre}
                                <div className={`h-2.5 w-2.5 ${item.state != false ? "bg-green" : "bg-red"} absolute rounded-full right-1 -bottom-1`} />
                            </div>
                        </div>
                    )
                })}

            </div>
            {
                Users.length > 4 && <div style={{ right: 70 }} className=" bg-white rounded-full w-8 h-8 flex items-center justify-center *text-center  border absolute z-30 text-[13px] truncate font-semibold ">
                    +{Users.length}
                </div>
            }
        </>
    )
}