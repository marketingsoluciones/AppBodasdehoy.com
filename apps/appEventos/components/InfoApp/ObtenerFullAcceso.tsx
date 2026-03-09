import { AuthContextProvider } from "../../context"
import { GoX } from "react-icons/go";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

/** Paneles que tienen los usuarios con full acceso (mismas rutas que la navegación principal). */
const PANELES_FULL_ACCESO = [
  { route: "/", titleKey: "Mis eventos", descKey: "yourevents", img: "/FullAcceso/resumen.png" },
  { route: "/resumen-evento", titleKey: "Resumen", descKey: "managementamongothers", img: "/FullAcceso/resumen.png" },
  { route: "/invitados", titleKey: "Invitados", descKey: "huestsfeatures", img: "/FullAcceso/invitados.png" },
  { route: "/mesas", titleKey: "Mesas", descKey: "yourdrawings", img: "/FullAcceso/mesas.png" },
  { route: "/lista-regalos", titleKey: "Lista de regalos", descKey: "yourregistries", img: "/FullAcceso/mesas.png" },
  { route: "/presupuesto", titleKey: "Presupuesto", descKey: "yourquote", img: "/FullAcceso/presupuesto.png" },
  { route: "/invitaciones", titleKey: "Invitaciones", descKey: "yourinvitations", img: "/FullAcceso/invitaciones.png" },
  { route: "/itinerario", titleKey: "Itinerario", descKey: "youritineraries", img: "/FullAcceso/invitaciones.png" },
];

export const ObtenerFullAcceso = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { actionModals, setActionModals } = AuthContextProvider();

  return (
    <div className="p-4 overflow-y-auto h-full space-y-5 relative text-gray-800">
      <div onClick={() => setActionModals(!actionModals)} className="absolute right-4 top-4 cursor-pointer z-10">
        <GoX className="w-6 h-6 transition hover:rotate-180" />
      </div>

      <div className="space-y-3 pt-2">
        <h1 className="text-center text-primary text-[20px] font-semibold">{t("accessto")}</h1>
        <p className="text-[13px] px-2 text-center text-gray-600">{t("Full acceso es de pago")}</p>
        <p className="text-[12px] px-2 text-center text-gray-500">{t("benefitscountless")} <span className="text-primary font-medium">{t("getaccess")}</span></p>
      </div>

      <div className="bg-slate-100 -mx-4 py-6 px-4 rounded-lg space-y-4">
        <p className="text-[12px] font-medium text-gray-700 uppercase tracking-wide px-1">{t("fullaccess")} — {t("Paneles disponibles")}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PANELES_FULL_ACCESO.map((panel) => (
            <li
              key={panel.route}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-primary/30 transition"
            >
              <img className="h-10 w-10 object-contain flex-shrink-0" src={panel.img} alt={t(panel.titleKey)} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[13px] text-gray-800">{t(panel.titleKey)}</p>
                <p className="text-[11px] text-gray-500 truncate">{t(panel.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 py-4">
        <button
          type="button"
          onClick={() => { setActionModals(!actionModals); router.push("/facturacion"); }}
          className="w-full sm:w-auto bg-primary text-white py-2.5 px-6 rounded-lg font-semibold text-center shadow-sm hover:opacity-90"
        >
          {t("Ver planes")}
        </button>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://wa.me/34910603622"
          className="w-full sm:w-auto text-center py-2.5 px-6 rounded-lg font-medium border-2 border-primary text-primary hover:bg-primary/5"
        >
          {t("contactanos")}
        </a>
      </div>
    </div>
  );
};