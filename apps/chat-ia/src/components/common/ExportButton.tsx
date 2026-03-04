'use client';

import { Button } from 'antd';
import { Download } from 'lucide-react';
import { memo } from 'react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers?: string[];
  onExport?: () => void;
}

const ExportButton = memo<ExportButtonProps>(({ data, filename, headers, onExport }) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Exportación genérica a CSV
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Determinar headers si no se proporcionan
    const csvHeaders = headers || Object.keys(data[0]);

    // Crear filas
    const rows = data.map((item) => csvHeaders.map((header) => item[header] || ''));

    // Crear contenido CSV
    const csvContent = [csvHeaders, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Button icon={<Download size={16} />} onClick={handleExport} type="primary">
      Exportar CSV
    </Button>
  );
});

ExportButton.displayName = 'ExportButton';

export default ExportButton;
