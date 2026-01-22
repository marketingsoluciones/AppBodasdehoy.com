import { FC } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { AuthContextProvider } from "../../context";

interface EventNotFoundProps {
  onBackToHome?: () => void;
}

const EventNotFound: FC<EventNotFoundProps> = ({ onBackToHome }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { config } = AuthContextProvider();

  const handleBackToHome = () => {
    // Limpiar el query param de la URL
    router.replace("/", undefined, { shallow: true });
    if (onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="w-full h-[calc(100vh-150px)] flex items-center justify-center bg-base">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Icono o imagen */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-display font-semibold text-gray-800 mb-3">
            {t("Evento no disponible") || "Evento no disponible"}
          </h2>

          {/* Mensaje */}
          <p className="text-gray-600 font-display mb-6 leading-relaxed">
            {t("Este evento no está disponible en tu cuenta o no ha sido compartido previamente contigo.") ||
              "Este evento no está disponible en tu cuenta o no ha sido compartido previamente contigo."}
          </p>

          {/* Botón para regresar */}
          <button
            onClick={handleBackToHome}
            className="w-full bg-primary text-white font-display font-medium py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t("Regresar al inicio") || "Regresar al inicio"}
          </button>

          {/* Logo opcional */}
          {config?.logoDirectory && (
            <div className="mt-6 flex justify-center">
              {config.logoDirectory}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventNotFound;
