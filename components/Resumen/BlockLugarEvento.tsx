import { useEffect, useState } from "react";
import { GoSearch } from "react-icons/go";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { AuthContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";

export const BlockLugarEvento = () => {
    const { config } = AuthContextProvider()
    const [placesList, setPlacesList] = useState([])
    const [openList, setOpenList] = useState(false)

    useEffect(() => {
        fetchApiBodas({
            query: queries?.getAllBusiness,
            variables: {
                criteria: {
                    categories: "62057b0f59c9cd5da26eccfa",
                    status: true
                },
                skip: 0,
                development: "bodasdehoy"
            },
            development: config?.development
        }).then((result) => {
            setPlacesList(result?.results)
        })
    }, [])

    return (
        <div className="relative">
            <div onClick={() => setOpenList(!openList)} className="bg-primaryOrg space-x-3 rounded-lg text-white flex  items-center  pl-5 shadow-lg font-display text-xl select-none h-full  ">
                <span>Lugar del evento</span>
                <div className="bg-white w-[62.54%] rounded-lg h-full flex items-center justify-end">
                    <GoSearch className=" w-6 h-6 text-primaryOrg mr-2 " />
                </div>
            </div>
            {
                openList &&
                    <ClickAwayListener onClickAway={() => { openList && setOpenList(!openList) }}>
                        <div className={`${openList ? "" : "hidden"}  bg-white rounded-lg py-2 px-3 space-y-1 absolute z-10 h-[290px] overflow-y-auto right-0 top-12 `}>
                            {
                                placesList && placesList?.map((item, idx) => {
                                    return (
                                        <div key={idx} className="hover:bg-slate-100 cursor-pointer rounded-md px-3 py-1">
                                            {item.businessName}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </ClickAwayListener>
            }
        </div>
    )
}