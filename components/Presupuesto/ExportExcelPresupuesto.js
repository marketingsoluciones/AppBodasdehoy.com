import * as XLSX from 'xlsx';
import { getCurrency } from '../../utils/Funciones';
import { EventContextProvider } from '../../context';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import { BsDownload } from 'react-icons/bs';

const ExportExcelPresupuesto = ({ className = "" }) => {
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const toast = useToast();

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 0;
    return value;
  };

  const exportToExcel = () => {
    try {
      if (!event?.presupuesto_objeto) {
        toast("error", "No hay datos del presupuesto para exportar");
        return;
      }

      const presupuesto = event.presupuesto_objeto;
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Resumen General
      const resumenData = [
        ['RESUMEN DEL PRESUPUESTO'],
        [''],
        ['Evento:', event.nombre || 'Sin nombre'],
        ['Fecha:', event.fecha ? new Date(parseInt(event.fecha)).toLocaleDateString() : 'Sin fecha'],
        ['Tipo:', event.tipo || 'Sin tipo'],
        ['Moneda:', presupuesto.currency?.toUpperCase() || 'EUR'],
        [''],
        ['TOTALES GENERALES'],
        ['Presupuesto Total:', formatCurrency(presupuesto.presupuesto_total || 0)],
        ['Coste Estimado:', formatCurrency(presupuesto.coste_estimado || 0)],
        ['Coste Final:', formatCurrency(presupuesto.coste_final || 0)],
        ['Total Pagado:', formatCurrency(presupuesto.pagado || 0)],
        ['Pendiente por Pagar:', formatCurrency((presupuesto.coste_final || 0) - (presupuesto.pagado || 0))],
        [''],
        ['INVITADOS ESTIMADOS'],
        ['Adultos:', presupuesto.totalStimatedGuests?.adults || 0],
        ['Niños:', presupuesto.totalStimatedGuests?.children || 0],
        ['Total Invitados:', (presupuesto.totalStimatedGuests?.adults || 0) + (presupuesto.totalStimatedGuests?.children || 0)]
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

      // Hoja 2: Detalle Jerárquico Completo
      const detalleHeaders = [
        'Categoría', 'Partida de Gasto', 'Item', 'Cantidad', 
        'Valor Unitario', 'Coste Estimado', 'Coste Final'
      ];
      
      // Agregar encabezado del presupuesto en la parte superior
      const encabezadoData = [
        ['DETALLE COMPLETO DEL PRESUPUESTO'],
        [''],
        ['Evento:', event.nombre || 'Sin nombre'],
        ['Fecha:', event.fecha ? new Date(parseInt(event.fecha)).toLocaleDateString() : 'Sin fecha'],
        ['Moneda:', presupuesto.currency?.toUpperCase() || 'EUR'],
        [''],
        detalleHeaders
      ];
      
      const detalleData = [...encabezadoData];

      if (presupuesto.categorias_array && Array.isArray(presupuesto.categorias_array)) {
        presupuesto.categorias_array.forEach(categoria => {
          // Calcular totales de la categoría
          let totalCosteFinalCategoria = 0;

          // Primero calculamos los totales reales de la categoría
          if (categoria.gastos_array && Array.isArray(categoria.gastos_array)) {
            categoria.gastos_array.forEach(gasto => {
              if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
                // Si tiene items, calcular desde los items
                gasto.items_array.forEach(item => {
                  const cantidad = item.unidad === "xUni." 
                    ? item.cantidad 
                    : item.unidad === "xNiños." 
                      ? presupuesto.totalStimatedGuests?.children || 0
                      : item.unidad === "xAdultos." 
                        ? presupuesto.totalStimatedGuests?.adults || 0
                        : (presupuesto.totalStimatedGuests?.children || 0) + (presupuesto.totalStimatedGuests?.adults || 0);
                  
                  totalCosteFinalCategoria += cantidad * (item.valor_unitario || 0);
                });
              } else {
                // Si no tiene items, usar el coste del gasto directamente
                totalCosteFinalCategoria += gasto.coste_final || 0;
              }
            });
          }

          // Agregar fila de categoría
          detalleData.push([
            categoria.nombre || 'Sin nombre',
            '', '', '',
            '',
            formatCurrency(categoria.coste_estimado || 0),
            formatCurrency(totalCosteFinalCategoria)
          ]);

          // Procesar gastos de la categoría
          if (categoria.gastos_array && Array.isArray(categoria.gastos_array)) {
            categoria.gastos_array.forEach(gasto => {
              let totalCosteFinalGasto = 0;
              let hasItems = gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0;

              if (hasItems) {
                // Calcular total del gasto desde sus items
                gasto.items_array.forEach(item => {
                  const cantidad = item.unidad === "xUni." 
                    ? item.cantidad 
                    : item.unidad === "xNiños." 
                      ? presupuesto.totalStimatedGuests?.children || 0
                      : item.unidad === "xAdultos." 
                        ? presupuesto.totalStimatedGuests?.adults || 0
                        : (presupuesto.totalStimatedGuests?.children || 0) + (presupuesto.totalStimatedGuests?.adults || 0);
                  
                  totalCosteFinalGasto += cantidad * (item.valor_unitario || 0);
                });
              } else {
                totalCosteFinalGasto = gasto.coste_final || 0;
              }

              // Agregar fila de gasto
              detalleData.push([
                '',
                gasto.nombre || 'Sin nombre',
                '', '',
                '',
                formatCurrency(gasto.coste_estimado || 0),
                formatCurrency(totalCosteFinalGasto)
              ]);

              // Agregar items si existen
              if (hasItems) {
                gasto.items_array.forEach(item => {
                  const cantidad = item.unidad === "xUni." 
                    ? item.cantidad 
                    : item.unidad === "xNiños." 
                      ? presupuesto.totalStimatedGuests?.children || 0
                      : item.unidad === "xAdultos." 
                        ? presupuesto.totalStimatedGuests?.adults || 0
                        : (presupuesto.totalStimatedGuests?.children || 0) + (presupuesto.totalStimatedGuests?.adults || 0);
                  
                  const costeTotal = cantidad * (item.valor_unitario || 0);
                  
                  detalleData.push([
                    '',
                    '',
                    item.nombre || 'Sin nombre',
                    cantidad,
                    formatCurrency(item.valor_unitario || 0),
                    '', // Los items no tienen coste estimado
                    formatCurrency(costeTotal)
                  ]);
                });
              }
            });
          }
        });
      }

      const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);
      
      // Aplicar estilos y formato
      if (wsDetalle['!ref']) {
        const range = XLSX.utils.decode_range(wsDetalle['!ref']);
        
        // Definir estilos
        const borderStyle = {
          top: { style: 'medium', color: { rgb: '666666' } },
          bottom: { style: 'medium', color: { rgb: '666666' } },
          left: { style: 'medium', color: { rgb: '666666' } },
          right: { style: 'medium', color: { rgb: '666666' } }
        };

        const headerStyle = {
          font: { bold: true, color: { rgb: '000000' }, size: 11 },
          fill: { fgColor: { rgb: 'B3D9FF' } }, // Azul más intenso
          border: borderStyle,
          alignment: { horizontal: 'center', vertical: 'center' }
        };

        const categoriaStyle = {
          font: { bold: true, color: { rgb: '0D47A1' }, size: 11 },
          fill: { fgColor: { rgb: 'BBDEFB' } }, // Azul claro más visible
          border: borderStyle,
          alignment: { vertical: 'center' }
        };

        const gastoStyle = {
          font: { color: { rgb: '212121' }, size: 10 },
          fill: { fgColor: { rgb: 'E0E0E0' } }, // Gris más visible
          border: borderStyle,
          alignment: { vertical: 'center' }
        };

        const itemStyle = {
          font: { color: { rgb: '424242' }, size: 10 },
          fill: { fgColor: { rgb: 'F0F0F0' } }, // Gris claro más definido
          border: borderStyle,
          alignment: { vertical: 'center' }
        };

        const titleStyle = {
          font: { bold: true, size: 16, color: { rgb: '0D47A1' } },
          fill: { fgColor: { rgb: 'E3F2FD' } },
          border: {
            top: { style: 'thick', color: { rgb: '1976D2' } },
            bottom: { style: 'thick', color: { rgb: '1976D2' } },
            left: { style: 'thick', color: { rgb: '1976D2' } },
            right: { style: 'thick', color: { rgb: '1976D2' } }
          },
          alignment: { horizontal: 'center', vertical: 'center' }
        };

        const infoStyle = {
          font: { color: { rgb: '424242' }, size: 10 },
          fill: { fgColor: { rgb: 'F8F9FA' } },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          },
          alignment: { vertical: 'center' }
        };

        // Aplicar estilos fila por fila
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsDetalle[cellAddress]) wsDetalle[cellAddress] = {};
            
            // Título principal
            if (R === 0 && C === 0) {
              wsDetalle[cellAddress].s = titleStyle;
            }
            // Información del evento
            else if (R >= 2 && R <= 4) {
              wsDetalle[cellAddress].s = infoStyle;
            }
            // Headers de la tabla
            else if (R === 6) {
              wsDetalle[cellAddress].s = headerStyle;
            }
            // Filas de datos (después del header)
            else if (R > 6) {
              const cellCategoria = wsDetalle[XLSX.utils.encode_cell({ r: R, c: 0 })];
              const cellGasto = wsDetalle[XLSX.utils.encode_cell({ r: R, c: 1 })];
              const cellItem = wsDetalle[XLSX.utils.encode_cell({ r: R, c: 2 })];
              
              if (cellCategoria && cellCategoria.v && (!cellGasto || !cellGasto.v)) {
                // Es una fila de categoría
                wsDetalle[cellAddress].s = categoriaStyle;
              } else if (cellGasto && cellGasto.v && (!cellItem || !cellItem.v)) {
                // Es una fila de gasto
                wsDetalle[cellAddress].s = gastoStyle;
              } else if (cellItem && cellItem.v) {
                // Es una fila de item
                wsDetalle[cellAddress].s = itemStyle;
              } else {
                // Celda vacía con borde
                wsDetalle[cellAddress].s = { 
                  border: borderStyle,
                  fill: { fgColor: { rgb: 'FFFFFF' } }
                };
              }
            }
          }
        }

        // Configurar rangos combinados para el título
        wsDetalle['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título principal
        ];

        // Configurar altura de filas
        wsDetalle['!rows'] = [
          { hpt: 30 }, // Título
          { hpt: 12 }, // Espacio
          { hpt: 18 }, // Información
          { hpt: 18 }, // Información
          { hpt: 18 }, // Información
          { hpt: 12 }, // Espacio
          { hpt: 25 }, // Headers
        ];
      }
      
      XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle Completo');

      // Hoja 3: Pagos
      const pagosHeaders = ['Categoría', 'Gasto', 'Fecha', 'Importe', 'Estado', 'Método de Pago', 'Concepto'];
      const pagosData = [pagosHeaders];
      let hasPagos = false;

      if (presupuesto.categorias_array && Array.isArray(presupuesto.categorias_array)) {
        presupuesto.categorias_array.forEach(categoria => {
          if (categoria.gastos_array && Array.isArray(categoria.gastos_array)) {
            categoria.gastos_array.forEach(gasto => {
              if (gasto.pagos_array && Array.isArray(gasto.pagos_array) && gasto.pagos_array.length > 0) {
                hasPagos = true;
                gasto.pagos_array.forEach(pago => {
                  pagosData.push([
                    categoria.nombre || 'Sin categoría',
                    gasto.nombre || 'Sin gasto',
                    pago.fecha_pago || 'Sin fecha',
                    formatCurrency(pago.importe || 0),
                    pago.estado || 'Sin estado',
                    pago.medio_pago || 'Sin método',
                    pago.concepto || 'Sin concepto'
                  ]);
                });
              }
            });
          }
        });
      }

      if (hasPagos) {
        const wsPagos = XLSX.utils.aoa_to_sheet(pagosData);
        XLSX.utils.book_append_sheet(workbook, wsPagos, 'Pagos');
      }

      // Configurar estilos básicos para las hojas
      const sheets = ['Resumen', 'Detalle Completo'];
      if (hasPagos) sheets.push('Pagos');

      sheets.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        if (ws) {
          // Ajustar ancho de columnas
          const cols = [];
          if (sheetName === 'Resumen') {
            cols.push({ width: 25 }, { width: 20 });
          } else if (sheetName === 'Detalle Completo') {
            // Columnas para la hoja de detalle jerárquico con estilos
            cols.push(
              { width: 25 }, // Categoría
              { width: 30 }, // Partida de Gasto
              { width: 25 }, // Item
              { width: 12 }, // Cantidad
              { width: 18 }, // Valor Unitario
              { width: 18 }, // Coste Estimado
              { width: 18 }  // Coste Final
            );
          } else {
            // Para la hoja de pagos
            const headers = pagosHeaders;
            headers.forEach(() => cols.push({ width: 15 }));
          }
          ws['!cols'] = cols;
        }
      });

      // Generar y descargar el archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `presupuesto_${event.nombre || 'evento'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast("success", "Excel exportado correctamente");
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast("error", "Error al exportar el archivo Excel");
    }
  };

  return (
    <button
      onClick={exportToExcel}
      className={`capitalize text-gray-500 cursor-pointer flex justify-center items-center  border  border-primary rounded-md px-3 text-xs text-primary`}
      title="Exportar presupuesto a Excel"
    >
      
      {t("export")}
    </button>
  );
};

export default ExportExcelPresupuesto;