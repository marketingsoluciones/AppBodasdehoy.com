import ClickAwayListener from "react-click-away-listener"
export const IconList = ({ IterArry, openIcon, setOpenIcon, setSelectIcon }) => {
    return (
        <ClickAwayListener onClickAway={() => openIcon && setOpenIcon(false)}>
            <div className="flex flex-col items-center">
                <div className="grid grid-cols-4">
                    {
                        IterArry.map((item, idx) => (
                            <div key={idx}>
                                <button onClick={() => { setOpenIcon(!openIcon), setSelectIcon(item.title) }} className="hover:bg-gray-300 rounded-lg p-2">
                                    {item.icon}
                                </button>
                            </div>
                        ))
                    }
                </div>
                <button className="bg-rosa py-1 px-2 text-white rounded-lg mt-3" onClick={() => setOpenIcon(!openIcon)}>
                    cerrar
                </button>
            </div >
        </ClickAwayListener>
    )
}