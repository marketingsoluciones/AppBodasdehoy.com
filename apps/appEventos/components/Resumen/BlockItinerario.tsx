import { GoChecklist } from "react-icons/go";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../context";

function formatTaskDate(fecha?: string): string | null {
  if (!fecha) return null;
  try {
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

export const BlockItinerario = () => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const router = useRouter();

  // Recoger todas las tareas pendientes de todos los itinerarios
  const itinerarios: any[] = event?.itinerarios_array ?? [];
  const pendingTasks: Array<{ descripcion: string; fecha?: string; icon?: string }> = [];
  for (const it of itinerarios) {
    for (const task of it.tasks ?? []) {
      if (!task.estatus && !task.completada) {
        pendingTasks.push({ descripcion: task.descripcion, fecha: task.fecha, icon: task.icon });
      }
    }
  }

  const preview = pendingTasks.slice(0, 3);
  const total = pendingTasks.length;

  if (total === 0) {
    // Sin tareas — botón simple original
    return (
      <div
        onClick={() => router.push("/itinerario")}
        className="bg-acento space-x-3 rounded-lg text-white flex items-center justify-center py-1.5 px-5 shadow-lg font-display text-xl cursor-pointer"
      >
        <GoChecklist className="w-6 h-6 scale-x-90" />
        <span>{t("seemy")}<span> {t("Itinerary")}</span></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl font-semibold text-gray-500 first-letter:capitalize">
          {t("Itinerary")}
        </h2>
        <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-pink-600">
          {total} pendiente{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="divide-y divide-gray-50">
          {preview.map((task, i) => {
            const dateLabel = formatTaskDate(task.fecha);
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 text-base mt-0.5">{task.icon ?? '⬜'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 truncate leading-snug">{task.descripcion}</p>
                  {dateLabel && (
                    <p className="text-xs text-pink-400 mt-0.5">📅 {dateLabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/itinerario")}
          className="mt-auto border-t border-gray-100 px-4 py-2.5 text-sm text-primary font-display font-medium text-center hover:bg-gray-50 transition w-full"
        >
          {t("seemy")} {t("Itinerary")} →
        </button>
      </div>
    </div>
  );
};
