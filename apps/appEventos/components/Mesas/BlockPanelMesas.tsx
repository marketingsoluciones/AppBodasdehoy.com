import { LineaBancos, MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, Banco, MesaMilitar } from "../icons";
import { FC } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from 'react-i18next';

// Catálogo de tipos de mesa. SIGUE en uso en pages/mesas.tsx:172 para construir
// `defaultTablesDraggable` (accept del dropzone del canvas). NO borrar este export
// aunque el grid arrastrable ya no se renderice aquí.
export const ListTables = [
  { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada", tipo: "table" },
  { icon: <MesaPodio className="relative w-max" />, title: "podio", tipo: "table" },
  { icon: <MesaRedonda className="relative w-max" />, title: "redonda", tipo: "table" },
  { icon: <MesaImperial className="relative w-max" />, title: "imperial", tipo: "table" },
  { icon: <MesaMilitar className="relative w-max" />, title: "militar", tipo: "table" },
  { icon: <LineaBancos className="relative w-max" />, title: "bancos", tipo: "table" },
  { icon: <Banco className="relative w-max" />, title: "banco", tipo: "table" },
];

interface propsBlockPanelMesas {
  setShowFormEditar?: (v: { table: any; visible: boolean }) => void
}

// Rediseño fiel al prototipo (MESAS.dc.html, tab «Mesas»): LISTA de mesas creadas en el
// plano activo (nº + nombre + "N personas" + chevron editar), en lugar del grid arrastrable
// de tipos. La creación se unifica en el botón «＋ Añadir mesa» del canvas (TableConfigurator,
// HANDOFF §0). Click en fila / chevron → abre el form de edición YA existente vía
// setShowFormEditar (mismo shape que usa EditDefault). NO toca interact.js ni el estado de
// selección del canvas.
const BlockPanelMesas: FC<propsBlockPanelMesas> = ({ setShowFormEditar }) => {
  const { t } = useTranslation();
  const { planSpaceActive } = EventContextProvider()
  const tables: any[] = planSpaceActive?.tables || []

  const openEdit = (table: any) => {
    if (setShowFormEditar) setShowFormEditar({ table, visible: true })
  }

  return (
    <div id="listTables" className="w-full h-full overflow-auto flex flex-col gap-[11px] p-1">
      <div className="flex-none text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba]">
        {t('tablesin', 'Mesas en')} «{planSpaceActive?.title || '—'}» · <span className="text-[#EF5B94]">{tables.length}</span>
      </div>

      {tables.length === 0 &&
        <div className="text-[11px] font-medium text-[#a0a0a8] leading-relaxed py-1">
          {t('notablesyethint', 'Aún no hay mesas en este plano. Usa «＋ Añadir mesa» en el plano.')}
        </div>
      }

      <div className="flex flex-col gap-[7px]">
        {tables.map((table, idx) => {
          const num = idx + 1
          const name = table?.title || table?.nombre_mesa || `${t('table', 'Mesa')} ${num}`
          const sillas = table?.numberChair ?? table?.cantidad_sillas ?? (table?.guests?.length || 0)
          return (
            <div
              key={table?._id || idx}
              onClick={() => openEdit(table)}
              className="flex items-center gap-[11px] px-2.5 py-[9px] rounded-[11px] bg-white border border-[#f0f0f2] hover:border-[#e2e2e6] hover:bg-[#faf9fb] cursor-pointer transition-colors"
            >
              <div className="w-[30px] h-[30px] rounded-[9px] flex-none flex items-center justify-center bg-[#F0F0F2] border-[1.5px] border-[#E2E2E6] text-[12px] font-bold text-[#6b6b72]">{num}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-[#3A3A42] truncate">{name}</div>
                <div className="text-[10.5px] font-medium text-[#a0a0a8]">{sillas} {t('people', 'personas')}</div>
              </div>
              <div className="w-7 h-7 flex-none flex items-center justify-center text-[#c8c8ce] hover:text-[#6b6b72] transition-colors">
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default BlockPanelMesas;
