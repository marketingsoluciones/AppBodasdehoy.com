import { useRouter } from "next/router"
import { MesaIcon } from "../icons"
import { useTranslation } from 'react-i18next';

const SentarBlock = () => {
  const { t } = useTranslation();
    const router = useRouter();
    return (
        <div className="absolute md:hidden w-40 h-40 bg-primary rounded-full flex flex-col items-center justify-center inset-x-0 mx-auto bottom-0 transform translate-y-1/2">
          <MesaIcon className="text-white" />
          <p className="font-display text-md font-semibold text-white">
            {t("sit")} <span className="font-light">{t("guests")}</span>
          </p>
          <button
            onClick={() => router.push("/mesas")}
            className="focus:outline-none bg-tertiary rounded-lg text-gray-700 font-display text-sm font-semibold px-2 "
          >
            {t("addtable")}
          </button>
        </div>
    )
}

export default SentarBlock
