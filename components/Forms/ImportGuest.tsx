import { FC } from "react";
import { TiContacts } from "react-icons/ti"
import { FcGoogle } from "react-icons/fc"
import { AuthContextProvider } from "../../context";
import { useImportGuest } from "../../hooks/useImportGuest"
import { useTranslation } from 'react-i18next';

export const ImportGuest: FC<any> = ({ setShowMedioSelectImport, setContact, setShowForApiGoogle }) => {
  const { t } = useTranslation();
  const [contactsForApiGoogle] = useImportGuest()

  const handleClick = async (origin) => {
    setShowMedioSelectImport(false)
    if (origin == "movil" && window["ReactNativeWebView"]) {
      //for react-native
      return
    }
    if (origin == "movil" && navigator["contacts"]) {
      const qwe = ["name", "email", "tel"]
      const contact = await navigator["contacts"].select(qwe)
      setContact({
        name: contact[0].name[0],
        email: contact[0].email[0],
        phones: contact[0].tel,
      })
      return
    }

    if (origin == "userEmail") {
      setTimeout(() => {
        contactsForApiGoogle().then((result) => {
          setShowForApiGoogle(result)
        })
      }, 10);
      return
    }
    if (origin !== "anotherEmail") {
      return
    }
  }

  return (
    <div className="fixed z-10 top-0 left-0 w-[100vw] h-[100vh]  flex items-center justify-center font-display text-lg">
      <div className="bg-gray-900 opacity-50 absolute z-10 top-0 left-0 w-full h-full flex items-center justify-center" />
      {< div className="bg-white w-full md:w-[500px]  opacity-100  z-20 rounded-3xl mx-2 truncate translate-y-[-28px] md:translate-y-0">
        <div onClick={() => { handleClick("movil") }} className="flex group justify-between items-center w-full h-[64px] cursor-pointer border-b-2 px-4">
          <div className="flex items-center gap-3">
            <TiContacts className="w-8 h-8" />
            <span >{t("contactbook")}</span>
          </div>
          <div className={`group-hover:border-blue-700 w-5 h-5 border-2 rounded-full flex justify-center items-center`} >
            <div className="group-hover:bg-blue-700 w-3 h-3 rounded-full" />
          </div>
        </div>
        <div onClick={() => { handleClick("userEmail") }} className="flex group justify-between items-center w-full h-[64px] cursor-pointer border-b-2 px-4">
          <div className="flex items-center gap-3">
            <FcGoogle className="w-8 h-8" />
            <span >{t("contactgoogle")}</span>
          </div>
          <div className={`group-hover:border-blue-700 w-5 h-5 border-2 rounded-full flex justify-center items-center`} >
            <div className="group-hover:bg-blue-700 w-3 h-3 rounded-full" />
          </div>
        </div>
      </div>
      }
    </div>
  )
}