import ClickAwayListener from "react-click-away-listener"

const ModalCrearMesa = ({set, state, children}) => {
    
    return (
        <>
        <div className=" backdrop-filter backdrop-blur z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden "/>
        <div className=" bg-black opacity-60 z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden "/>
        
        <ClickAwayListener onClickAway={() => state && set(!state)}>
        <div className="bg-white w-max h-72 shadow-lg fixed m-auto inset-0 z-30 rounded-xl ">
            {/* Cabecera */}
            <div className="w-full border-b-2 border-primary ">
                <h2 className="font-display text-center text-xl text-gray-500 py-3">Añadir mesa</h2>
                
            </div>
            {/* Cuerpo */}
            <div className="px-4 pt-4">
                {children}
            </div>
        </div>
        </ClickAwayListener>
        </>
    )
}

export default ModalCrearMesa
