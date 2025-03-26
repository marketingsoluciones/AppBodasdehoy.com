import React, { useState } from "react";

//import * as XLSX from "xlsx";
import * as XLSX from 'xlsx';
import { AuthContextProvider, EventContextProvider } from "../../context";

export const ExportarExcelV2 = ({ data, column }) => {
    const { event } = EventContextProvider();
    const { config } = AuthContextProvider();
    const titulo = [
        { A: "NOVIOS FELICES", B: "", C: "", D: "", E: "Cotizacion No." },
        { A: "Novios", B: ``, C: "", D: "", E: "Direccion" },
        { A: "Celular", B: ``, C: "", D: "", E: "Fecha del Evento" },
        { A: "Mail", B: ``, C: "", D: "", E: "Hora" },
        { A: "Lugar", B: ``, C: "", D: "", E: "Tipo de Boda" },
        { A: "Invitados", B: ``, C: "Niños", D: "", E: "Adultos", F: "" },
    ];
    //const informacionAdicional = [{ A: `${config.development}` }, {}];
    const longitudes = [15];
    const Data = data.categorias_array.flatMap((objeto) => objeto.gastos_array)
    console.log()

    const handleDownload = () => {
        let tabla = [
            {
                A: "Cant.",
                B: "Item",
                E: "Valor Unitario",
                G: "Valor Total",
            },
        ];
        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } },
            { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },

            { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } },
            { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
            { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } },
            { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },

            { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } },
            { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },
            { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
            { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
            { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },

            { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } },
            { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
            { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } },
            { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
            { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },

            { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } },
            { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } },
            { s: { r: 6, c: 6 }, e: { r: 6, c: 7 } },
        ]; // Array para almacenar las fusiones de celdas
        let rowIndex = tabla.length + 6; // Comenzar después de la fila del encabezado
        Data.forEach((data) => {
            console.log(22222, data)
            // Agregar el nombre del gasto como título
            tabla.push({
                A: data.nombre,
                B: "",
                E: "",
                G: "",
            });

            merges.push({ s: { c: 0, r: rowIndex }, e: { c: 7, r: rowIndex } });
            rowIndex++;

            // Agregar los items debajo del nombre del gasto
            if (data.items_array && data.items_array.length > 0) {
                let startItemRow = rowIndex;
                data.items_array.forEach((item, idx) => {
                    tabla.push({
                        A: item.cantidad,
                        B: item.nombre,
                        E: item.valor_unitario,
                        G: item.total,
                    });
                    if (data.items_array.length > 0) {
                        merges.push({ s: { c: 1, r: startItemRow + idx }, e: { c: 3, r: startItemRow + idx } }); // Fusionar columna B
                        merges.push({ s: { c: 4, r: startItemRow + idx }, e: { c: 5, r: startItemRow + idx } }); // Fusionar columna E
                        merges.push({ s: { c: 6, r: startItemRow + idx }, e: { c: 7, r: startItemRow + idx } }); // Fusionar columna G
                    }
                    rowIndex++;
                });
            }
        });
        const dataFinal = [...titulo, /* ...informacionAdicional, */ ...tabla,];
        setTimeout(() => {
            creandoArchivo(dataFinal, merges, Data);
        }, 1000);
    };

    const creandoArchivo = (dataFinal, merges, dataArray) => {
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(dataFinal, { skipHeader: true });
        hoja['!merges'] = merges;
        let propiedades = [];
        longitudes.forEach((col) => {
            propiedades.push({
                width: col,
            });
        });

        for (let row in hoja) {
            if (row[0] === '!') continue; // Ignorar propiedades de la hoja de cálculo
            // Verificar si la celda tiene contenido
            hoja[row].s = {
                border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } },
                },
            };

        }
        merges.forEach((merge) => {
            for (let row = merge.s.r; row <= merge.e.r; row++) {
                for (let col = merge.s.c; col <= merge.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
                    if (hoja[cellAddress]) {
                        hoja[cellAddress].s = {
                            border: {
                                top: { style: 'thin', color: { rgb: '000000' } },
                                bottom: { style: 'thin', color: { rgb: '000000' } },
                                left: { style: 'thin', color: { rgb: '000000' } },
                                right: { style: 'thin', color: { rgb: '000000' } },
                            },
                        };
                    }
                }
            }
        });
        let currentRow = titulo.length + 1; // Inicializar la fila actual
        dataArray.forEach((data) => {
            const cellAddress = XLSX.utils.encode_cell({ c: 0, r: currentRow });
            if (hoja[cellAddress]) {
                hoja[cellAddress].s = {
                    alignment: { horizontal: 'center' },
                    fill: { fgColor: { rgb: 'E0E0E0' } },
                };
            }
            currentRow++; // Incrementar la fila actual después de procesar el título
            // Incrementar la fila actual por el número de items
            if (data.items_array && data.items_array.length > 0) {
                currentRow += data.items_array.length;
            }
        });

        const headerRange = XLSX.utils.decode_range(hoja['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ c: col, r: 6 });
            if (hoja[cellAddress]) {
                hoja[cellAddress].s = {
                    alignment: { horizontal: 'center' },
                    fill: { fgColor: { rgb: 'ADD8E6' } },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } },
                    },
                };
            }
        }


        hoja["!cols"] = propiedades;
        XLSX.utils.book_append_sheet(libro, hoja, event?.tipo);
        XLSX.writeFile(libro, `${event?.tipo} de ${event?.nombre}.xlsx`);
    };

    return (
        <button
            onClick={() => handleDownload()}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
        >
            Excel
        </button>
    )
}

const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } },
    { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },

    { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },

    { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },

    { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },

    { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } },
    { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } },
    { s: { r: 6, c: 6 }, e: { r: 6, c: 7 } },
]