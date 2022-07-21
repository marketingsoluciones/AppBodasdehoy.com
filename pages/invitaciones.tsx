import { forwardRef, useContext, useEffect, useMemo, useRef, useState, } from "react";
import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import { CompartirIcon, InvitacionesIcon, SubirImagenIcon2, } from "../components/icons";
import BlockTitle from "../components/Utils/BlockTitle";
import useHover from "../hooks/useHover";
import { Swiper, SwiperSlide } from "swiper/react";
import ModuloSubida from "../components/Invitaciones/ModuloSubida";
import { motion } from "framer-motion";
import { EventContextProvider } from "../context";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { api } from "../api";
import Banner from "../components/Invitaciones/Banner";
import Test from '../components/Invitaciones/Test'
import VistaPrevia from "../components/Invitaciones/VistaPrevia";
import { CounterInvitations } from "../components/Invitaciones/CounterInvitations";
import { ConfirmationBlock } from "../components/Invitaciones/ConfirmationBlock";
import { DataTable } from "../components/Invitaciones/DataTable";
import { GuestTable } from "../components/Invitaciones/GuestTable";
import { Separator } from "../components/Separator";
import { DataTableGroupProvider } from "../context/DataTableGroupContext";


const Invitaciones = () => {
  const [hoverRef, isHovered] = useHover();
  const { event } = EventContextProvider();
  const [dataInvitationSent, setDataInvitationSent] = useState([]);
  const [dataInvitationNotSent, setDataInvitationNotSent] = useState([]);

  useEffect(() => {
    const reduce = event?.invitados_array?.reduce((acc: any, item: any) => {
      const asd = {
        _id: item._id,
        nombre: item.nombre,
        correo: item.correo,
        sexo: item.sexo,
        invitacion: item.invitacion,
      }
      item.invitacion ? acc.sent.push(asd) : acc.notSent.push(asd);
      return acc;
    }, { sent: [], notSent: [] })
    reduce.sent.length != dataInvitationSent.length && setDataInvitationSent(reduce.sent);
    reduce.notSent.length != dataInvitationNotSent.length && setDataInvitationNotSent(reduce.notSent);
  }, [event, dataInvitationSent, dataInvitationNotSent]);

  return (
    <DataTableGroupProvider>

      <section className="bg-base w-full pb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 gap-4"
        >

          <Breadcumbs />{/*volver a resumen */}

          <BlockTitle title="Invitaciones" />

          <div className="w-full flex-col flex md:flex-row my-6 gap-6 relative">
            { /*error de http://96.126.110.203:3001/false*/}
            <div ref={hoverRef} className="relative w-full h-96 md:w-1/3 ">
              <div className={`hidden md:block h-40 bg-secondary w-20 rounded-xl  absolute z-0 left-0 top-0 bottom-0 m-auto transform transition duration-400 ${isHovered && "-translate-x-1/2"} `}>
                <div className="w-1/2 text-white flex flex-col items-center justify-center h-full gap-4">
                  <CompartirIcon />
                  <SubirImagenIcon2 />
                </div>
              </div>
              <ModuloSubida evento={event} use={"imgInvitacion"} />
            </div>

            <div className="w-full md:w-2/3 gap-6 h-full relative flex-col flex justify-end">
              <CounterInvitations />
              <Test />
            </div>

          </div>

          {event?.invitados_array?.length > 0 && (
            <div>
              <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                <Separator title="Invitaciones pendientes" />
                {/*dataInvitationNotSent &&*/ <GuestTable data={dataInvitationNotSent} multiSeled={true} />}
              </div>
              <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                <Separator title="Invitaciones enviadas" />
                {/*dataInvitationSent &&*/ <GuestTable data={dataInvitationSent} multiSeled={false} />}
              </div>
            </div>
          )}

          { /*error de http://96.126.110.203:3001/%7B%7Bparams.imgUrl%7D%7D */}
          {/*<VistaPrevia evento={event} />*/}

          <h2 className="font-display font-semibold text-2xl text-gray-500 p-4">
            Diseña tu invitación
          </h2>
          <div className="w-full rounded-xl bg-secondary shadow-lg py-3 mb-10 px-6">
            <p className=" font-display">
              Encuentra a un diseñador para tu invitación
            </p>
          </div>
          <Banner />
        </motion.div>
        <style jsx>
          {`
          section {
            min-height: calc(100vh - 9rem);
          }
        `}
        </style>
      </section>
    </DataTableGroupProvider>
  );
};

export default Invitaciones;







/*const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = useRef();
  const resolvedRef = ref || defaultRef;

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <>
      <input type="checkbox" ref={resolvedRef} {...rest} />
    </>
  );
});
*/


