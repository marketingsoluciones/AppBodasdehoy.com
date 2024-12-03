import { useEffect, useState } from "react";
import { GoSearch } from "react-icons/go";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { AuthContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";
import { useTranslation } from 'react-i18next';

export const BlockLugarEvento = () => {
    const { config } = AuthContextProvider()
    const [placesList, setPlacesList] = useState([])
    const [openList, setOpenList] = useState(false)
    const [lugarEvento, setLugarEvento] = useState("")
    const { t } = useTranslation();
    console.log(lugarEvento)
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
    }, [openList])

    const handleClick = (lugar) =>{
        setLugarEvento(lugar)
        setOpenList(!openList)
    }

    return (
        <div className="relative">
            <div onClick={() => setOpenList(!openList)} className="bg-primaryOrg space-x-3 rounded-lg text-white flex justify-between  items-center pl-1.5  md:pl-5 shadow-lg font-display text-xl select-none h-full   ">
                <span>{t("eventvenue")}</span>
                <div className="bg-white w-[45.8%] md:w-[62.54%] rounded-lg h-[40px]  flex items-center justify-between relative px-2 cursor-pointer">
                    <label className="font-display font-base text-sm text-gray-500 ">{lugarEvento}</label>
                    <GoSearch className=" w-6 h-6 text-primaryOrg   " />
                </div>
            </div>
            {
                openList &&
                <ClickAwayListener onClickAway={() => { openList && setOpenList(!openList) }}>
                    <div className={`${openList ? "" : "hidden"}  bg-white rounded-lg py-2 px-3 space-y-1 absolute z-10 h-[290px] overflow-y-auto right-0 top-12 `}>
                        {
                            placesList && placesList?.map((item, idx) => {
                                return (
                                    <div key={idx} onClick={() => handleClick(item.businessName)} className="hover:bg-slate-100 cursor-pointer rounded-md px-3 py-1">
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