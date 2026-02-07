import ClickAwayListener from "react-click-away-listener"

const ModalMesa = ({ set, state, children, title }) => {

    return (
        <>
            <div className=" bg-black opacity-40 z-[60] fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className="absolute z-[60] w-screen h-screen top-0 flex items-center justify-center">
                {true && <ClickAwayListener onClickAway={() => state && set(!state)}>
                    <div className="bg-white py-4 shadow-lg rounded-xl">
                        <div className="w-full border-b-2 border-primary ">
                            <h2 className="font-display text-center text-xl text-gray-500 py-3">{title}</h2>
                        </div>
                        <div className="px-2 pt-2 pb-4" >
                            {children}
                        </div>
                    </div>
                </ClickAwayListener>}
            </div>
        </>
    )
}

export default ModalMesa
