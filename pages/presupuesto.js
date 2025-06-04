import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { DineroIcon } from "../components/icons";
import BlockPagos from "../components/Presupuesto/BlockPagos";
import Grafico from "../components/Presupuesto/Grafico";
import { AuthContextProvider, EventContextProvider } from "../context";
import { getCurrency } from "../utils/Funciones";
import VistaSinCookie from "./vista-sin-cookie";
import BlockTitle from "../components/Utils/BlockTitle";
import { useMounted } from "../hooks/useMounted"
import { useTranslation } from 'react-i18next';
import { ExcelView } from "../components/Presupuesto/ExcelView";
import { BlockListaCategorias } from "../components/Presupuesto/BlockListaCategorias";
import { MontoPresupuesto } from "../components/Presupuesto/MontoPresupuesto";
import BlockCategoria from "../components/Presupuesto/BlockCategoria";
import { DuplicatePresupuesto } from "../components/Presupuesto/DuplicatePesupuesto";
import { api } from "../api";
import { useAllowed } from "../hooks/useAllowed";
import { ResumenPresupuestoModal } from "../components/Presupuesto/ResumenPresupuestoModal"

const Presupuesto = () => {
  useMounted()
  const { t } = useTranslation();
  const { user, verificationDone, forCms } = AuthContextProvider()
  const [showCategoria, setShowCategoria] = useState({ state: false, _id: "" });
  const [active, setActive] = useState("resumen");
  const { event } = EventContextProvider();
  const [categorias, setCategorias] = useState([]);
  const [getId, setGetId] = useState()
  const [showModalDuplicate, setShowModalDuplicate] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const [showModalPresupuesto, setShowModalPresupuesto] = useState(false)

  const totalCosteFinal = categorias?.reduce((sum, categoria) => {
    return sum + (categoria.coste_final || 0);
  }, 0);

  useEffect(() => {
    setCategorias(event?.presupuesto_objeto?.categorias_array)
  }, [event])


  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <>
        {event &&
          <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4 " : "bg-base w-full pb-6 pt-2 md:py-0 h-full"}>
            {showModalDuplicate && (
              <div className={"absolute z-50 flex justify-center w-full"} >
                <DuplicatePresupuesto showModalDuplicate={showModalDuplicate} setModal={setShowModalDuplicate} />
              </div>
            )}
            {
              showModalPresupuesto && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
                  <div className="bg-white w-[90%] h-[90%] rounded-lg overflow-auto shadow-lg relative">
                    <button
                      onClick={() => setShowModalPresupuesto(false)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                    >
                      ✕
                    </button>
                    <ResumenPresupuestoModal categorias={categorias} presupuesto={event.presupuesto_objeto} estimadoState={event?.presupuesto_objeto?.viewEstimates} />
                  </div>
                </div>
              )
            }
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${active === "excelView" ? "max-w-screen-[1920px]" : "max-w-screen-lg"} flex flex-col mx-auto inset-x-0 px-2 md:px-0 w-full h-full relative`}
            >

              <BlockTitle title={"Presupuesto"} />
              <div className="w-full flex justify-center my-2 mt-4 rounded-2xl text-xs md:text-sm">
                <div
                  onClick={() => setActive("resumen")}
                  className={`px-1 md:w-[150px]  ${active == "resumen" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full flex justify-center items-center cursor-pointer capitalize rounded-l-2xl `}
                >
                  <p >{t("budget")}</p>
                </div>

                <div
                  onClick={() => setActive("excelView")}
                  className={` w-[30%] md:w-[200px] ${active == "excelView" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full flex  justify-center items-center cursor-pointer capitalize `}
                >
                  <p >{t("budgetdetails")}</p>
                </div>

                <div
                  onClick={() => setActive("pagos")}
                  className={`w-[20%] md:w-[100px] py-1 ${active == "pagos" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full flex  justify-center items-center cursor-pointer capitalize `}
                >
                  <p >{t("payments")}</p>
                </div>

                <div
                  onClick={() => setActive("pendiente")}
                  className={` px-1 md:w-[180px] py-1  ${active == "pendiente" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full flex  justify-center items-center  cursor-pointer rounded-r-2xl`}
                >
                  <p>{t("pendingpayments")}</p>
                </div>

               {/*  <div className="relative">
                  <div className="absolute z-10 -right-40 -top-2 rounded-full overflow-hidden h-10">
                    <select disabled={!isAllowed()} value={event?.presupuesto_objeto?.currency} className={`border-none focus:ring-0 ${isAllowed() ? "cursor-pointer" : "cursor-default"} text-sm text-gray-700 h-10`} onChange={(e) => isAllowed() ? handleChangeS(e) : ht()}  >
                      <option value={"eur"}>EUR</option>
                      <option value={"usd"}>USD</option>
                      <option value={"ves"}>VES</option>
                      <option value={"mxn"}>MXN</option>
                      <option value={"cop"}>COL</option>
                      <option value={"ars"}>ARG</option>
                      <option value={"uyu"}>URU</option>
                    </select>
                  </div>
                </div> */}
              </div>

              <div className="w-full h-[calc(100vh-260px)]">
                {
                  active == "resumen" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col md:flex-row w-full h-full gap-6 pt-2 md:pr-0 "
                    >
                      <div className="w-full md:w-[310px]">
                        <BlockListaCategorias
                          setShowCategoria={setShowCategoria}
                          categorias_array={categorias}
                          showCategoria={showCategoria}
                        />
                      </div>
                      {showCategoria?.state
                        ? <BlockCategoria
                          setShowCategoria={setShowCategoria}
                          showCategoria={showCategoria}
                          setGetId={setGetId}
                        />
                        : <div className="w-full md:flex-1 h-full flex flex-col relative">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="w-full bg-white shadow-md rounded-xl flex py-4 px-2">
                              <MontoPresupuesto />
                            </div>
                            <div className=" bg-white shadow-md rounded-xl grid place-items-center py-4 px-2">
                              <DineroIcon className="w-12 h-12 text-primary " />
                              <p className="font-display text-gray-500 font-light text-md grid place-items-center">
                                {t("finalcost")} <br />
                                <span className="font-semibold text-lg text-center">
                                  {getCurrency(
                                    totalCosteFinal,
                                    event?.presupuesto_objeto?.currency
                                  )}
                                </span>
                              </p>
                              <div className=" w-full rounded-xl overflow-hidden flex my-2">
                                <div className="w-1/2 bg-primary py-1 px-3">
                                  <p className="text-xs font-display text-white">
                                    {t("paid")}
                                  </p>
                                  <p className="text-xs font-display text-white w-full text-right">
                                    {getCurrency(event?.presupuesto_objeto?.pagado)}
                                  </p>
                                </div>
                                <div className="w-1/2 bg-tertiary py-1 px-3">
                                  <p className="text-xs font-display text-primary">
                                    {t("payable")}
                                  </p>
                                  <p className="text-xs font-display text-white w-full text-right">
                                    {getCurrency(event?.presupuesto_objeto?.coste_final - event?.presupuesto_objeto?.pagado)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex  justify-between w-full text-sm">
                                <div onClick={() => isAllowed() ? setShowModalDuplicate(true) : ht()} className=" capitalize text-gray-500 cursor-pointer flex justify-center items-center  border  border-primary rounded-md px-3 text-xs text-primary">
                                  {t("import")}
                                </div>
                                <div className="  cursor-default flex justify-center items-center px-3 text-primary opacity-50 border rounded-md text-xs border-primary">
                                  {t("export")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col pt-2">
                            <h2 className="font-display pb-2 text-xl text-gray-500 font-semibold text-center w-full">
                              {t("howost")}
                            </h2>
                            <Grafico categorias={categorias} />
                          </div>
                        </div>}
                    </motion.div>
                  )
                }
                {
                  active == "pagos" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className=" w-full gap-6 pt-2 md:pr-0 pb-4 h-[100vh]"
                    >
                      <BlockPagos cate={showCategoria?._id} setGetId={setGetId} getId={getId} categorias_array={categorias} estado={"pagado"} />
                    </motion.div>
                  )
                }
                {
                  active == "pendiente" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className=" w-full gap-6 pt-2 md:pr-0 pb-4 h-[100vh]"
                    >
                      <BlockPagos cate={showCategoria?._id} setGetId={setGetId} getId={getId} categorias_array={categorias} estado={"pendiente"} />
                    </motion.div>
                  )
                }
                {
                  active == "excelView" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full gap-6 pt-2 md:pr-0"
                    >
                      <ExcelView setShowCategoria={setShowCategoria} categorias_array={categorias} showCategoria={showCategoria} />
                    </motion.div>
                  )
                }
              </div>
            </motion.div>
          </section >}
      </>
    );
  }
};

export default Presupuesto;
