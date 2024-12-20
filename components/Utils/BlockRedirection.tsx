import { FC } from "react";
import { motion } from "framer-motion"
import { TbInfoTriangle } from "react-icons/tb";
import { MisEventosIcon } from "../icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

export const BlockRedirection: FC = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className=" w-full h-full flex flex-col justify-center items-center text-gray-700 space-y-4 -translate-y-14">
      <motion.div initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex items-center gap-8 pb-20">
        <div className="flex items-center space-x-2">
          <TbInfoTriangle className="w-12 h-12 text-primary" />
          <span>{t("No tienes permiso para este módulo")}</span>
        </div>
        <div onClick={() => router.push("/")} className="flex flex-col items-center text-gray-800 bg-primary pt-3 pb-2 px-10 rounded-2xl cursor-pointer hover:scale-110 transition">
          <MisEventosIcon className="w-8 h-8" />
          <span>My Events</span>
        </div>
      </motion.div>
    </div>
  )
}