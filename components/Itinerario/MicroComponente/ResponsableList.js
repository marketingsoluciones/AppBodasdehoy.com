import ClickAwayListener from "react-click-away-listener"
export const ResponsableList = ({  openModal, setOpenModal, DataArry, setSelectIcon, value }) => {

    const handleClick = (item) => {
        setSelectIcon((old) => {
            const f1 = old.findIndex(elem => elem.title === item.title)
            if (f1 < 0) {
                old.push(item)
                return [...old]
            }
            if (f1 > -1) {
                old.splice(f1, 1)
                return [...old]
            }
        })
    }



    return (
        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)}>
            <div className="flex flex-col items-center space-y-2 w-max*" >
                <span className="text-rosa text-[20px]">Responsable </span>
                <div className="overflow-y-auto flex flex-col h-[calc(100vh-300px)] pr-3 space-y-2 ">

                    {
                        DataArry.map((item, idx) => {
                            return (
                                <div
                                    key={idx}
                                    className={`grid grid-cols-3 items-center cursor-pointer hover:bg-slate-200 p-1 rounded-lg  ${value.includes(item.title) ? "bg-slate-300" : "bg-none"}`}
                                    onClick={() => { handleClick(item) }}
                                >
                                    <div className="col-span-1">
                                        <img src={item.icon} className="h-10 " />
                                    </div>
                                    <span className="col-span-2  w-28">{item?.title}</span>
                                </div>
                            )
                        })
                    }
                </div>

                <button className="bg-rosa py-1 px-2 text-white rounded-lg text-" onClick={() => setOpenModal(!openModal)}>
                    cerrar
                </button>
            </div>
        </ClickAwayListener>
    )
}