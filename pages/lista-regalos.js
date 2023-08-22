import { motion } from "framer-motion";
import { useState } from "react";
import { AmazonIcon, CochinoIcon, CompartirIcon, DineroIcon, ListaOne, ListaTwo } from "../components/icons";
import ModalGuardarRegalo from "../components/ListaDeRegalos/ModalGuardarRegalo";
import BlockTitle from "../components/Utils/BlockTitle";
import { AuthContextProvider, EventContextProvider } from "../context";
import VistaSinCookie from "./vista-sin-cookie";
import FormGuardarRegalos from "../components/Forms/FormGuardarRegalos"
import { useMounted } from "../hooks/useMounted"


const ListaRegalos = () => {
  const { event } = EventContextProvider()
  const { user, verificationDone } = AuthContextProvider()
  const [showForm, setShowForm] = useState(false)
  useMounted()

  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <>
        {showForm ? (
          <ModalGuardarRegalo set={setShowForm} state={showForm}>

            <FormGuardarRegalos
              set={setShowForm}
              state={showForm}
            />

          </ModalGuardarRegalo>
        ) : null}


        <section className="w-full bg-base pt-2 md:py-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-screen-lg mx-auto inset-x-0 flex-col gap-6 flex pb-28 md:pb-10">
            <BlockTitle title={"Lista de regalos"} />
            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-6 ">
              <div className="w-full md:w-1/2 bg-white shadow-lg flex gap-8 items-center justify-center p-6 rounded-xl">
                <DineroIcon className="w-12 h-12 text-gray-500" />
                <div className="font-display flex flex-col items-center">
                  <h3 className="text-lg text-primary font-medium">
                    Valor total
                  </h3>
                  <p className="text-2xl text-gray-500 font-semibold">0.00 Є</p>
                </div>
                <div className="font-display flex flex-col justify-center text-sm text-gray-500">
                  <p>Conseguido: 0.00 Є</p>
                  <p>Contribuciones: 0.00 Є</p>
                  <p>Pendiente: 0.00 Є</p>
                </div>
              </div>
              <div className="w-full md:w-1/2 bg-white shadow-lg flex gap-4 items-center justify-center p-6 rounded-xl">
                <CochinoIcon className="w-12 h-12 text-gray-500" />
                <div className="font-display flex flex-col items-start">
                  <h3 className="text-lg text-primary font-medium">
                    Saldo transferible
                  </h3>
                  <p className="text-2xl text-gray-500 font-semibold">0.00 Є</p>
                </div>
              </div>
            </div>
            <div className="w-full bg-white shadow-lg flex gap-4 items-center justify-center p-6 rounded-xl">
              <AmazonIcon className="w-28 h-28 text-primary" />
              <div className="font-display flex flex-col items-start">
                <h3 className="text-lg text-gray-300 font-medium leading-5">
                  Construye vuestra lista de regalos
                  <br />
                  <span className="text-sm">
                    con millones de opciones para elegir.
                  </span>
                </h3>
                <div className=" flex flex-col md:flex-row gap-4">
                  <a
                    href="https://www.amazon.com/-/es/registries/create-registry?ref_=gr_universal_landing"
                    className="button-secondary uppercase mt-2 text-sm"
                    target={"_blank"}
                    rel={"noopener noreferrer"}
                  >
                    Crea tu lista de regalos en amazon
                  </a >
                  <div className={`${event.listaRegalos ? "block mt-2.5" : "hidden"}`}>
                    <a
                      href={event.listaRegalos}
                      className={`button-secondary uppercase  text-sm`}
                      target={"_blank"}
                      rel={"noopener noreferrer"}
                    >
                      Tu lista de regalos
                    </a >
                  </div>
                </div>
              </div>
            </div>
            <h3 className="font-display text-xl text-gray-500 w-max inset-x-0 mx-auto pt-2 pb-2">
              ¿Como funciona la lista?
            </h3>
            <div className="w-full grid-cols-1 md:grid-cols-3 grid gap-6">
              {/* First Card */}
              <a
                className="bg-secondary rounded-xl shadow-lg col-span-1 flex justify-center flex-col items-center font-display h-max p-6 gap-4 hover:scale-105 transition duration-200 transform "
                href="https://www.amazon.com/-/es/registries/create-registry?ref_=gr_universal_landing"
                target={"_blank"}
                rel={"noopener noreferrer"}
              >
                <ListaOne />
                <h3 className="text-lg font-semibold text-primary text-center leading-4 flex flex-col gap-2 ">
                  Crea tu lista
                  <br />
                  <span className="font-semibold text-sm leading-4">
                    y elige tus regalos <br /> favoritos
                  </span>
                </h3>
              </a>
              {/* Second Card */}
              <buttom
                className="bg-primary rounded-xl shadow-lg col-span-1 flex justify-center flex-col items-center font-display h-max p-6 gap-4 hover:scale-105 transition duration-200 transform "
                state={showForm}
                set={setShowForm}
                onClick={() => setShowForm(!showForm)}
              >
                <CompartirIcon className="text-white w-10 h-10" />
                <h3 className="text-lg font-semibold text-white text-center leading-4 flex flex-col gap-2 ">
                  Compartela
                  <br />
                  <span className="font-normal text-sm leading-4">
                    con tus invitados para <br />que puedan participar
                  </span>
                </h3>
              </buttom>
              {/* Tertiary Card */}
              <div className="bg-tertiary rounded-xl shadow-lg col-span-1 flex justify-center flex-col items-center font-display h-max p-6 gap-4 hover:scale-105 transition duration-200 transform ">
                <ListaTwo />
                <h3 className="text-lg font-semibold text-gray-300 text-center leading-4 flex flex-col gap-2 ">
                  Transfiere el dinero
                  <br />
                  <span className="font-normal text-sm leading-4">
                    con tus invitados para que <br />puedan participar
                  </span>
                </h3>
              </div>
            </div>
          </motion.div>
        </section>
        <style jsx>
          {`
          section {
            min-height: calc(100vh - 9rem);
          }
        `}
        </style>
      </>
    );
  }
};

export default ListaRegalos;
