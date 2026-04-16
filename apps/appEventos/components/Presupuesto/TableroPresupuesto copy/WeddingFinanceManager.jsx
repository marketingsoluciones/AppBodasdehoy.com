import React, { useState } from "react";
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

const WeddingFinanceManager = () => {
  const event = EventContextProvider();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fondosRecibidos, setFondosRecibidos] = useState(25000);
  const [fondosDisponibles, setFondosDisponibles] = useState(12500);
  console.log(event);

  // Datos de ejemplo - estos vendrían de tu backend/estado global
  const [pagosDirectos] = useState([
    {
      id: 1,
      proveedor: "Vestido de Novia - Boutique Elegance",
      monto: 3500,
      fecha: "2025-05-15",
      estado: "pagado",
      categoria: "Vestuario",
      notas: "Incluye ajustes",
    },
    {
      id: 2,
      proveedor: "Anillos - Joyería Diamante",
      monto: 2800,
      fecha: "2025-05-20",
      estado: "pagado",
      categoria: "Joyería",
      notas: "Grabado incluido",
    },
    {
      id: 3,
      proveedor: "Luna de Miel - Viajes Paradise",
      monto: 4200,
      fecha: "2025-06-01",
      estado: "pendiente",
      categoria: "Viajes",
      notas: "Cancún 7 noches",
    },
    {
      id: 4,
      proveedor: "Zapatos y Accesorios",
      monto: 850,
      fecha: "2025-05-25",
      estado: "pendiente",
      categoria: "Vestuario",
      notas: "",
    },
  ]);

  const [pagosWP] = useState([
    {
      id: 1,
      proveedor: "Salón de Eventos - Hacienda Real",
      monto: 8000,
      fecha: "2025-05-10",
      estado: "pagado",
      categoria: "Locación",
      notas: "300 invitados",
      contacto: "Carlos Ruiz - 555-0123",
    },
    {
      id: 2,
      proveedor: "Catering - Sabores Gourmet",
      monto: 4500,
      fecha: "2025-05-25",
      estado: "parcial",
      pagado: 2000,
      categoria: "Alimentos",
      notas: "Menú 3 tiempos",
      contacto: "Chef María - 555-0124",
    },
    {
      id: 3,
      proveedor: "Decoración - Arte Floral",
      monto: 3000,
      fecha: "2025-06-05",
      estado: "pendiente",
      categoria: "Decoración",
      notas: "Tema: Jardín romántico",
      contacto: "Laura Flores - 555-0125",
    },
  ]);

  const [deposits] = useState([
    {
      id: 1,
      fecha: "2025-04-01",
      monto: 10000,
      metodo: "Transferencia",
      referencia: "TRF-001",
    },
    {
      id: 2,
      fecha: "2025-04-15",
      monto: 8000,
      metodo: "Cheque",
      referencia: "CHQ-2341",
    },
    {
      id: 3,
      fecha: "2025-05-01",
      monto: 7000,
      metodo: "Transferencia",
      referencia: "TRF-002",
    },
  ]);

  // Cálculos
  const calcularTotalPagosDirectos = () =>
    pagosDirectos.reduce((total, pago) => total + pago.monto, 0);
  const calcularTotalPagosWP = () =>
    pagosWP.reduce((total, pago) => total + pago.monto, 0);
  const calcularPagadoWP = () =>
    pagosWP.reduce((total, pago) => {
      if (pago.estado === "pagado") return total + pago.monto;
      if (pago.estado === "parcial") return total + (pago.pagado || 0);
      return total;
    }, 0);

  const calcularCategorias = () => {
    const categorias = {};
    [...pagosDirectos, ...pagosWP].forEach((pago) => {
      if (!categorias[pago.categoria]) categorias[pago.categoria] = 0;
      categorias[pago.categoria] += pago.monto;
    });
    return categorias;
  };

  // Handlers
  const handleDepositSubmit = (amount) => {
    setFondosRecibidos((prev) => prev + amount);
    setFondosDisponibles((prev) => prev + amount);
    // Aquí agregarías el depósito al historial
  };

  const handleNotificationClick = () => {
    console.log("Notificaciones clickeadas");
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
          totalComprometido={calcularTotalPagosWP()}
          pagosDirectos={calcularTotalPagosDirectos()}
          presupuestoTotal={event?.event?.presupuesto_objeto?.coste_final}
          numeroProveedores={pagosWP.length}
          numeroTransacciones={pagosDirectos.length}
        />

        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "dashboard" && (
          <>
            <DepositFormSection onDepositSubmit={handleDepositSubmit} />

            <div className="grid grid-cols-2 gap-4">
              <PaymentsList
                title="Pagos Directos de la Novia"
                payments={pagosDirectos}
                icon={CreditCard}
                iconColor="text-purple-600"
                total={calcularTotalPagosDirectos()}
                type="directo"
                onAddPayment={() => console.log("Agregar pago directo")}
              />

              <PaymentsList
                title="Pagos Administrados por WP"
                payments={pagosWP}
                icon={Store}
                iconColor="text-blue-600"
                total={calcularTotalPagosWP()}
                paidAmount={calcularPagadoWP()}
                type="wp"
                onAddPayment={() => console.log("Agregar proveedor")}
                onViewDetails={(payment) =>
                  console.log("Ver detalles", payment)
                }
                onMakePayment={(payment) => console.log("Hacer pago", payment)}
              />
            </div>

            <FinancialSummary
              presupuestoTotal={
                calcularTotalPagosDirectos() + calcularTotalPagosWP()
              }
              totalPagado={
                pagosDirectos
                  .filter((p) => p.estado === "pagado")
                  .reduce((t, p) => t + p.monto, 0) + calcularPagadoWP()
              }
              porPagarDirectos={pagosDirectos
                .filter((p) => p.estado === "pendiente")
                .reduce((t, p) => t + p.monto, 0)}
              porPagarWP={calcularTotalPagosWP() - calcularPagadoWP()}
              categorias={
                /* calcularCategorias() */ event?.event?.presupuesto_objeto
                  ?.categorias_array
              }
              onGenerateReport={() => console.log("Generar reporte")}
              onExportExcel={() => console.log("Exportar Excel")}
              currency={event?.event?.presupuesto_objeto?.currency}
            />
          </>
        )}

        {activeTab === "depositos" && (
          <DepositsHistory
            deposits={deposits}
            onViewDeposit={(deposit) => console.log("Ver depósito", deposit)}
            onPrintDeposit={(deposit) =>
              console.log("Imprimir depósito", deposit)
            }
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
    </div>
  );
};

export default WeddingFinanceManager;
