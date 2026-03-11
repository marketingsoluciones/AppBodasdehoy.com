import { FC } from "react";
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
  const { eventsGroupDone, eventsGroupError, eventsGroupErrorMessage, refreshEventsGroup } =
    EventsGroupContextProvider();

  // Still loading events
  if (!eventsGroupDone) {
    return skeleton ?? <SkeletonTable rows={skeletonRows} />;
  }

  // Events loaded but with error
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

  // Events loaded, no error, but no event selected (user has 0 events)
  return skeleton ?? <SkeletonTable rows={skeletonRows} />;
};

export default EventLoadingOrError;
