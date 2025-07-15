import React from 'react';
import ResumenFinanciero from './ResumenFinanciero';
import TabsNavegacion from './TabsNavegacion';
import BotonRegistrarDeposito from './BotonRegistrarDeposito';
import PagosDirectosNovia from './PagosDirectosNovia';
import PagosAdministradosWP from './PagosAdministradosWP';
import BotonesReporte from './BotonesReporte';

const TableroPresupuestoMain = () => {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header con resumen financiero */}
      <ResumenFinanciero />

      {/* Tabs de navegación */}
      <TabsNavegacion />

      {/* Botón de registrar depósito */}
      <div className="mb-4">
        <BotonRegistrarDeposito />
      </div>

      {/* Sección de pagos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PagosDirectosNovia />
        <PagosAdministradosWP />
      </div>

      {/* Botones de reporte */}
      <BotonesReporte />
    </div>
  );
};

export default TableroPresupuestoMain; 