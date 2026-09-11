/**
 * GuestUpsellPage — pantalla de módulo bloqueado en modo invitado (usuario fantasma).
 * Ahora delega en ModuloBloqueadoInvitado (preview difuminado + tarjeta de registro,
 * fiel a modulos-bloqueados-invitado.html). Mantiene la firma (section/description/icon/
 * benefits) por compatibilidad con las páginas; solo usa `section` para elegir el módulo
 * (el contenido lo define el diseño aprobado).
 */
import { FC } from 'react';
import ModuloBloqueadoInvitado from './ModuloBloqueadoInvitado';

type ModKey = "invitados" | "mesas" | "presupuesto" | "invitaciones" | "itinerario" | "regalos" | "momentos";

interface GuestUpsellPageProps {
  section: string;
  description?: string;
  icon?: string;
  benefits?: string[];
}

const SECTION_TO_MODULO: Record<string, ModKey> = {
  "Lista de invitados": "invitados",
  "Plano de mesas": "mesas",
  "Control de presupuesto": "presupuesto",
  "Invitaciones digitales": "invitaciones",
  "Itinerario del día": "itinerario",
  "Lista de regalos": "regalos",
  "Momentos": "momentos",
};

const GuestUpsellPage: FC<GuestUpsellPageProps> = ({ section }) => {
  const modulo = SECTION_TO_MODULO[section] || "invitados";
  return <ModuloBloqueadoInvitado modulo={modulo} />;
};

export default GuestUpsellPage;
