//@ts-check
import { motion } from "framer-motion"
import BlockInvitaciones from "../components/Resumen/BlockInvitaciones";
import BlockInvitados from "../components/Resumen/BlockInvitados";
import BlockListaRegalos from "../components/Resumen/BlockListaRegalos";
import BlockMesas from "../components/Resumen/BlockMesas";
import BlockPresupuesto from "../components/Resumen/BlockPresupuesto";
import BlockPrincipal from "../components/Resumen/BlockPrincipal";
import BlockSobreMiEvento from "../components/Resumen/BlockSobreMiEvento";
import { EventContextProvider } from "../context";
import { SkeletonPage } from "../components/Utils/SkeletonPage";
import EventLoadingOrError from "../components/Utils/EventLoadingOrError";
import { useMounted } from "../hooks/useMounted"
import { BlockItinerario } from "../components/Resumen/BlockItinerario";
import { BlockLugarEvento } from "../components/Resumen/BlockLugarEvento";
import { BlockMomentos } from "../components/Resumen/BlockMomentos";
import { ModuleErrorBoundary } from "../components/ErrorBoundary";
import CopilotFilterBar from "../components/Utils/CopilotFilterBar";

const Resumen = () => {
  const { event } = EventContextProvider()
  useMounted()

  if (!event) return <EventLoadingOrError skeletonRows={6} />
  return (
    <>
      <section className="bg-base w-full md:py-10 px-2 md:px-0">
        <motion.div initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex gap-8 pb-20">
          <CopilotFilterBar entity={["events", "guests", "tables", "services", "moments", "budget_items"]} />
          <ModuleErrorBoundary label="Resumen principal">
            <BlockPrincipal />
          </ModuleErrorBoundary>
          <div className="w-full grid md:grid-cols-2 gap-4 md:gap-8">
            <ModuleErrorBoundary label="Itinerario"><BlockItinerario /></ModuleErrorBoundary>
            <ModuleErrorBoundary label="Lugar del evento"><BlockLugarEvento /></ModuleErrorBoundary>
          </div>
          <div className="w-full flex md:flex-row flex-col justify-center gap-4 md:gap-8 items-stretch">
            <ModuleErrorBoundary label="Presupuesto"><BlockPresupuesto /></ModuleErrorBoundary>
            <ModuleErrorBoundary label="Invitados"><BlockInvitados /></ModuleErrorBoundary>
          </div>
          <ModuleErrorBoundary label="Invitaciones">
            <BlockInvitaciones />
          </ModuleErrorBoundary>
          <div className="w-full flex-col flex md:flex-row justify-center gap-8 ">
            <ModuleErrorBoundary label="Mesas"><BlockMesas /></ModuleErrorBoundary>
            <ModuleErrorBoundary label="Lista de regalos"><BlockListaRegalos /></ModuleErrorBoundary>
          </div>
          <ModuleErrorBoundary label="Momentos">
            <BlockMomentos />
          </ModuleErrorBoundary>
          <ModuleErrorBoundary label="Sobre mi evento">
            <BlockSobreMiEvento />
          </ModuleErrorBoundary>
        </motion.div>
      </section>
    </>
  );
};

export default Resumen;
