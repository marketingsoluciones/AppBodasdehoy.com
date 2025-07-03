import React from 'react';
import { TableTotals } from './types';

interface SmartSpreadsheetFooterProps {
  totals: TableTotals;
  formatNumber: (value: number) => string;
}

export const SmartSpreadsheetFooter: React.FC<SmartSpreadsheetFooterProps> = ({
  totals,
  formatNumber
}) => {
  return (
    <div className="bg-gray-100 px-3 pt-3 border-t flex flex-col sm:flex-row sm:justify-end items-center text-xs text-gray-600 gap-1 sm:gap-0 h-5">
      <div className="flex items-center gap-3">
        <span>Total: {formatNumber(totals.total)}</span>
        <span className="hidden sm:inline">|</span>
        <span>Pendiente: {formatNumber(totals.total - totals.pagado)}</span>
      </div>
    </div>
  );
};