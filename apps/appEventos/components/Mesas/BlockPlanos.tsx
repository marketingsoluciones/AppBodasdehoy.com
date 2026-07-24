import { FC, useState } from 'react';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';

// Rediseño fiel al prototipo (MESAS.dc.html): lista vertical "Espacios del evento".
// Fila = icono de PLANO (SVG rect+divisiones) + nombre + "N mesas · M sentados" +
// check rosa en el espacio activo. Colores exactos del proto (B.planos, líneas 720-727):
//   activo → fila #FCE7F0/#f7c2da · icono #FCE7F0/#EF5B94 · check #EF5B94.
//   inactivo → fila #fff/#f0f0f2 · icono #F0F0F2/#a0a0a8.
// NO cambia la lógica de selección (setPlanSpaceSelect + fetchApiEventos).

// Icono de plano del prototipo (no usar HiTemplate: el diseño pide este SVG concreto).
const FloorPlanIcon: FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <path d="M3 13h5M12 13h9M15 3v4M15 11v10" />
  </svg>
)

export const BlockPlanos: FC = () => {
  const { t } = useTranslation();
  const { event, setEvent, planSpaceSelect, setPlanSpaceSelect } = EventContextProvider()
  const { user } = AuthContextProvider()
  // Modal "Crear plano nuevo" (proto líneas 302-317). Local a este bloque.
  const [newPlanoOpen, setNewPlanoOpen] = useState(false)
  const [newPlanoName, setNewPlanoName] = useState('')
  const [createNotice, setCreateNotice] = useState<string | null>(null)

  const handleClick = (item: planSpace) => {
    try {
      setPlanSpaceSelect(item?._id)
      fetchApiEventos({
        query: queries.setPlanSpaceSelect,
        variables: {
          evento_id: event?._id,
          planSpaceSelect: item?._id,
          isOwner: user?.uid === event?.usuario_id,
        },
      })
    } catch {
    }
  }

  // Sentados en un espacio = suma de invitados sentados en sus mesas (table.guests[]).
  const seatedCount = (item: any): number =>
    (item?.tables || []).reduce((n: number, tb: any) => n + (tb?.guests?.length || 0), 0)

  const openNewPlano = () => {
    setNewPlanoName('')
    setCreateNotice(null)
    setNewPlanoOpen(true)
  }
  const closeNewPlano = () => setNewPlanoOpen(false)
  const handleCreatePlano = async () => {
    const name = newPlanoName.trim()
    if (!name) return
    setCreateNotice(null)
    try {
      // createPlanSpace (api-mcp) crea el plano, lo añade a evento.planSpace, pone
      // planSpaceSelect = nuevo._id y DEVUELVE el planSpace nuevo (verificado en el resolver).
      const nuevo: any = await fetchApiEventos({
        query: queries.createPlanSpace,
        variables: { evento_id: event?._id, title: name },
      })
      if (!nuevo?._id) {
        setCreateNotice(t('createplanoerror', 'No se pudo crear el plano. Inténtalo de nuevo.'))
        return
      }
      // Reflejar en el front: añadir el nuevo espacio y seleccionarlo (el backend ya hizo el select).
      setEvent((prev: any) => ({ ...prev, planSpace: [...(prev?.planSpace ?? []), nuevo] }))
      setPlanSpaceSelect(nuevo._id)
      closeNewPlano()
    } catch {
      setCreateNotice(t('createplanoerror', 'No se pudo crear el plano. Inténtalo de nuevo.'))
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-2.5 p-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba]">{t('eventspaces', 'Espacios del evento')}</span>
        <span className="text-[11px] font-semibold text-[#EF5B94]">{event?.planSpace?.length || 0} {t('spaces', 'espacios')}</span>
      </div>

      <div className="flex flex-col gap-[7px] overflow-auto max-h-[340px]">
        {event?.planSpace?.map((item, idx) => {
          const active = planSpaceSelect === item?._id
          const mesas = item?.tables?.length || 0
          const sentados = seatedCount(item)
          const mesasLabel = (mesas === 1 ? t('table', 'mesa') : t('tables', 'mesas')).toLowerCase()
          const seatedLabel = t('seated', 'sentados').toLowerCase()
          return (
            <div
              key={idx}
              onClick={() => handleClick(item)}
              className={`flex items-center gap-[11px] px-3 py-2.5 rounded-[11px] cursor-pointer border-[1.5px] transition ${active ? 'bg-[#FCE7F0] border-[#f7c2da]' : 'bg-white border-[#f0f0f2] hover:border-[#e2e2e6]'}`}
            >
              <div className={`w-[30px] h-[30px] rounded-[9px] flex-none flex items-center justify-center ${active ? 'bg-[#FCE7F0] text-[#EF5B94]' : 'bg-[#F0F0F2] text-[#a0a0a8]'}`}>
                <FloorPlanIcon className="w-[17px] h-[17px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-[#3A3A42] truncate capitalize">{t(item?.title)}</div>
                <div className="text-[10.5px] font-medium text-[#a0a0a8]">{mesas} {mesasLabel} · {sentados} {seatedLabel}</div>
              </div>
              {active &&
                <div className="w-[18px] h-[18px] rounded-full flex-none bg-[#EF5B94] flex items-center justify-center">
                  <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
              }
            </div>
          )
        })}
      </div>

      {/* ＋ Añadir plano — botón punteado rosa (proto línea 94) */}
      <button
        type="button"
        onClick={openNewPlano}
        className="flex-none flex items-center justify-center gap-[7px] p-[11px] rounded-[11px] bg-white border-[1.5px] border-dashed border-[#f0aecb] text-[#EF5B94] text-[12.5px] font-semibold cursor-pointer hover:bg-[#FCF2F6] transition-colors"
      >
        <span className="text-[15px] leading-none">＋</span>{t('addplano', 'Añadir plano')}
      </button>

      {/* MODAL CREAR PLANO (proto líneas 302-317) */}
      {newPlanoOpen &&
        <div
          onClick={closeNewPlano}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(43,43,48,.38)] px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[380px] max-w-full bg-white rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,.28)] p-6"
          >
            <div className="flex items-center gap-[11px] mb-[18px]">
              <div className="w-10 h-10 rounded-[11px] flex-none bg-[#FCE7F0] text-[#EF5B94] flex items-center justify-center">
                <FloorPlanIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[16px] font-bold text-[#3A3A42]">{t('newplanotitle', 'Crear plano nuevo')}</div>
                <div className="text-[11.5px] font-medium text-[#a0a0a8]">{t('newplanosubtitle', 'Un espacio para tu evento')}</div>
              </div>
            </div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba] mb-2">{t('planoname', 'Nombre del plano')}</div>
            <input
              type="text"
              value={newPlanoName}
              autoFocus
              onChange={(e) => setNewPlanoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePlano(); if (e.key === 'Escape') closeNewPlano() }}
              placeholder={t('planonameplaceholder', 'Ej. Jardín, Cóctel, Terraza…')}
              className="w-full p-3 rounded-[11px] border-[1.5px] border-[#E7E7EA] focus:border-[#EF5B94] outline-none bg-white text-[13px] font-medium text-[#3A3A42]"
            />
            {createNotice &&
              <div className="mt-3 bg-[#FCF2F6] border border-[#f7c2da] rounded-[999px] px-4 py-2 text-[11px] font-medium text-[#c14a78]">{createNotice}</div>
            }
            <div className="flex gap-[11px] justify-end mt-[22px]">
              <button type="button" onClick={closeNewPlano} className="px-5 py-[11px] rounded-[11px] bg-[#f7f7f9] text-[#6b6b72] text-[12.5px] font-semibold">{t('cancel', 'Cancelar')}</button>
              <button
                type="button"
                onClick={handleCreatePlano}
                className={`px-6 py-[11px] rounded-[11px] text-white text-[12.5px] font-semibold whitespace-nowrap shadow-[0_6px_16px_rgba(239,91,148,.28)] ${newPlanoName.trim() ? 'bg-[#EF5B94]' : 'bg-[#f0aecb]'}`}
              >
                {t('createplano', 'Crear plano')}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  )
}
