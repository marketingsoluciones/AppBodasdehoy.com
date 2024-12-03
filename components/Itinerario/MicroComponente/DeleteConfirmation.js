import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DeleteConfirmation = ({ modal, setModal }) => {
    const { t } = useTranslation();
    const [validationText, setValidationText] = useState("")
    const textToValir = modal.subTitle ? modal?.title?.replace(/\s+/g, '')?.toLocaleLowerCase() : null

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className='flex flex-col items-center space-y-2'>
                <p className="text-azulCorporativo mx-8 text-center" >{modal?.subTitle ? modal?.subTitle : modal.title}</p>
                {
                    modal.subTitle &&
                    <input type="text" autoComplete="nope" onChange={(e) => setValidationText(e.target.value)} className=" h-6 border-1 rounded-md focus:border-gray-600  py-3 text-center focus:ring-0 focus:outline-none transition text-sm text-gray-600" />
                }
            </div>
            <div className="space-x-5">
                <button onClick={() => setModal({ state: false })} className=" bg-gray-400 h-10 w-24 rounded-lg text-white font-body hover:opacity-80">
                    {t("discard")}
                </button>
                {
                    modal.subTitle ?
                        <button onClick={() => validationText === textToValir ? modal?.handle() : null} className={`${validationText === textToValir ? "hover:opacity-80 bg-primary transition-all  " : " bg-primary opacity-20 transition-all cursor-not-allowed"} h-10 w-24 rounded-lg text-white font-body`}>
                            {t("eliminate")}
                        </button>:
                        <button onClick={() => modal?.handle() } className={`${ "hover:opacity-80 bg-primary transition-all  " } h-10 w-24 rounded-lg text-white font-body`}>
                        {t("eliminate")}
                    </button>
                }
            </div>
        </div>
    )/*  */
}