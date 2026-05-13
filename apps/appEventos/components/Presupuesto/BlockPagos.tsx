import { motion } from "framer-motion";
import React, { useState } from "react";
import { Modal } from "../Utils/Modal";
import { PiXBold } from "react-icons/pi";
import TablaDatosPagos from "./BlockPagos/TablaDatosPagos";


type BlockPagosProps = {
  getId?: any;
  setGetId?: any;
  cate?: any;
  estado?: any;
};

const BlockPagos = ({ getId, setGetId, cate, estado }: BlockPagosProps) => {
  const [active, setActive] = useState(0);
  const [showSoporte, setShowSoporte] = useState<{ state: boolean; data: any }>({ state: false, data: null })
  const TablaDatosPagosAny = TablaDatosPagos as any;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-lg relative mx-auto inset-x-0    "
    >
      <div className="bg-white p-6 h-max shadow-md rounded-xl    ">
        <TablaDatosPagosAny
          active={active}
          estado={estado}
          getId={getId}
          setGetId={setGetId}
          cate={cate}
          showSoporte={showSoporte}
          setShowSoporte={setShowSoporte}
        />
      </div>
      {
        showSoporte.state &&
        <Modal set={setShowSoporte} state={showSoporte.state} classe={"w-[95%] md:w-[450px] max-h-[600px] min-h-[100px] flex items-center justify-center"}>
          <div className="flex flex-col items-center h-full w-full relative">
            <div className="absolute right-3 top-2 cursor-pointer" onClick={() => setShowSoporte({ state: false, data: null })}>
              <PiXBold className="w-5 h-5" />
            </div>
            <div className="h-full flex items-center ">
              <img src={showSoporte?.data} alt="Factura de soporte" className="h-[90%] " />
            </div>
          </div>
        </Modal>
      }
    </motion.div>
  );
};

export default BlockPagos;
