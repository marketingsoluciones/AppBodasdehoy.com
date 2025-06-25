/*  import React, { useState, useMemo } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";


const mockData = {
  categorias_array: [
    {
      _id: "1",
      nombre: "Ceremonia",
      coste_estimado: 2041,
      coste_final: 2041,
      pagado: 301,
      gastos_array: [
        {
          _id: "1-1",
          nombre: "Mary florista iglesia",
          coste_final: 200,
          pagado: 0,
          estatus: true,
          items_array: [
            { _id: "1-1-1", nombre: "Ramo novia", cantidad: 1, valor_unitario: 100, unidad: "xUni" },
            { _id: "1-1-2", nombre: "Decoración altar", cantidad: 1, valor_unitario: 100, unidad: "xUni" }
          ]
        },
        {
          _id: "1-2", 
          nombre: "Coro de iglesia",
          coste_final: 1841,
          pagado: 301,
          estatus: true,
          items_array: [
            { _id: "1-2-1", nombre: "Servicio coro", cantidad: 1, valor_unitario: 1841, unidad: "xUni" }
          ]
        }
      ]
    },
    {
      _id: "2",
      nombre: "Catering",
      coste_estimado: 30000,
      coste_final: 30490,
      pagado: 30351,
      gastos_array: [
        {
          _id: "2-1",
          nombre: "Catering marina",
          coste_final: 30000,
          pagado: 30351,
          estatus: true,
          items_array: [
            { _id: "2-1-1", nombre: "Menú adultos", cantidad: 42, valor_unitario: 50, unidad: "xAdultos" },
            { _id: "2-1-2", nombre: "Menú niños", cantidad: 7, valor_unitario: 25, unidad: "xNiños" }
          ]
        }
      ]
    }
  ],
  presupuesto_objeto: {
    currency: "eur",
    totalStimatedGuests: { adults: 42, children: 7 }
  }
};

export const SmartSpreadsheetView2 = () => {
  const [viewLevel, setViewLevel] = useState(2); 
  const [expandedCategories, setExpandedCategories] = useState(new Set(['1', '2']));
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

  const getCurrency = (amount) => new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount || 0);

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const tableData = useMemo(() => {
    const rows = [];
    
    mockData.categorias_array.forEach(categoria => {
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
        expanded: expandedCategories.has(categoria._id)
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
            level: 1
          });

          // Items si está en nivel 3
          if (viewLevel >= 3 && gasto.items_array) {
            gasto.items_array.forEach(item => {
              const cantidad = item.unidad === 'xAdultos' ? mockData.presupuesto_objeto.totalStimatedGuests.adults :
                             item.unidad === 'xNiños' ? mockData.presupuesto_objeto.totalStimatedGuests.children :
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
                level: 2
              });
            });
          }
        });
      }
    });

    return rows;
  }, [viewLevel, expandedCategories]);

  const totals = useMemo(() => {
    return {
      estimado: mockData.categorias_array.reduce((acc, cat) => acc + cat.coste_estimado, 0),
      total: mockData.categorias_array.reduce((acc, cat) => acc + cat.coste_final, 0),
      pagado: mockData.categorias_array.reduce((acc, cat) => acc + cat.pagado, 0),
    };
  }, []);

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
 
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Vista Inteligente</h2>
          
         
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

    
        <div className="flex items-center gap-6 pr-10">
          <div className="text-center">
            <div className="text-xs text-gray-500">Estimado</div>
            <div className="font-semibold text-blue-600">{getCurrency(totals.estimado)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-800">{getCurrency(totals.total)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pagado</div>
            <div className="font-semibold text-green-600">{getCurrency(totals.pagado)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pendiente</div>
            <div className="font-semibold text-red-600">{getCurrency(totals.total - totals.pagado)}</div>
          </div>
        </div>
      </div>

     
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
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{width: columnConfig.estimado.width}}>
                Coste Estimado
              </th>
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
                          {row.expanded ? <IoIosArrowDown  size={16} /> : <IoIosArrowForward size={16} />}
                        </button>
                      )}
                      <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'}`}>
                        {row.categoria}
                      </span>
                    </div>
                  </td>
                  <td className={`p-3 border-r ${textWeight} text-gray-700`}>
                    {row.partida}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {row.unidad}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {row.cantidad}
                  </td>
                  <td className={`p-3 border-r ${textWeight} text-gray-700`}>
                    {row.item}
                  </td>
                  <td className="p-3 border-r text-right text-sm">
                    {row.valorUnitario ? getCurrency(row.valorUnitario) : ''}
                  </td>
                  <td className={`p-3 border-r text-right ${textWeight}`}>
                    {getCurrency(row.total)}
                  </td>
                  <td className="p-3 border-r text-right text-sm text-blue-600">
                    {row.estimado ? getCurrency(row.estimado) : ''}
                  </td>
                  <td className="p-3 border-r text-right text-green-600">
                    {getCurrency(row.pagado)}
                  </td>
                  <td className="p-3 border-r text-right text-red-600">
                    {getCurrency(row.pendiente)}
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

    
      <div className="bg-gray-100 px-4 py-2 border-t flex justify-between items-center text-sm text-gray-600">
        <div>
          {tableData.filter(r => r.type === 'category').length} categorías, {' '}
          {tableData.filter(r => r.type === 'expense').length} partidas de gasto
          {viewLevel >= 3 && (
            <>, {tableData.filter(r => r.type === 'item').length} items detallados</>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Total: {getCurrency(totals.total)}</span>
          <span>|</span>
          <span>Pendiente: {getCurrency(totals.total - totals.pagado)}</span>
          <span>|</span>
          <span className="text-xs">
            Vista: {viewLevel === 1 ? 'Categorías' : viewLevel === 2 ? 'Cat + Gastos' : 'Completa'}
          </span>
        </div>
      </div>
    </div>
  );
}; */