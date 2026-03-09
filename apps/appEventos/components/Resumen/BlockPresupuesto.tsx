import React from "react";
import { CochinoIcon, DineroIcon } from "../icons";
import { useRouter } from "next/navigation";
import { getCurrency } from "../../utils/Funciones";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';

/** Formato compacto para cantidades muy grandes: evita que la tarjeta crezca y se desalinee con Invitados */
function formatAmountCompact(value: number | string | undefined, currency?: string): string {
  const v = value == null ? NaN : typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(v)) return getCurrency(0, currency);
  const abs = Math.abs(v);
  if (abs >= 1e6) {
    const millions = v / 1e6;
    const formatted = millions.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return currency ? `${formatted} M ${currency}` : `${formatted} M`;
  }
  return getCurrency(v, currency);
}

const CARD_HEIGHT = "h-48"; // Misma altura que BlockInvitados

const BlockPresupuesto = () => {
  const router = useRouter()
  const { event } = EventContextProvider();
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();
  const currency = event?.presupuesto_objeto?.currency;
  const estimado = event?.presupuesto_objeto?.coste_estimado;
  const gastado = event?.presupuesto_objeto?.coste_final;

  const ListaBlock = [
    { icon: <CochinoIcon className="text-gray-500 shrink-0 w-5 h-5" />, value: estimado, subtitle: t("dear") },
    { icon: <DineroIcon className="text-gray-500 shrink-0 w-5 h-5" />, value: gastado, subtitle: t("wornout") },
  ];

  const ItemBlock = ({ item }: { item: (typeof ListaBlock)[0] }) => (
    <div className="flex flex-col items-center justify-center gap-0.5 w-full min-w-0 flex-1 min-h-0">
      <span className="shrink-0" aria-hidden>
        {item.icon}
      </span>
      <p className="font-display font-semibold text-sm text-gray-700 leading-tight text-center truncate max-w-full" title={getCurrency(item.value, currency)}>
        {formatAmountCompact(item.value, currency)}
      </p>
      <p className="font-display text-xs text-gray-500 text-center shrink-0">
        {item.subtitle}
      </p>
    </div>
  );

  return (
    <div className="w-full md:w-1/3 box-border min-w-0 flex flex-col">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left first-letter:capitalize shrink-0">
        {t("budget")}
      </h2>

      <div className={`w-full shadow rounded-xl bg-white py-3 px-3 flex flex-col gap-2 ${CARD_HEIGHT} min-h-0`}>
        <div className="flex flex-col gap-1 flex-1 min-h-0 justify-center overflow-hidden">
          {ListaBlock.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx === 1 && <div className="w-full border-t border-gray-100 shrink-0" />}
              <ItemBlock item={item} />
            </React.Fragment>
          ))}
        </div>

        <button onClick={() => !isAllowed("presupuesto") ? ht() : router.push("/presupuesto")} className="focus:outline-none rounded-lg border border-primary px-2 mx-auto shrink-0 font-display text-primary text-sm py-1 hover:text-white hover:bg-primary transition">
          {t("addexpenses")}
        </button>
      </div>
    </div>
  );
};

export default BlockPresupuesto;
