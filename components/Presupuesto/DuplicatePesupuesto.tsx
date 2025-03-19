import { t } from "i18next";
import { HiArrowSmallRight } from "react-icons/hi2"
import Select from 'react-select';

export const DuplicatePresupuesto = () =>{
    return (
        <div className="w-[650px] bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
                <h2 className="text-lg font-semibold capitalize text-gray-700">{t("duplicar")} {/* {cleanedPath} */}</h2>
                <button className="text-gray-500" /* onClick={() => { setModalDuplicate({ state: false }) }} */>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-11 gap-4 px-3 py-6">
                <div className="col-span-5">
                    <label className="text-sm text-gray-500 capitalize">{/* {cleanedPath} */} {t("aDuplicar")}</label>
                    <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize">
                       {/*  {modalDuplicate.data?.title} */}
                    </div>
                </div>
                <div className="col-span-1 flex items-center justify-center mt-5">
                    <HiArrowSmallRight className="w-5 h-5" />
                </div>
                <div className="col-span-5">
                    <label className="text-sm text-gray-500 capitalize">{t("duplicateIn")}</label>
                    <Select
                        options={[]}
                        //onChange={/* handleSelectChangee */}
                        classNamePrefix="react-select"
                        placeholder={t("seleccionaOpcion") + "..."}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
                {/* <button onClick={() => { setModalDuplicate({ state: false }) }} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
                <button onClick={() => handleDuplicateItinerario()} disabled={!selectedOption} className={`${!selectedOption ? "bg-gray-300" : "bg-primary"} text-white rounded-md py-2 px-4 mt-4 capitalize`}>{t("duplicar")}</button> */}
            </div>
        </div>
    )
}