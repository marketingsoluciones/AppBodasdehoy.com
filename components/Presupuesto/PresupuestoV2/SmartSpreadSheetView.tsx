import React, { useState, useMemo, useEffect } from 'react';
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Settings, Eye, EyeOff } from 'lucide-react';
import { EventContextProvider } from '../../../context';
import { getCurrency } from '../../../utils/Funciones';
import { useTranslation } from 'react-i18next';
import { useAllowed } from '../../../hooks/useAllowed';
import { PanelControlSuperior } from './PanelControlSuperior';
import { TableBudgetV2 } from './TableBudgetV2';

interface Props {
    categorias_array: any[];
    event: any;
    setShowCategoria: any;
    showCategoria: any;
}

export const SmartSpreadsheetView: React.FC<Props> = ({
    categorias_array,
    event,
    setShowCategoria,
    showCategoria
}) => {
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed();
    const [viewLevel, setViewLevel] = useState(2); // 1=Solo categorías, 2=Cat+Gastos, 3=Todo
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [showEstimados, setShowEstimados] = useState(event?.presupuesto_objeto?.viewEstimates || false);

    // Inicializar categorías expandidas
    useEffect(() => {
        if (categorias_array?.length && expandedCategories.size === 0) {
            const allIds = new Set(categorias_array.map(cat => cat._id));
            setExpandedCategories(allIds);
        }
    }, [categorias_array]);

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const tableData = useMemo(() => {
        if (!categorias_array) return [];

        const rows: any[] = [];

        categorias_array.forEach(categoria => {
            // Calcular totales de la categoría
            const totalItems = categoria.gastos_array?.reduce((acc: number, g: any) =>
                acc + (g.items_array?.length || 0), 0) || 0;

            // Fila de categoría
            rows.push({
                type: 'category',
                id: categoria._id,
                categoria: categoria.nombre,
                partida: '',
                items: totalItems,
                estimado: categoria.coste_estimado,
                total: categoria.coste_final,
                pagado: categoria.pagado,
                pendiente: categoria.coste_final - categoria.pagado,
                level: 0,
                expandable: categoria.gastos_array?.length > 0,
                expanded: expandedCategories.has(categoria._id),
                originalData: categoria
            });

            // Filas de gastos si está expandida
            if (expandedCategories.has(categoria._id) && viewLevel >= 2 && categoria.gastos_array) {
                categoria.gastos_array.forEach((gasto: any) => {
                    rows.push({
                        type: 'expense',
                        id: gasto._id,
                        categoria: '',
                        partida: gasto.nombre,
                        items: gasto.items_array?.length || 0,
                        estimado: gasto.coste_estimado,
                        total: gasto.coste_final,
                        pagado: gasto.pagado,
                        pendiente: gasto.coste_final - gasto.pagado,
                        level: 1,
                        expandable: false,
                        originalData: gasto,
                        categoriaId: categoria._id
                    });

                    // Items si está en nivel 3
                    if (viewLevel >= 3 && gasto.items_array) {
                        gasto.items_array.forEach((item: any) => {
                            const cantidad = item.unidad === 'xAdultos.' ?
                                event?.presupuesto_objeto?.totalStimatedGuests?.adults :
                                item.unidad === 'xNiños.' ?
                                    event?.presupuesto_objeto?.totalStimatedGuests?.children :
                                    item.unidad === 'xInv.' ?
                                        (event?.presupuesto_objeto?.totalStimatedGuests?.adults + event?.presupuesto_objeto?.totalStimatedGuests?.children) :
                                        item.cantidad;

                            const totalItem = cantidad * item.valor_unitario;

                            rows.push({
                                type: 'item',
                                id: item._id,
                                categoria: '',
                                partida: item.nombre,
                                items: `${cantidad} ${item.unidad?.replace('.', '')}`,
                                estimado: null,
                                total: totalItem,
                                pagado: 0, // Los items no tienen pagado directo
                                pendiente: totalItem,
                                level: 2,
                                expandable: false,
                                originalData: item,
                                gastoId: gasto._id,
                                categoriaId: categoria._id
                            });
                        });
                    }
                });
            }
        });

        return rows;
    }, [categorias_array, viewLevel, expandedCategories, event]);

    const totals = useMemo(() => {
        if (!categorias_array) return { estimado: 0, total: 0, pagado: 0 };

        return {
            estimado: categorias_array.reduce((acc, cat) => acc + (cat.coste_estimado || 0), 0),
            total: categorias_array.reduce((acc, cat) => acc + (cat.coste_final || 0), 0),
            pagado: categorias_array.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
        };
    }, [categorias_array]);

    const handleRowClick = (row: any) => {
        if (row.type === 'category') {
            setShowCategoria({
                state: true,
                _id: row.id
            });
        }
    };

    if (!categorias_array) {
        return <div className="p-8 text-center text-gray-500">Cargando presupuesto...</div>;
    }

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col">
            {/* Panel de Control Superior */}
            <PanelControlSuperior viewLevel={viewLevel} setViewLevel={setViewLevel} setShowEstimados={setShowEstimados} showEstimados={showEstimados} totals={totals} event={event} />

            {/* Tabla Inteligente */}
            <div className="flex-1 overflow-auto bg-white">
                <TableBudgetV2
                    tableData={tableData}
                    showEstimados={showEstimados}
                    handleRowClick={handleRowClick}
                    toggleCategory={toggleCategory}
                    event={event}
                />
            </div>

            {/* Barra de Estado Inferior */}
            <div className="bg-gray-100 px-4 py-2 border-t flex justify-between items-center text-sm text-gray-600">
                <div>
                    {tableData.filter(r => r.type === 'category').length} categorías, {' '}
                    {tableData.filter(r => r.type === 'expense').length} gastos
                    {viewLevel >= 3 && (
                        <>, {tableData.filter(r => r.type === 'item').length} items</>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span>Total: {getCurrency(totals.total, event?.presupuesto_objeto?.currency)}</span>
                    <span>|</span>
                    <span>Pendiente: {getCurrency(totals.total - totals.pagado, event?.presupuesto_objeto?.currency)}</span>
                </div>
            </div>
        </div>
    );
};