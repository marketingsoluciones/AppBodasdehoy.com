import React, { useState } from "react";
import * as XLSX from "xlsx";
import { AuthContextProvider, EventContextProvider } from "../../context";

export const ExportarExcelV2 = ({ data, column }) => {
    const { event } = EventContextProvider();
    const { config } = AuthContextProvider();
    const titulo = [
        { A: "NOVIOS FELICES", B: "", C: "", D: "Cotizacion" },
        { A: "Novios", B: ``, C: "", D: "Direccion", E: "" },
        { A: "Celular", B: ``, C: "", D: "Fecha del Evento", E: "" },
        { A: "Mail", B: ``, C: "", D: "Hora", E: "" },
        { A: "Lugar", B: ``, C: "", D: "Tipo de Boda", E: "" },
        { A: "Invitados", B: ``, C: "Niños", D: "", E: "Adultos", F: "" },
    ];
    const informacionAdicional = [{ A: `${config.development}` }, {}];
    const longitudes = [10, 10, 10, 10, 10, 10, 10, 10, 10];
    const GuestsData = event?.invitados_array

    const handleDownload = () => {
        let tabla = [
            {
                A: "Id",
                B: "Nombre",
                C: "Correo",
                D: "Edad",
                E: "Menu",
                F: "N. de pases",
                G: "rol",
                H: "Sexo",
                I: "Telefono",
            },
        ];
        GuestsData.forEach((invitados) => {
            /* tabla.push({
                A: invitados._id,
                B: invitados.nombre,
                C: invitados.correo,
                D: invitados.grupo_edad,
                E: invitados.nombre_menu,
                F: `${invitados.passesQuantity}`,
                G: invitados.rol,
                H: invitados.sexo,
                I: invitados.telefono,
            }); */
        });
        const dataFinal = [...titulo, ...informacionAdicional, ...tabla,];
        setTimeout(() => {
            creandoArchivo(dataFinal);
        }, 1000);
    };

    const creandoArchivo = (dataFinal) => {
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(dataFinal, { skipHeader: false });
        hoja["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Unir celdas A1:F1
            { s: { r: 0, c: 3 }, e: { r: 1, c: 2 } }, // Unir celdas A2:F2
            { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Unir celdas A3:F3
            { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Unir celdas A4:F4
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Unir celdas A5:F5
            { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } }, // Unir celdas A6:D6
            { s: { r: dataFinal.length - 2, c: 0 }, e: { r: dataFinal.length - 2, c: 8 } }, // Unir celdas de la última fila de información adicional
        ];
        let propiedades = [];
        longitudes.forEach((col) => {
            propiedades.push({
                width: col,
            });
        });
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