import { FC, useMemo, useState } from "react";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import { HiOutlineMail } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

// Tipos e interfaces
export interface Comunicacion {
  type: "email" | "whatsapp";
  template_id: string;
  message_id: string;
  statuses: string[];
  fecha_envio?: string;
  fecha_actualizacion?: string;
}

export interface Invitado {
  _id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  comunicaciones_array?: Comunicacion[];
}

interface DashboardComunicacionMulticanalProps {
  invitados: Invitado[];
}

interface FiltrosValues {
  canal: "todos" | "email" | "whatsapp" | "ambos";
  estado: string;
  plantilla: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  buscarContacto: string;
}

// Estados definidos
const ESTADOS_EMAIL = [
  "request",
  "delivered",
  "opened",
  "unique_opened",
  "proxy_open",
  "click",
  "deferred",
  "soft_bounce",
  "hard_bounce",
  "spam",
  "invalid_email",
  "blocked",
  "unsubscribed",
  "error",
];

const ESTADOS_WHATSAPP = ["sent", "delivered", "read", "error"];

const TODOS_ESTADOS = [...ESTADOS_EMAIL, ...ESTADOS_WHATSAPP].filter(
  (v, i, a) => a.indexOf(v) === i
);

// Leyenda de estados
const LEYENDA_WHATSAPP = {
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  error: "Error de envío",
};

const LEYENDA_EMAIL = {
  request: "Enviado",
  delivered: "Entregado",
  opened: "Correo abierto",
  unique_opened: "Primera apertura",
  proxy_open: "Apertura proxy",
  click: "Enlace clickeado",
  deferred: "Retrasado temporalmente",
  soft_bounce: "Rebotado temporal",
  hard_bounce: "Rebotado permanente",
  spam: "Marcado como spam",
  invalid_email: "Email inválido",
  blocked: "Bloqueado por proveedor",
  unsubscribed: "Usuario dio de baja",
  error: "Error técnico",
};

export const DashboardComunicacionMulticanal: FC<DashboardComunicacionMulticanalProps> = ({ invitados }) => {
  const { t } = useTranslation();

  // Valores iniciales del formulario
  const initialValues: FiltrosValues = {
    canal: "todos",
    estado: "",
    plantilla: "",
    fechaInicio: null,
    fechaFin: null,
    buscarContacto: "",
  };

  // Obtener todas las plantillas únicas
  const plantillas = useMemo(() => {
    const set = new Set<string>();
    invitados.forEach((invitado) => {
      invitado.comunicaciones_array?.forEach((com) => {
        if (com.template_id) set.add(com.template_id);
      });
    });
    return Array.from(set);
  }, [invitados]);

  // Estado para los filtros activos
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosValues>(initialValues);

  // Calcular KPIs y datos filtrados
  const { kpis, datosFiltrados, totalEnvios } = useMemo(() => {
    // Filtrar datos según los filtros activos
    let datos = invitados.filter((invitado) => {
      // Filtro por búsqueda de contacto
      if (filtrosActivos.buscarContacto) {
        const busqueda = filtrosActivos.buscarContacto.toLowerCase();
        const nombreMatch = invitado.nombre?.toLowerCase().includes(busqueda);
        const correoMatch = invitado.correo?.toLowerCase().includes(busqueda);
        const telefonoMatch = invitado.telefono?.includes(busqueda);

        if (!nombreMatch && !correoMatch && !telefonoMatch) {
          return false;
        }
      }

      // Filtrar por comunicaciones que coincidan con los filtros
      const comunicacionesFiltradas = invitado.comunicaciones_array?.filter((com) => {
        // Filtro por canal
        if (filtrosActivos.canal === "email" && com.type !== "email") return false;
        if (filtrosActivos.canal === "whatsapp" && com.type !== "whatsapp") return false;
        // "ambos" y "todos" no filtran por tipo de canal

        // Filtro por estado
        if (filtrosActivos.estado) {
          const ultimoEstado = com.statuses[com.statuses.length - 1] || "";
          if (ultimoEstado !== filtrosActivos.estado) return false;
        }

        // Filtro por plantilla
        if (filtrosActivos.plantilla && com.template_id !== filtrosActivos.plantilla) {
          return false;
        }

        // Filtro por rango de fechas
        if (filtrosActivos.fechaInicio || filtrosActivos.fechaFin) {
          const fechaEnvio = com.fecha_envio ? new Date(com.fecha_envio) : null;
          const fechaActualizacion = com.fecha_actualizacion
            ? new Date(com.fecha_actualizacion)
            : fechaEnvio;

          if (fechaActualizacion) {
            if (filtrosActivos.fechaInicio && fechaActualizacion < filtrosActivos.fechaInicio) {
              return false;
            }
            if (filtrosActivos.fechaFin) {
              const fechaFinConHora = new Date(filtrosActivos.fechaFin);
              fechaFinConHora.setHours(23, 59, 59, 999);
              if (fechaActualizacion > fechaFinConHora) {
                return false;
              }
            }
          }
        }

        return true;
      });

      // Solo incluir invitados que tengan comunicaciones que pasen los filtros
      if (!comunicacionesFiltradas || comunicacionesFiltradas.length === 0) {
        return false;
      }

      return true;
    });

    // Calcular totales para KPIs basados en datos filtrados
    let totalEnvios = 0;
    let totalEntregados = 0;
    let totalEngagement = 0;
    let totalErrores = 0;

    datos.forEach((invitado) => {
      invitado.comunicaciones_array?.forEach((com) => {
        // Aplicar mismos filtros a los KPIs
        if (filtrosActivos.canal === "email" && com.type !== "email") return;
        if (filtrosActivos.canal === "whatsapp" && com.type !== "whatsapp") return;
        if (filtrosActivos.estado) {
          const ultimoEstado = com.statuses[com.statuses.length - 1] || "";
          if (ultimoEstado !== filtrosActivos.estado) return;
        }
        if (filtrosActivos.plantilla && com.template_id !== filtrosActivos.plantilla) return;

        totalEnvios++;

        const ultimoEstado = com.statuses[com.statuses.length - 1] || "";

        // Contar entregados
        if (ultimoEstado === "delivered") {
          totalEntregados++;
        }

        // Contar engagement
        if (
          ultimoEstado === "read" || // WhatsApp
          ultimoEstado === "opened" ||
          ultimoEstado === "firstOpening" ||
          ultimoEstado === "clicked" // Email
        ) {
          totalEngagement++;
        }

        // Contar errores
        if (
          ultimoEstado === "error" ||
          ultimoEstado === "hardBounced" ||
          ultimoEstado === "invalidEmail" ||
          ultimoEstado === "blocked" ||
          ultimoEstado === "unsubscribed"
        ) {
          totalErrores++;
        }
      });
    });

    const porcentajeEntregados =
      totalEnvios > 0 ? ((totalEntregados / totalEnvios) * 100).toFixed(0) : "0";
    const porcentajeEngagement =
      totalEnvios > 0 ? ((totalEngagement / totalEnvios) * 100).toFixed(0) : "0";
    const porcentajeErrores =
      totalEnvios > 0 ? ((totalErrores / totalEnvios) * 100).toFixed(0) : "0";

    return {
      kpis: {
        totalEnvios,
        porcentajeEntregados,
        porcentajeEngagement,
        porcentajeErrores,
      },
      datosFiltrados: datos.map(inv => ({
        ...inv,
        comunicaciones_array: inv.comunicaciones_array?.filter((com) => {
          if (filtrosActivos.canal === "email" && com.type !== "email") return false;
          if (filtrosActivos.canal === "whatsapp" && com.type !== "whatsapp") return false;
          if (filtrosActivos.estado) {
            const ultimoEstado = com.statuses[com.statuses.length - 1] || "";
            if (ultimoEstado !== filtrosActivos.estado) return false;
          }
          if (filtrosActivos.plantilla && com.template_id !== filtrosActivos.plantilla) return false;
          if (filtrosActivos.fechaInicio || filtrosActivos.fechaFin) {
            const fechaEnvio = com.fecha_envio ? new Date(com.fecha_envio) : null;
            const fechaActualizacion = com.fecha_actualizacion
              ? new Date(com.fecha_actualizacion)
              : fechaEnvio;
            if (fechaActualizacion) {
              if (filtrosActivos.fechaInicio && fechaActualizacion < filtrosActivos.fechaInicio) return false;
              if (filtrosActivos.fechaFin) {
                const fechaFinConHora = new Date(filtrosActivos.fechaFin);
                fechaFinConHora.setHours(23, 59, 59, 999);
                if (fechaActualizacion > fechaFinConHora) return false;
              }
            }
          }
          return true;
        })
      })),
      totalEnvios,
    };
  }, [invitados, filtrosActivos]);

  // Función para obtener el texto del estado
  const obtenerTextoEstado = (
    estado: string,
    tipo: "email" | "whatsapp"
  ): string => {
    if (tipo === "whatsapp") {
      return LEYENDA_WHATSAPP[estado] || estado;
    } else {
      return LEYENDA_EMAIL[estado] || estado;
    }
  };

  // Función para obtener el color del estado
  const obtenerColorEstado = (estado: string): string => {
    if (
      estado === "read" ||
      estado === "opened" ||
      estado === "firstOpening" ||
      estado === "clicked"
    ) {
      return "text-green-600 bg-green-50";
    }
    if (
      estado === "error" ||
      estado === "hardBounced" ||
      estado === "invalidEmail" ||
      estado === "blocked" ||
      estado === "unsubscribed"
    ) {
      return "text-red-600 bg-red-50";
    }
    if (estado === "delivered") {
      return "text-blue-600 bg-blue-50";
    }
    if (estado === "sent") {
      return "text-gray-600 bg-gray-50";
    }
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      {/* Título */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Dashboard: Comunicación Multicanal por Contacto
        </h2>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">🔍 Filtros</h3>
        <Formik initialValues={initialValues} onSubmit={(values) => { }}>
          {({ values, setFieldValue }) => {
            // Sincronizar cambios con filtros activos
            const handleChange = (field: string, value: any) => {
              setFieldValue(field, value);
              setFiltrosActivos((prev) => ({ ...prev, [field]: value }));
            };

            const handleDateChange = (field: "fechaInicio" | "fechaFin", date: Date | null) => {
              setFieldValue(field, date);
              setFiltrosActivos((prev) => ({ ...prev, [field]: date }));
            };

            return (
              <Form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Canal */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Canal
                  </label>
                  <select
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-7 rounded-xl focus:outline-none"
                    value={values.canal}
                    onChange={(e) => handleChange("canal", e.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Estado
                  </label>
                  <select
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-7 rounded-xl focus:outline-none"
                    value={values.estado}
                    onChange={(e) => handleChange("estado", e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    {TODOS_ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plantilla */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Plantilla
                  </label>
                  <select
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-7 rounded-xl focus:outline-none"
                    value={values.plantilla}
                    onChange={(e) => handleChange("plantilla", e.target.value)}
                  >
                    <option value="">Todas las plantillas</option>
                    {plantillas.map((plantilla) => (
                      <option key={plantilla} value={plantilla}>
                        {plantilla}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rango de fechas - Inicio */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Fecha Inicio
                  </label>
                  <DatePicker
                    selected={values.fechaInicio}
                    onChange={(date: Date | null) => handleDateChange("fechaInicio", date)}
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Seleccionar fecha"
                  />
                </div>

                {/* Rango de fechas - Fin */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Fecha Fin
                  </label>
                  <DatePicker
                    selected={values.fechaFin}
                    onChange={(date: Date | null) => handleDateChange("fechaFin", date)}
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Seleccionar fecha"
                  />
                </div>

                {/* Buscar contacto */}
                <div>
                  <label className="font-display text-sm text-primary mb-2 block">
                    Buscar contacto
                  </label>
                  <input
                    type="text"
                    name="buscarContacto"
                    value={values.buscarContacto}
                    onChange={(e) => handleChange("buscarContacto", e.target.value)}
                    placeholder="Nombre, email o teléfono"
                    className="font-display text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                  />
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>

      {/* KPIs */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          📊 Indicadores Clave (KPIs)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Total de envíos</p>
            <p className="text-3xl font-bold text-blue-700">
              {kpis.totalEnvios.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">% Entregados</p>
            <p className="text-3xl font-bold text-green-700">
              {kpis.porcentajeEntregados}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">% Engagement</p>
            <p className="text-3xl font-bold text-purple-700">
              {kpis.porcentajeEngagement}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">% con errores/fallos</p>
            <p className="text-3xl font-bold text-red-700">
              {kpis.porcentajeErrores}%
            </p>
          </div>
        </div>
      </div>

      {/* Seguimiento por Contacto */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          📋 Seguimiento por Contacto
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Contacto
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Canal
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Plantilla
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Hora
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Contacto
                </th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((invitado) => {
                if (
                  !invitado.comunicaciones_array ||
                  invitado.comunicaciones_array.length === 0
                ) {
                  return null;
                }

                return invitado.comunicaciones_array.map((com, index) => {
                  const ultimoEstado =
                    com.statuses[com.statuses.length - 1] || "sent";
                  const fechaEnvio = com.fecha_envio
                    ? new Date(com.fecha_envio)
                    : null;
                  const fechaActualizacion = com.fecha_actualizacion
                    ? new Date(com.fecha_actualizacion)
                    : fechaEnvio;

                  return (
                    <tr
                      key={`${invitado._id}-${index}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {invitado.nombre}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {com.type === "email" ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <HiOutlineMail className="w-4 h-4" />
                            <span>📧 Email</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaWhatsapp className="w-4 h-4" />
                            <span>📱 WhatsApp</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {com.template_id || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${obtenerColorEstado(
                            ultimoEstado
                          )}`}
                        >
                          {obtenerTextoEstado(ultimoEstado, com.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {fechaActualizacion
                          ? fechaActualizacion.toISOString().split("T")[0]
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {fechaActualizacion
                          ? fechaActualizacion
                            .toTimeString()
                            .split(" ")[0]
                            .slice(0, 5)
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {com.type === "email"
                          ? invitado.correo || "-"
                          : invitado.telefono || "-"}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

