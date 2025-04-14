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

const Presupuesto = () => {
  useMounted()
  const { t } = useTranslation();
  const { user, verificationDone, forCms } = AuthContextProvider()
  const [showCategoria, setShowCategoria] = useState({ state: false, _id: "" });
  const [active, setActive] = useState("resumen");
  const { event } = EventContextProvider();
  const [categorias, setCategorias] = useState([]);
  const [getId, setGetId] = useState()

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${active === "excelView" ? "max-w-screen-[1920px]" : "max-w-screen-lg"} flex flex-col mx-auto inset-x-0 px-2 md:px-0 w-full h-full relative`}
            >
              <BlockTitle title={"Presupuesto"} />
              <div className="w-[90%] md:w-96 mx-auto inset-x-0 flex my-2 mt-4 rounded-2xl overflow-hidden text-xs md:text-sm">
                <div
                  onClick={() => setActive("resumen")}
                  className={`w-[40%] md:w-[270px] py-1   ${active == "resumen" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full grid place-items-center font-display font-medium cursor-pointer hover:opacity-90 capitalize`}
                >
                  <p className="capitalize">{t("budget")}</p>
                </div>

                <div
                  onClick={() => setActive("excelView")}
                  className={` w-[40%] md:w-full py-1  ${active == "excelView" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full flex  justify-center items-center font-display font-medium cursor-pointer hover:opacity-90`}
                >
                  <p className="capitalize">{t("budgetdetails")}</p>
                </div>

                <div
                  onClick={() => setActive("pagos")}
                  className={`w-[25%] md:w-1/2 py-1 ${active == "pagos" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full grid place-items-center font-display font-medium cursor-pointer hover:opacity-90 border-x-2 capitalize`}
                >
                  <p className="capitalize">{t("payments")}</p>
                </div>

                {/* <div
                  onClick={() => setActive("futuro")}
                  className={` w-[40%] md:w-[320px] py-1  ${active == "futuro" ? "bg-primary text-white" : "bg-white text-primary"
                    } h-full grid place-items-center font-display font-medium cursor-pointer hover:opacity-90`}
                >
                  <p>{t("pendingpayments")}</p>
                </div> */}

              </div>
              <div className="w-full h-[calc(100vh-260px)]">

                {
                  active == "resumen" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col md:flex-row w-full h-full gap-6 pt-2 md:pr-0"
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
                            <div className=" bg-white shadow-md rounded-xl grid place-items-center p-4">
                              <MontoPresupuesto
                                estimado={
                                  event?.presupuesto_objeto?.coste_estimado
                                }
                              />
                            </div>
                            <div className=" bg-white shadow-md rounded-xl grid place-items-center p-4">
                              <DineroIcon className="w-12 h-12 text-primary " />
                              <p className="font-display text-gray-500 font-light text-md grid place-items-center">
                                {t("finalcost")} <br />
                                <span className="font-semibold text-lg text-center">
                                  {getCurrency(
                                    event?.presupuesto_objeto?.coste_final,
                                    event?.presupuesto_objeto?.currency
                                  )}
                                </span>
                              </p>
                              <div className=" w-full rounded-xl overflow-hidden flex my-2">
                                <div className="w-1/2 bg-primary py-1 px-3">
                                  <p className="text-xs font-display text-white">
                                    {t("paid")} {
                                      getCurrency(
                                        event?.presupuesto_objeto?.pagado,
                                        event?.presupuesto_objeto?.currency
                                      )
                                    }
                                  </p>
                                </div>
                                <div className="w-1/2 bg-tertiary py-1 px-3">
                                  <p className="text-xs font-display text-primary">
                                    {t("payable")} {getCurrency(event?.presupuesto_objeto?.coste_final - event?.presupuesto_objeto?.pagado, event?.presupuesto_objeto?.currency)}
                                  </p>
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
                      <BlockPagos cate={showCategoria?._id} setGetId={setGetId} getId={getId} categorias_array={categorias} /* estado={"pagado"} */ />
                    </motion.div>
                  )
                }
                {/* {
                active == "futuro" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className=" w-full gap-6 pt-2 md:pr-0 pb-4 h-[100vh]"
                  >
                    <BlockPagos cate={showCategoria?._id} setGetId={setGetId} getId={getId} categorias_array={categorias} estado={"pendiente"} />
                  </motion.div>
                )
              } */}
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
          </section>}
      </>
    );
  }
};

export default Presupuesto;
