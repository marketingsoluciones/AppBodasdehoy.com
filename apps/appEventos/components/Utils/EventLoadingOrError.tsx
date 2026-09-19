import { FC, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { EventsGroupContextProvider } from "../../context/EventsGroupContext";
import { SkeletonTable } from "./SkeletonPage";

interface EventLoadingOrErrorProps {
  /** Rows/items for the skeleton while loading */
  skeletonRows?: number;
  /** Custom skeleton component (overrides default SkeletonTable) */
  skeleton?: React.ReactNode;
}

/**
 * Shows a skeleton while events are loading, or an error message with retry
 * when the API fails. Use this instead of bare `<SkeletonTable />` in pages
 * that depend on `event` from EventContext.
 */
const EventLoadingOrError: FC<EventLoadingOrErrorProps> = ({
  skeletonRows = 6,
  skeleton,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [stuckLoading, setStuckLoading] = useState(false);
  const {
    eventsGroup,
    eventsGroupDone,
    eventsGroupError,
    eventsGroupErrorMessage,
    eventsGroupSessionExpired,
    refreshEventsGroup,
  } = EventsGroupContextProvider();

  useEffect(() => {
    if (eventsGroupDone) {
      setStuckLoading(false);
      return;
    }
    const timeoutId = setTimeout(() => setStuckLoading(true), 10000);
    return () => clearTimeout(timeoutId);
  }, [eventsGroupDone]);

  // Still loading events
  if (!eventsGroupDone) {
    if (stuckLoading) {
      return (
        <div className="w-full py-16 flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Cargando eventos por más tiempo de lo normal
            </h3>
            <p className="text-sm text-gray-600">
              Parece que la conexión con el servidor se quedó esperando respuesta.
            </p>
            <button
              type="button"
              onClick={() => refreshEventsGroup()}
              className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar carga
            </button>
          </div>
        </div>
      );
    }
    return skeleton ?? <SkeletonTable rows={skeletonRows} />;
  }

  // Session expired (401/403) — dedicated UI with login action
  if (eventsGroupError && eventsGroupSessionExpired) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="max-w-sm mx-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Sesión expirada
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Tu sesión ha caducado. Inicia sesión de nuevo para ver tus eventos.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // Generic server error
  if (eventsGroupError) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="max-w-sm mx-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {eventsGroupErrorMessage ||
              "El servidor no responde. Puede ser un problema temporal."}
          </p>
          <button
            onClick={() => refreshEventsGroup()}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Events loaded, no error, pero sin evento activo en contexto (0 eventos o hay que elegir en inicio)
  const hasEvents = Array.isArray(eventsGroup) && eventsGroup.length > 0;
  return (
    <div className="w-full py-16 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {hasEvents ? t("selectEventFromHomeTitle") : t("Primero debes crear un evento")}
        </h3>
        <p className="text-sm text-gray-600">
          {hasEvents ? t("selectEventFromHomeBody") : t("selectEventCreateBody")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("Mis eventos")}
        </button>
      </div>
    </div>
  );
};

export default EventLoadingOrError;
