import React, { useState, useMemo } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { EditableLabelWithInput } from '../../Forms/EditableLabelWithInput';
import { EditableSelect } from '../../Forms/EditableSelect';
import { getCurrency } from '../../../utils/Funciones';
import { EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';

// Simulando datos como los tendría tu sistema
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
            { _id: "1-1-1", nombre: "Ramo novia", cantidad: 1, valor_unitario: 100, unidad: "xUni." },
            { _id: "1-1-2", nombre: "Decoración altar", cantidad: 1, valor_unitario: 100, unidad: "xUni." }
          ]
        },
        {
          _id: "1-2",
          nombre: "Coro de iglesia",
          coste_final: 1841,
          pagado: 301,
          estatus: true,
          items_array: [
            { _id: "1-2-1", nombre: "Servicio coro", cantidad: 1, valor_unitario: 1841, unidad: "xUni." }
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
            { _id: "2-1-1", nombre: "Menú adultos", cantidad: 42, valor_unitario: 50, unidad: "xAdultos." },
            { _id: "2-1-2", nombre: "Menú niños", cantidad: 7, valor_unitario: 25, unidad: "xNiños." }
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

const optionsSelect = [
  { title: "xUni", value: "xUni." },
  { title: "xInv", value: "xInv." },
  { title: "xAdultos", value: "xAdultos." },
  { title: "xNiños", value: "xNiños." },
];

export const SmartSpreadsheetView2 = ({ categorias, setShowCategoria, showCategoria }) => {
  const { event, setEvent } = EventContextProvider();
  const [viewLevel, setViewLevel] = useState(2); // 1=Solo categorías, 2=Cat+Gastos, 3=Todo
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

  // Función para manejar cambios similar a TableBudgetV8
  const handleChange = async ({ values, info, rowType }) => {
    try {
      console.log('Editando:', { values, info, rowType });

      if (rowType === "item" && (!["categoria", "gasto"].includes(values.accessor))) {
        // Lógica para editar items (simulada)
        console.log(`Editando item ${info.itemID}: ${values.accessor} = ${values.value}`);

        // Aquí iría la llamada real a la API cuando se conecte con datos reales:
        /*
        await fetchApiEventos({
          query: queries.editItemGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: info.categoriaID,
            gasto_id: info.gastoID,
            itemGasto_id: info.itemID,
            variable: values.accessor,
            valor: values.value !== "" ? values.value : "nuevo item"
          }
        });
        */
      }

      if (rowType === "gasto" && (!["categoria"].includes(values.accessor))) {
        // Lógica para editar gastos (simulada)
        console.log(`Editando gasto ${info.gastoID}: ${values.accessor} = ${values.value}`);

        // Aquí iría la llamada real a la API:
        /*
        await fetchApiEventos({
          query: queries.editGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: info.categoriaID,
            gasto_id: info.gastoID,
            variable_reemplazar: values.accessor === "gasto" ? "nombre" : values.accessor,
            valor_reemplazar: values.value !== "" ? values.value : "nuevo gasto"
          }
        });
        */
      }

      if (rowType === "categoria") {
        // Lógica para editar categorías (simulada)
        console.log(`Editando categoría ${info.categoriaID}: ${values.accessor} = ${values.value}`);

        // Aquí iría la llamada real a la API:
        /*
        await fetchApiEventos({
          query: queries.editCategoria,
          variables: {
            evento_id: event?._id,
            categoria_id: info.categoriaID,
            nombre: values.value !== "" ? values.value : "nueva categoria"
          }
        });
        */
      }
    } catch (error) {
      console.log(error);
    }
  };

  const tableData = useMemo(() => {
    const rows = [];

    mockData.categorias_array.forEach(categoria => {
      // Fila de categoría
      rows.push({
        type: 'category',
        id: categoria._id,
        categoriaID: categoria._id,
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
        level: 0
      });

      // Filas de gastos si está en nivel 2 o superior
      if (viewLevel >= 2) {
        categoria.gastos_array.forEach(gasto => {
          rows.push({
            type: 'expense',
            id: gasto._id,
            categoriaID: categoria._id,
            gastoID: gasto._id,
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
              const cantidad = item.unidad === 'xAdultos.' ? mockData.presupuesto_objeto.totalStimatedGuests.adults :
                item.unidad === 'xNiños.' ? mockData.presupuesto_objeto.totalStimatedGuests.children :
                  item.cantidad;

              rows.push({
                type: 'item',
                id: item._id,
                categoriaID: categoria._id,
                gastoID: gasto._id,
                itemID: item._id,
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
  }, [viewLevel]);

  const totals = useMemo(() => {
    return {
      estimado: mockData.categorias_array.reduce((acc, cat) => acc + cat.coste_estimado, 0),
      total: mockData.categorias_array.reduce((acc, cat) => acc + cat.coste_final, 0),
      pagado: mockData.categorias_array.reduce((acc, cat) => acc + cat.pagado, 0),
    };
  }, []);

  // Renderizar celda con componentes editables
  const renderEditableCell = (row, field, type) => {

    console.log("field  tabla", field)
    console.log('row', row)

    const isEditable = (
      (field === "categoria" && row.type === "category") ||
      (field === "partida" && row.type === "expense") ||
      (field === "item" && row.type === "item") ||
      (field === "valorUnitario" && row.type === "item") ||
      (field === "cantidad" && row.type === "item" && row.unidad === "xUni.")
    );

    if (!isEditable) {
      if (type === "currency") {
        return getCurrency(row[field] || 0);
      }
      return row[field] || '';
    }

    if (field === "unidad" && row.type === "item") {
      return (
        <EditableSelect
          accessor="unidad"
          value={row.unidad}
          optionsSelect={optionsSelect}
          size={80}
          handleChange={(values) => {
            handleChange({
              values,
              info: row,
              rowType: row.type
            });
          }}
        />
      );
    }

    return (
      <EditableLabelWithInput
        accessor={field}
        handleChange={(values) => {
          handleChange({
            values,
            info: row,
            rowType: row.type
          });
        }}
        type={type}
        value={row[field] || (type === "float" || type === "int" ? 0 : "")}
        textAlign={type === "float" ? "end" : "start"}
        isLabelDisabled
      />
    );
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
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

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.categoria.width }}>
                Categoría
              </th>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.partida.width }}>
                Partida de Gasto
              </th>
              <th className="text-center p-3 font-medium text-gray-700 border-r" style={{ width: 80 }}>
                Unidad
              </th>
              <th className="text-center p-3 font-medium text-gray-700 border-r" style={{ width: 80 }}>
                Cantidad
              </th>
              <th className="text-left p-3 font-medium text-gray-700 border-r" style={{ width: 180 }}>
                Item
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.estimado.width }}>
                Valor Unitario
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.total.width }}>
                Coste Total
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.estimado.width }}>
                Coste Estimado
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.pagado.width }}>
                Pagado
              </th>
              <th className="text-right p-3 font-medium text-gray-700 border-r" style={{ width: columnConfig.pendiente.width }}>
                Pendiente
              </th>
              <th className="text-center p-3 font-medium text-gray-700" style={{ width: columnConfig.acciones.width }}>
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
                  <td className="p-3 border-r" style={{ paddingLeft }}>
                    <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'}`}>
                      {renderEditableCell(row, 'categoria', 'string')}
                    </span>
                  </td>
                  <td className={`p-3 border-r ${textWeight} text-gray-700`}>
                    {renderEditableCell(row, 'partida', 'string')}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {renderEditableCell(row, 'unidad', null)}
                  </td>
                  <td className="p-3 border-r text-center text-sm text-gray-600">
                    {renderEditableCell(row, 'cantidad', 'int')}
                  </td>
                  <td className={`p-3 border-r ${textWeight} text-gray-700`}>
                    {renderEditableCell(row, 'item', 'string')}
                  </td>
                  <td className="p-3 border-r text-right text-sm">
                    {renderEditableCell(row, 'valorUnitario', 'float')}
                  </td>
                  <td className={`p-3 border-r text-right ${textWeight}`}>
                    {renderEditableCell(row, 'total', 'float')}
                  </td>
                  <td className="p-3 border-r text-right text-sm text-blue-600">
                    {renderEditableCell(row, 'estimado', 'float')}
                  </td>
                  <td className="p-3 border-r text-right text-green-600">
                    {renderEditableCell(row, 'pagado', 'float')}
                  </td>
                  <td className="p-3 border-r text-right text-red-600">
                    {renderEditableCell(row, 'pendiente', 'float')}
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

      {/* Footer */}
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
};

