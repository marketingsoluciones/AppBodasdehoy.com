import React, { useState, useMemo } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { EventContextProvider } from "../../../context";
import { EditableLabelWithInput } from "../../Forms/EditableLabelWithInput";
import { EditableSelect } from "../../Forms/EditableSelect";
import { handleChange } from "../../TablesComponents/tableBudgetV8.handles";
import { getCurrency } from "../../../utils/Funciones";

export const SmartSpreadsheetView2 = () => {
  const { event, setEvent } = EventContextProvider();
  const [viewLevel, setViewLevel] = useState(2); // 1=Solo categorías, 2=Cat+Gastos, 3=Todo
  
  // Inicializar con todas las categorías expandidas por defecto
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const categorias = event?.presupuesto_objeto?.categorias_array || [];
    return new Set(categorias.map(cat => cat._id));
  });
  const [columnConfig, setColumnConfig] = useState({
    categoria: { visible: true, width: 200 },
    partida: { visible: true, width: 250 },
    items: { visible: true, width: 80 },
    estimado: { visible: true, width: 120 },
    total: { visible: true, width: 120 },
    pagado: { visible: true, width: 120 },
    pendiente: { visible: true, width: 120 },
    acciones: { visible: true, width: 100 }
  });

  // Usar los datos reales del evento
  const categorias_array = event?.presupuesto_objeto?.categorias_array || [];
  const currency = event?.presupuesto_objeto?.currency || 'eur';
  const totalStimatedGuests = event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 };

  // Función para formatear números con puntos y comas sin símbolo de moneda
  const formatNumber = (value) => {
    if (typeof value !== 'number') return value || 0;
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Actualizar categorías expandidas cuando cambien los datos
  React.useEffect(() => {
    if (categorias_array.length > 0) {
      setExpandedCategories(new Set(categorias_array.map(cat => cat._id)));
    }
  }, [categorias_array.length]);

  // Opciones para el select de unidades
  const optionsSelect = [
    { title: "xUni", value: "xUni." },
    { title: "xInv", value: "xInv." },
    { title: "xAdultos", value: "xAdultos." },
    { title: "xNiños", value: "xNiños." },
  ];

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Función para determinar si un gasto es editable (no tiene items)
  const isGastoEditable = (gasto) => {
    return !gasto.items_array || gasto.items_array.length === 0;
  };

  // Función para crear el objeto info para handleChange
  const createInfoObject = (row) => ({
    row: {
      original: {
        object: row.object,
        categoriaID: row.categoriaID,
        gastoID: row.gastoID,
        itemID: row.itemID,
        _id: row.type === 'category' ? row.categoriaID : row.type === 'expense' ? row.gastoID : row.itemID
      }
    }
  });

  // Renderizar celda de Categoría
  const renderCategoriaCell = (row) => {
    if (row.type === 'category' && row.categoria) {
      return (
        <EditableLabelWithInput
          accessor="categoria"
          handleChange={(values) => {
            const mockInfo = createInfoObject(row);
            handleChange({ values, info: mockInfo, event, setEvent });
          }}
          type={null}
          value={row.categoria}
          textAlign="left"
          isLabelDisabled
        />
      );
    }
    return row.categoria;
  };

  // Renderizar celda de Partida de Gasto
  const renderPartidaCell = (row) => {
    if (row.type === 'expense' && row.partida) {
      return (
        <div className="text-left">
          <EditableLabelWithInput
            accessor="gasto"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type={null}
            value={row.partida}
            textAlign="left"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-left block w-full">{row.partida}</span>;
  };

  // Renderizar celda de Unidad
  const renderUnidadCell = (row) => {
    if (row.type === 'item' && row.unidad) {
      return (
        <EditableSelect
          accessor="unidad"
          value={row.unidad}
          optionsSelect={optionsSelect}
          size={80}
          handleChange={(values) => {
            const mockInfo = createInfoObject(row);
            handleChange({ values, info: mockInfo, event, setEvent });
          }}
        />
      );
    }
    return row.unidad;
  };

  // Renderizar celda de Cantidad
  const renderCantidadCell = (row) => {
    if (row.type === 'item' && row.unidad === 'xUni.') {
      return (
        <div className="flex justify-center">
          <EditableLabelWithInput
            accessor="cantidad"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="int"
            value={row.cantidad}
            textAlign="center"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-center block w-full">{row.cantidad}</span>;
  };

  // Renderizar celda de Item
  const renderItemCell = (row) => {
    if (row.type === 'item' && row.item) {
      return (
        <div className="text-left">
          <EditableLabelWithInput
            accessor="nombre"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type={null}
            value={row.item}
            textAlign="left"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-left block w-full">{row.item}</span>;
  };

  // Renderizar celda de Valor Unitario
  const renderValorUnitarioCell = (row) => {
    if (row.type === 'item' && typeof row.valorUnitario === 'number') {
      return (
        <div className="flex justify-end">
          <EditableLabelWithInput
            accessor="valor_unitario"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="float"
            value={row.valorUnitario}
            textAlign="end"
            isLabelDisabled
          />
        </div>
      );
    } else if (row.type === 'item') {
      // Solo mostrar valor para items
      return (
        <span className="text-right block w-full pr-3">
          {formatNumber(row.valorUnitario)}
        </span>
      );
    }
    // Para categorías y gastos, no mostrar nada
    return '';
  };

  const tableData = useMemo(() => {
    const rows = [];
    
    categorias_array.forEach(categoria => {
      // Fila de categoría
      rows.push({
        type: 'category',
        id: categoria._id,
        categoria: categoria.nombre,
        partida: '',
        unidad: '',
        cantidad: '',
        item: '',
        valorUnitario: '',
        estimado: categoria.coste_estimado,
        total: categoria.coste_final,
        pagado: categoria.pagado,
        pendiente: categoria.coste_final - categoria.pagado,
        level: 0,
        expandable: true,
        expanded: expandedCategories.has(categoria._id),
        categoriaID: categoria._id,
        gastoID: null,
        itemID: null,
        object: 'categoria'
      });

      // Filas de gastos si está expandida
      if (expandedCategories.has(categoria._id) && viewLevel >= 2) {
        categoria.gastos_array.forEach(gasto => {
          rows.push({
            type: 'expense',
            id: gasto._id,
            categoria: '',
            partida: gasto.nombre,
            unidad: '',
            cantidad: '',
            item: '',
            valorUnitario: '',
            estimado: null,
            total: gasto.coste_final,
            pagado: gasto.pagado,
            pendiente: gasto.coste_final - gasto.pagado,
            level: 1,
            categoriaID: categoria._id,
            gastoID: gasto._id,
            itemID: null,
            object: 'gasto',
            gastoOriginal: gasto,
            isEditable: isGastoEditable(gasto)
          });

          // Items si está en nivel 3
          if (viewLevel >= 3 && gasto.items_array) {
            gasto.items_array.forEach(item => {
              const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                             item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                             item.cantidad;
              
              rows.push({
                type: 'item',
                id: item._id,
                categoria: '',
                partida: '',
                unidad: item.unidad,
                cantidad: cantidad,
                item: item.nombre,
                valorUnitario: item.valor_unitario,
                estimado: null,
                total: cantidad * item.valor_unitario,
                pagado: 0,
                pendiente: cantidad * item.valor_unitario,
                level: 2,
                categoriaID: categoria._id,
                gastoID: gasto._id,
                itemID: item._id,
                object: 'item'
              });
            });
          }
        });
      }
    });

    return rows;
  }, [viewLevel, expandedCategories, categorias_array, totalStimatedGuests]);

  const totals = useMemo(() => {
    return {
      estimado: categorias_array.reduce((acc, cat) => acc + (cat.coste_estimado || 0), 0),
      total: categorias_array.reduce((acc, cat) => acc + (cat.coste_final || 0), 0),
      pagado: categorias_array.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
    };
  }, [categorias_array]);

  // Renderizar la celda de Coste Total
  const renderCosteTotalCell = (row) => {
    if (row.type === 'expense' && row.isEditable) {
      // Gasto sin items - editable
      return (
        <div className="flex justify-end">
          <EditableLabelWithInput
            accessor="coste_final"
            handleChange={(values) => {
              const mockInfo = {
                row: {
                  original: {
                    object: row.object,
                    categoriaID: row.categoriaID,
                    gastoID: row.gastoID,
                    _id: row.gastoID
                  }
                }
              };
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="float"
            value={row.total}
            textAlign="end"
            isLabelDisabled
          />
        </div>
      );
    } else {
      // Categoría, gasto con items, o item - solo lectura
      return (
        <span className="text-right block w-full pr-3">
          {formatNumber(row.total)}
        </span>
      );
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header con controles */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Vista Inteligente</h2>
          
          {/* Control de nivel de detalle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Detalle:</span>
            <select 
              value={viewLevel} 
              onChange={(e) => setViewLevel(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={1}>Solo Categorías</option>
              <option value={2}>Categorías + Gastos</option>
              <option value={3}>Detalle Completo</option>
            </select>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="flex items-center gap-6 pr-10">
          <div className="text-center">
            <div className="text-xs text-gray-500">Estimado</div>
            <div className="font-semibold text-blue-600">{formatNumber(totals.estimado)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-800">{formatNumber(totals.total)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pagado</div>
            <div className="font-semibold text-green-600">{formatNumber(totals.pagado)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pendiente</div>
            <div className="font-semibold text-red-600">{formatNumber(totals.total - totals.pagado)}</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.categoria.width}}>
                Categoría
              </th>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.partida.width}}>
                Partida de Gasto
              </th>
              <th className="text-center p-3 font-medium text-gray-700 border-r" style={{width: 80}}>
                Unidad
              </th>
              <th className="text-center p-3 font-medium text-gray-700 border-r" style={{width: 80}}>
                Cantidad
              </th>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{width: 180}}>
                Item
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.estimado.width}}>
                Valor Unitario
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.total.width}}>
                Coste Total
              </th>
              {event?.presupuesto_objeto?.viewEstimates && (
                <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.estimado.width}}>
                  Coste Estimado
                </th>
              )}
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.pagado.width}}>
                Pagado
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.pendiente.width}}>
                Pendiente
              </th>
              <th className="text-center p-3 font-medium text-gray-700" style={{width: columnConfig.acciones.width}}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => {
              const bgColor = row.type === 'category' ? 'bg-blue-50' : 
                             row.type === 'expense' ? 'bg-gray-50' : 'bg-white';
              const textWeight = row.type === 'category' ? 'font-semibold' : 
                               row.type === 'expense' ? 'font-medium' : 'font-normal';
              const paddingLeft = `${row.level * 20 + 12}px`;

              return (
                <tr key={row.id} className={`${bgColor} border-b hover:bg-gray-100 transition-colors`}>
                  <td className="p-3 border-r" style={{paddingLeft}}>
                    <div className="flex items-center gap-2">
                      {row.expandable && (
                        <button 
                          onClick={() => toggleCategory(row.id)}
                          className="hover:bg-gray-200 p-1 rounded"
                        >
                          {row.expanded ? <IoIosArrowDown size={16} /> : <IoIosArrowForward size={16} />}
                        </button>
                      )}
                      <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'}`}>
                        {renderCategoriaCell(row)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 border-r text-left">
                    {renderPartidaCell(row)}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {renderUnidadCell(row)}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {renderCantidadCell(row)}
                  </td>
                  <td className="p-3 border-r text-left">
                    {renderItemCell(row)}
                  </td>
                  <td className="p-3 border-r text-right text-sm">
                    {renderValorUnitarioCell(row)}
                  </td>
                  <td className={`p-3 border-r ${textWeight}`}>
                    {renderCosteTotalCell(row)}
                  </td>
                  {event?.presupuesto_objeto?.viewEstimates && (
                    <td className="p-3 border-r text-right">
                      <span className="text-blue-600">
                        {formatNumber(row.estimado)}
                      </span>
                    </td>
                  )}
                  <td className="p-3 border-r text-right">
                    <span className="text-green-600">
                      {formatNumber(row.pagado)}
                    </span>
                  </td>
                  <td className="p-3 border-r text-right">
                    <span className="text-red-600">
                      {formatNumber(row.pendiente)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <IoSettingsOutline size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con información */}
      <div className="bg-gray-100 px-4 py-2 border-t flex justify-between items-center text-sm text-gray-600">
        <div>
          {tableData.filter(r => r.type === 'category').length} categorías, {' '}
          {tableData.filter(r => r.type === 'expense').length} partidas de gasto
          {viewLevel >= 3 && (
            <>, {tableData.filter(r => r.type === 'item').length} items detallados</>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Total: {formatNumber(totals.total)}</span>
          <span>|</span>
          <span>Pendiente: {formatNumber(totals.total - totals.pagado)}</span>
          <span>|</span>
          <span className="text-xs">
            Vista: {viewLevel === 1 ? 'Categorías' : viewLevel === 2 ? 'Cat + Gastos' : 'Completa'}
          </span>
        </div>
      </div>
    </div>
  );
};