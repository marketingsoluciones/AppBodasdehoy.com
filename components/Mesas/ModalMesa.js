import ClickAwayListener from "react-click-away-listener"

const ModalMesa = ({ set, state, children, title }) => {

    return (
        <>
            <div className=" backdrop-filter* *backdrop-blur z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className=" bg-black opacity-40 z-[60] fixed top-0 left-0 w-screen h-screen overflow-hidden " />

            <ClickAwayListener onClickAway={() => state && set(!state)}>
                <div className="bg-gray-300 w-full h-full">
                    <div className="bg-white pb-5 w-[85%] h-[300px] md:w-max md:h-max shadow-lg fixed m-auto inset-x-0 inset-y-0 z-[60] rounded-xl ">
                        <div>
                            <div className="w-full border-b-2 border-primary ">
                                <h2 className="font-display text-center text-xl text-gray-500 py-3">{title}</h2>
                            </div>
                            <div className="px-4 pt-4">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </ClickAwayListener>
        </>
    )
}

export default ModalMesa
