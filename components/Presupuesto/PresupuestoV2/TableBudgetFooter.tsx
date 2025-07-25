import React from 'react';

interface FooterProps {
  getCurrency: (n: string) => string;
  getTotalFinal: () => number;
  getTotalPendiente: () => number;
  hasActiveFilters: () => string | boolean;
}

export const TableBudgetFooter: React.FC<FooterProps> = ({
  getCurrency,
  getTotalFinal,
  getTotalPendiente,
  hasActiveFilters
}) => (
  <div className="bg-gray-100 px-2 py-1.5 border-t flex justify-end items-center text-xs text-gray-600">
    <div className="flex items-center gap-3">
      <span>Total:
        {getCurrency(getTotalFinal().toString())}
      </span>
      <span>|</span>
      <span>Pendiente:
        {getCurrency(getTotalPendiente().toString())}
      </span>
      {hasActiveFilters() && (
        <>
          <span>|</span>
          <span className="text-blue-600">Filtros aplicados</span>
        </>
      )}
    </div>
  </div>
); 