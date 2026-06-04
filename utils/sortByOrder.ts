import { Direction, Order } from "./Interfaces";

export interface SortableItem {
  descripcion?: string;
  nombre?: string;
  fecha?: string | number | Date;
  fecha_creacion?: string | number | Date;
  fecha_actualizacion?: string | number | Date;
  updatedAt?: string | number | Date;
  estado?: string;
  prioridad?: string;
  title?: string;
  personalizada?: string;
}

export function parseSortableDate(
  value: string | number | Date | undefined | null
): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  const str = String(value);
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    return str.length < 16 ? n : new Date(n).getTime();
  }
  const t = new Date(str).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const dateFieldForOrder = (item: SortableItem, order: Order) => {
  if (order === "fecha_creacion") return item.fecha_creacion;
  if (order === "fecha_actualizacion") {
    return item.fecha_actualizacion ?? item.updatedAt;
  }
  return item.fecha;
};

export function compareByOrder(
  a: SortableItem,
  b: SortableItem,
  order: Order,
  direction: Direction
): number {
  const isDesc = direction === "desc";
  let comparison = 0;

  const statusOrder: Record<string, number> = {
    pending: 0,
    in_progress: 1,
    completed: 2,
    blocked: 3,
  };
  const prioridadOrder: Record<string, number> = {
    baja: 0,
    media: 1,
    alta: 2,
  };

  switch (order) {
    case "descripcion":
      comparison = String(a.descripcion ?? a.nombre ?? "").localeCompare(
        String(b.descripcion ?? b.nombre ?? "")
      );
      break;
    case "fecha":
    case "fecha_creacion":
    case "fecha_actualizacion":
      comparison =
        parseSortableDate(dateFieldForOrder(a, order)) -
        parseSortableDate(dateFieldForOrder(b, order));
      break;
    case "estado": {
      const aIdx = a.estado ? (statusOrder[a.estado] ?? 0) : 0;
      const bIdx = b.estado ? (statusOrder[b.estado] ?? 0) : 0;
      comparison = aIdx - bIdx;
      break;
    }
    case "prioridad": {
      const aPrioridad = a.prioridad ? (prioridadOrder[a.prioridad] ?? 0) : 0;
      const bPrioridad = b.prioridad ? (prioridadOrder[b.prioridad] ?? 0) : 0;
      comparison = aPrioridad - bPrioridad;
      break;
    }
    case "nombre":
      comparison = String(a.title ?? a.nombre ?? "").localeCompare(
        String(b.title ?? b.nombre ?? "")
      );
      break;
    case "personalizada":
      comparison = String(a.personalizada ?? "").localeCompare(String(b.personalizada ?? ""));
      break;
    case "ninguna":
    default:
      return 0;
  }

  return isDesc ? -comparison : comparison;
}
