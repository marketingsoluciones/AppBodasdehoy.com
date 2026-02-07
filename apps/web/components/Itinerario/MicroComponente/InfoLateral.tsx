import { FC, useState } from "react";
import { motion } from "framer-motion"
import { IoClose } from "react-icons/io5";
import { Info } from "../../../utils/Interfaces";

interface props {
  ubication: string
  infoOptions: Info[]
}

export const InfoLateral: FC<props> = ({ ubication, infoOptions }) => {
  const [infoIdx, setInfoIdx] = useState<number>(-1)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }} className={`bg-gray-300 hidden md:block 2xl:flex w-10 2xl:w-fit 2xl:h-10 fixed z-30 top-[200px] 2xl:px-2 space-y-3 2xl:space-x-3 2xl:space-y-0 cursor-pointer px-1.5 py-2 ${ubication === "right" ? "right-0 rounded-l-lg" : "left-0 rounded-r-lg"}`}>
        {infoOptions.map((elem, idx) => {
          return (
            <div onClick={() => {
              if (infoIdx === idx) {
                setInfoIdx(-1)
                return
              }
              setInfoIdx(idx)
            }
            } key={idx} className="w-7 h-7 bg-gray-200 hover:border-[1px] border-primary rounded-md flex justify-center items-center" >
              {elem.icon}
            </div>
          )
        })
        }

      </motion.div>
      <div className={`2xl:w-[calc(calc(100vw-1016px)/2)] top-[256px] fixed z-20 2xl:flex-1 2xl:flex flex-col ${ubication === "right" ? "right-0 pl-6" : "left-0 pr-6"}`}>
        {infoOptions.map((elem, idx) => {
          return (
            infoIdx === idx &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} key={idx} className={`w-full max-w-[410px] bg-gray-200 overflow-hidden  ${ubication === "right" ? "pl-6 rounded-l-xl" : "pr-6 rounded-r-xl"}`} >
              <div onClick={() => setInfoIdx(-1)} className={`absolute w-6 h-6 bg-gray-100 hover:bg-gray-200 hover:border-2 border-gray-300 rounded-full translate-y-2 cursor-pointer flex justify-center items-center ${ubication === "right" ? "right-2" : "right-8"}`}>
                <IoClose className="w-5 h-5" />
              </div>
              <div
                id={`info-idx`} className={`w-[300px] 2xl:w-full ${infoIdx === idx ? "flex" : "hidden"}*`}>
                {elem?.info}
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}

