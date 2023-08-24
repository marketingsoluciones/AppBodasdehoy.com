//@ts-check
import { motion } from "framer-motion"
import { useContext, useEffect, useState } from "react";
import BlockInvitaciones from "../components/Resumen/BlockInvitaciones";
import BlockInvitados from "../components/Resumen/BlockInvitados";
import BlockListaRegalos from "../components/Resumen/BlockListaRegalos";
import BlockMesas from "../components/Resumen/BlockMesas";
import BlockPresupuesto from "../components/Resumen/BlockPresupuesto";
import BlockPrincipal from "../components/Resumen/BlockPrincipal";
import BlockSobreMiEvento from "../components/Resumen/BlockSobreMiEvento";
import { EventContextProvider } from "../context";
import { useMounted } from "../hooks/useMounted"

const Resumen = () => {
  const { event } = EventContextProvider()

  useMounted()

  if (!event) return <></>
  return (
    <>
      <section className="bg-base w-full py-10 px-5 md:px-0">
        <motion.div initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex gap-10 pb-20">
          <BlockPrincipal />
          <div className="w-full flex justify-center gap-4 md:gap-8">
            <BlockPresupuesto />
            <BlockInvitados />
          </div>
          <BlockInvitaciones />
          <div className="w-full flex-col flex md:flex-row justify-center gap-8 ">
            <BlockMesas />
            <BlockListaRegalos />
          </div>
          <BlockSobreMiEvento />
          <span className="text-gray-500 text-xs gap-0">
            ID: {event?._id}
          </span>
        </motion.div>
      </section>
    </>
  );
  return <></>
};

export default Resumen;
