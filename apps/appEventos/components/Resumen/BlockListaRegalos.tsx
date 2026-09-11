import React, { FC } from "react";
import { useRouter } from "next/navigation";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../context";

const BlockListaRegalos: FC = () => {
  const router = useRouter()
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [isAllowed, ht] = useAllowed()

  // QA GIF-01 (04-jul): antes los valores eran HARDCODED (1000€, 10 participantes)
  // → Resumen mostraba 1000€ Recaudados mientras Lista de Regalos real 0.00€.
  // Ahora derivamos del evento real. Si no hay datos → 0 (esperado hasta que
  // el usuario active la lista). Shape esperada de listaRegalos aún no tipada
  // (es JSON en schema api-mcp) → parseo defensivo.
  const lista: any = event?.listaRegalos ?? null;
  const items: any[] = Array.isArray(lista?.items) ? lista.items
                     : Array.isArray(lista?.regalos) ? lista.regalos
                     : Array.isArray(lista) ? lista
                     : [];
  const raised = items.reduce((sum, it: any) => {
    const contribs = Array.isArray(it?.contribuciones) ? it.contribuciones : [];
    const contribSum = contribs.reduce((s: number, c: any) => s + (Number(c?.monto ?? c?.importe ?? 0) || 0), 0);
    const conseguido = Number(it?.conseguido ?? 0) || 0;
    return sum + (contribSum || conseguido);
  }, 0);
  const participants = items.reduce((sum, it: any) => {
    const contribs = Array.isArray(it?.contribuciones) ? it.contribuciones : [];
    return sum + contribs.length;
  }, 0);

  const ListaBlockRegalos: { amount: number, subtitle: string }[] = [
    { amount: raised, subtitle: t("raised") },
    { amount: participants, subtitle: t("participants") },
  ]


  return (
    <div className="w-full md:w-2/5 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left first-letter:capitalize">
        {t("gift-list")}
      </h2>
      <div className="w-full shadow rounded-xl bg-white py-4 flex flex-col items-center gap-2 justify-center">
        <div className="md:flex-col gap-3 flex">
          {ListaBlockRegalos.map((item, idx) => (
            <span key={idx} className="grid grid-cols-2 items-center gap-2 w-max">
              <p className="font-display font-semibold justify-end text-xl text-gray-700 flex ">
                {item?.amount} {item?.subtitle?.toLowerCase() == "recaudados" ? <span>€</span> : null}
              </p>
              <p className="font-display font-base text-xs mx-auto left-0 text-gray-500 w-full">
                {item?.subtitle}
              </p>
            </span>
          ))}
        </div>

        <button onClick={() => !isAllowed("lista") ? ht() : router.push("/lista-regalos")} className="bg-tertiary w-2/3 rounded-lg font-display text-gray-700 text-sm py-1 hover:bg-gray-300 hover:text-white transition focus:outline-none">
          {t("activatelist")}
        </button>
      </div>
    </div>
  );
};

export default BlockListaRegalos;
