import React from "react";
import * as XLSX from "xlsx";
import { AuthContextProvider, EventContextProvider } from "../../context";

export const ExportarExcel = () => {
    const { event } = EventContextProvider();
    const { config } = AuthContextProvider();
    const longitudes = [25, 25, 25, 25, 25];
    const GuestsData = event?.invitados_array || [];

    console.log(GuestsData)

    // Definición de columnas
    const columnas = [
        { key: "nombre", label: "Nombre" },
        { key: "correo", label: "Correo" },
        { key: "mesa", label: "Mesa asignada" },
        { key: "rol", label: "Rol" },
        { key: "telefono", label: "Teléfono" },
    ];

    // Genera los datos de la tabla
    const getTabla = () => {
        // Cabecera
        const tabla = [
            columnas.reduce((acc, col) => {
                acc[col.key] = col.label;
                return acc;
            }, {})
        ];
        // Datos
        GuestsData.forEach((invitado) => {
            // Mesa asignada
            let mesa = "";
            if (
                invitado.tableNameCeremonia && invitado.tableNameCeremonia.title && invitado.tableNameCeremonia.title !== "no asignado"
            ) {
                mesa = invitado.tableNameCeremonia.title;
            } else if (
                invitado.tableNameRecepcion && invitado.tableNameRecepcion.title && invitado.tableNameRecepcion.title !== "no asignado"
            ) {
                mesa = invitado.tableNameRecepcion.title;
            }
            // Rol o acompañante
            let rol = invitado.rol;
            if (invitado.father) {
                const padre = GuestsData.find((g) => g._id === invitado.father);
                if (padre) {
                    rol = `acompañante de ${padre.nombre}`;
                }
            }
            tabla.push({
                nombre: invitado.nombre || "",
                correo: invitado.correo || "",
                mesa,
                rol,
                telefono: invitado.telefono || "",
            });
        });
        return tabla;
    };

    // Título y pie de página alineados a las columnas
    const getTitulo = () => [{ nombre: "Reporte de tus Invitados", correo: "", mesa: "", rol: "", telefono: "" }];
    const getInfoAdicional = () => [{ nombre: config.development || "", correo: "", mesa: "", rol: "", telefono: "" }];

    const handleDownload = () => {
        const dataFinal = [
            ...getTabla(), // Solo cabecera y datos
            ...getInfoAdicional(),
        ];
        setTimeout(() => {
            creandoArchivo(dataFinal);
        }, 500);
    };

    const creandoArchivo = (dataFinal) => {
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(dataFinal, { skipHeader: false });
        hoja["!cols"] = longitudes.map((width) => ({ width }));
        hoja["!rows"] = [{ hidden: true }]; // Oculta la primera fila (A1:E1)
        XLSX.utils.book_append_sheet(libro, hoja, event?.tipo || "Invitados");
        XLSX.writeFile(libro, `${event?.tipo || "Invitados"} de ${event?.nombre || "Evento"}.xlsx`);
    };

    return (
        <button
            onClick={handleDownload}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
        >
            Excel
        </button>
    );
}