import React, { useState } from "react";
import * as XLSX from "xlsx";
import { AuthContextProvider, EventContextProvider } from "../../context";

export const ExportarExcel = () => {
    const { event } = EventContextProvider();
    const {  config } = AuthContextProvider();
    const titulo = [{ A: "Reporte de tus Invitados" }, {}];
    const informacionAdicional = [{ A: `${config.development}` }, {}];
    const longitudes = [30, 17, 25, 7, 10, 10, 20, 10, 15];
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
            tabla.push({
                A: invitados._id,
                B: invitados.nombre,
                C: invitados.correo,
                D: invitados.grupo_edad,
                E: invitados.nombre_menu,
                F: `${invitados.passesQuantity}`,
                G: invitados.rol,
                H: invitados.sexo,
                I: invitados.telefono,
            });
        });
        const dataFinal = [...titulo, ...tabla, ...informacionAdicional];
        setTimeout(() => {
            creandoArchivo(dataFinal);
        }, 1000);
    };

    const creandoArchivo = (dataFinal) => {
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(dataFinal, { skipHeader: false });
        hoja["!merges"] = [
            XLSX.utils.decode_range("A1:I1"),
            XLSX.utils.decode_range("A34:I34"),
        ];
        let propiedades = [];
        longitudes.forEach((col) => {
            propiedades.push({
                width: col,
            });
        });
        hoja["!cols"] = propiedades;
        XLSX.utils.book_append_sheet(libro, hoja, event?.tipo);
        XLSX.writeFile(libro, event?.tipo + " de " + event?.nombre + ".xlsx");
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