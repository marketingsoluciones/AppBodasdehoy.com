import React, { useEffect, useState } from "react";
import { CreditCard, Store } from "lucide-react";
import WeddingHeader from "./WeddingHeader";
import SummaryCards from "./SummaryCards";
import NavigationTabs from "./NavigationTabs";
import DepositFormSection from "./DepositFormSection";
import PaymentsList from "./PaymentsList";
import FinancialSummary from "./FinancialSummary";
import DepositsHistory from "./DepositsHistory";
import ReportsSection from "./ReportsSection";
import { EventContextProvider } from "../../../context";
import { Modal } from "../../Utils/Modal";
import { PiXBold } from "react-icons/pi";

const WeddingFinanceManager = () => {
  const event = EventContextProvider();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fondosRecibidos, setFondosRecibidos] = useState();
  const [fondosDisponibles, setFondosDisponibles] = useState(12500);
  const [showPaymentDetails, setShowPaymentDetails] = useState({
    state: false,
    data: null,
  });

  const data = event?.event?.presupuesto_objeto?.categorias_array?.reduce(
    (acc, categoria) => {
      if (categoria?.gastos_array?.length >= 1) {
        const reduce = categoria?.gastos_array?.reduce((arr, gasto) => {
          if (gasto?.pagos_array?.length >= 1) {
            const reducePagos = gasto?.pagos_array?.reduce((arrPagos, pago) => {
              const objetoNuevo = {
                ...pago,
                idCategoria: categoria?._id,
                nombreCategoria: categoria?.nombre,
                idGasto: gasto?._id,
                nombreGasto: gasto?.nombre,
              };
              arrPagos?.push(objetoNuevo);
              return arrPagos;
            }, []);
            arr = [...arr, ...reducePagos];
          }
          return arr;
        }, []);
        if (reduce.length >= 1) {
          acc = [...acc, ...reduce];
        }
      }
      return acc;
    },
    []
  );
  const dataFilter = data.filter((elemnt) => elemnt.estado == "pagado");

  const pagosWeddingPlanner = dataFilter.filter(
    (pago) => pago.pagado_por === "wedding planer"
  );

  const pagosOtros = dataFilter.filter(
    (pago) => pago.pagado_por !== "wedding planer"
  );

  const totalPagosWP = pagosWeddingPlanner.reduce(
    (total, pago) => total + (parseFloat(pago.importe) || 0),
    0
  );

  const totalPagosOtros = pagosOtros.reduce(
    (total, pago) => total + (parseFloat(pago.importe) || 0),
    0
  );


  useEffect(() => {
    if (event?.event?.presupuesto_objeto?.weddingPlannerIngresos) {
      const total = event.event.presupuesto_objeto.weddingPlannerIngresos.reduce(
        (acc, ingreso) => acc + ingreso.monto, 
        0
      );
      setFondosRecibidos(total);
    }
  }, [event?.event?.presupuesto_objeto?.weddingPlannerIngresos]);

  useEffect(() => {
    setFondosDisponibles(fondosRecibidos - totalPagosWP);
  }, [fondosRecibidos, totalPagosWP]);

  const handleDepositSubmit = (amount) => {
    setFondosRecibidos((prev) => prev + amount);
    setFondosDisponibles((prev) => prev + amount);
  };

  const handleNotificationClick = () => {
    console.log("Notificaciones clickeadas");
  };

  const handleViewPaymentDetails = (payment) => {
    setShowPaymentDetails({ state: true, data: payment.soporte });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <WeddingHeader
        clientName={event?.event?.nombre}
        weddingDate={event?.event?.fecha}
        type={event?.event?.tipo}
        plannerName="Ana Martínez"
        notifications={1}
        onNotificationClick={handleNotificationClick}
      />

      <div className="max-w-screen-xl mx-auto px-3 py-3">
        <SummaryCards
          fondosRecibidos={fondosRecibidos}
          fondosDisponibles={fondosDisponibles}
          totalComprometido={totalPagosWP}
          pagosDirectos={totalPagosOtros}
          presupuestoTotal={event?.event?.presupuesto_objeto?.coste_final}
          numeroProveedores={pagosWeddingPlanner.length}
          numeroTransacciones={pagosOtros.length}
          currency={event?.event?.presupuesto_objeto?.currency}
        />
        <DepositFormSection onDepositSubmit={handleDepositSubmit} />

        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <PaymentsList
                title="Pagos Directos"
                payments={pagosOtros}
                icon={CreditCard}
                iconColor="text-purple-600"
                total={totalPagosOtros}
                type="directo"
                categorias={event?.event?.presupuesto_objeto?.categorias_array}
                onViewDetails={(payment) => handleViewPaymentDetails(payment)}
                currency={event?.event?.presupuesto_objeto?.currency}
              />

              <PaymentsList
                title="Pagos por WP"
                payments={pagosWeddingPlanner}
                icon={Store}
                iconColor="text-blue-600"
                total={totalPagosWP}
                type="wp"
                onViewDetails={(payment) => handleViewPaymentDetails(payment)}
                onMakePayment={(payment) => console.log("Hacer pago", payment)}
                categorias={event?.event?.presupuesto_objeto?.categorias_array}
                currency={event?.event?.presupuesto_objeto?.currency}
              />
            </div>

            <FinancialSummary
              presupuestoTotal={event?.event?.presupuesto_objeto?.coste_final}
              totalPagado={event?.event?.presupuesto_objeto?.pagado}
              PagadoPorOtros={totalPagosOtros}
              PagadoPorWP={totalPagosWP}
              categorias={event?.event?.presupuesto_objeto?.categorias_array}
              onGenerateReport={() => console.log("Generar reporte")}
              onExportExcel={() => console.log("Exportar Excel")}
              currency={event?.event?.presupuesto_objeto?.currency}
            />
          </>
        )}

        {activeTab === "depositos" && (
          <DepositsHistory
            deposits={event?.event?.presupuesto_objeto?.weddingPlannerIngresos}
            onViewDeposit={(deposit) => console.log("Ver depósito", deposit)}
            onPrintDeposit={(deposit) =>
              console.log("Imprimir depósito", deposit)
            }
            currency={event?.event?.presupuesto_objeto?.currency}
          />
        )}

        {activeTab === "reportes" && (
          <ReportsSection
            onReportClick={(reportId) =>
              console.log("Reporte seleccionado:", reportId)
            }
          />
        )}
      </div>

      {/* Modal de Detalles del Pago */}
      {showPaymentDetails.state && (
        <Modal
          set={setShowPaymentDetails}
          state={showPaymentDetails.state}
          classe={
            "w-[95%] md:w-[600px] max-h-[700px] min-h-[200px] flex items-center justify-center"
          }
        >
          {showPaymentDetails.data && (
            <div className="flex flex-col items-center h-full w-full relative">
              <div
                className="absolute right-3 top-2 cursor-pointer"
                onClick={() => setShowPaymentDetails({ state: false })}
              >
                <PiXBold className="w-5 h-5" />
              </div>
              <div className="h-full flex items-center ">
                <img
                  src={showPaymentDetails.data.image_url}
                  alt="Factura de soporte"
                  className="h-[90%] "
                />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default WeddingFinanceManager;
