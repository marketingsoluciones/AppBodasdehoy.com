import ClickAwayListener from "react-click-away-listener"
import { useTranslation } from 'react-i18next';
const ModalGuardarRegalo = ({set, state, children}) => {
    const { t } = useTranslation();
    
    return (
        <>
        <div className=" backdrop-filter backdrop-blur z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden "/>
        <div className=" bg-black opacity-60 z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden "/>
        
        <ClickAwayListener onClickAway={() => state && set(!state)}>
        <div className="bg-white w-max h-72 shadow-lg fixed m-auto inset-0 z-30 rounded-xl px-10  py-5">
            {/* Cabecera */}
            <div className="w-full border-b-2 border-primary ">
                <h2 className="font-display text-center text-xl text-gray-500 ">{t("savethelink")}</h2>  
                <h3 className="font-display text-center text-xl text-gray-500 pb-3 ">{t("youcanshare")}</h3>             
            </div>
            {/* Cuerpo */}
           {/*  <div>
                <FormGuardarRegalos
                    
                />

                
            </div> */}
            <div className="px-4 pt-4">
                {children}
            </div>
        </div>
        </ClickAwayListener>
        </>
    )
}

export default ModalGuardarRegalo