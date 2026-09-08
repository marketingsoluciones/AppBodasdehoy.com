import React, { FC, useMemo } from "react";
import { guests } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";
import { EventContextProvider } from "../../context";
import { ImageProfile } from "../../utils/Funciones";
import { useTranslation } from "react-i18next";
import type { GuestFilter } from "./BlockInvitados";

interface propsListInvitados {
  setEditInv: any
  editInv: any
  setSelected: any
  filter?: GuestFilter
}

const ListInvitados: FC<propsListInvitados> = ({ editInv, setEditInv, setSelected, filter = 'todos' }) => {
  const { t } = useTranslation()
  const { filterGuests, event } = EventContextProvider()

  // Mapa _id → nombre de TODOS los invitados: para poder etiquetar a un acompañante con el
  // nombre de su padre aunque el padre no esté en esta misma lista (p. ej. padre por sentar).
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
      ; (event?.invitados_array || []).forEach((g: any) => { if (g?._id) m.set(g._id, g?.nombre) })
    return m
  }, [event?.invitados_array])

  // Función para ordenar invitados agrupando padres e hijos (no sentados)
  const sortedGuests = useMemo(() => {
    if (!filterGuests?.noSentados) return [];

    const guests = filterGuests.noSentados.filter((g) => g != null) as guests[];
    const result: any[] = [];
    const processed = new Set();

    // Primero agregamos todos los invitados que no tienen padre (raíces)
    guests.forEach(guest => {
      if (!guest.father && !processed.has(guest._id)) {
        result.push(guest);
        processed.add(guest._id);

        // Buscamos y agregamos todos los hijos de este invitado
        const addChildren = (parentId: string) => {
          guests.forEach(child => {
            if (child.father === parentId && !processed.has(child._id)) {
              // Agregamos la propiedad isChild y parentName para indicar que está después de su padre
              const childWithFlag = {
                ...child,
                isChild: true,
                parentName: guest.nombre || 'Sin nombre' // Usando la propiedad correcta 'nombre'
              };
              result.push(childWithFlag);
              processed.add(child._id);
              // Recursivamente agregamos los nietos
              addChildren(child._id);
            }
          });
        };

        addChildren(guest._id);
      }
    });

    // Agregamos cualquier invitado restante que no haya sido procesado
    guests.forEach(guest => {
      if (!processed.has(guest._id)) {
        result.push(guest);
        processed.add(guest._id);
      }
    });

    return result;
  }, [filterGuests?.noSentados]);

  // Sentados agrupando acompañantes DEBAJO de su invitado (para saber que van juntos).
  const seated = useMemo(() => {
    const arr = (filterGuests?.sentados ?? []).filter((g) => g != null) as any[];
    const result: any[] = [];
    const processed = new Set();
    arr.forEach((g) => {
      if (!g.father && !processed.has(g._id)) {
        result.push(g); processed.add(g._id);
        const addKids = (pid: string) => arr.forEach((c) => {
          if (c.father === pid && !processed.has(c._id)) {
            result.push({ ...c, isChild: true, parentName: g.nombre || nameById.get(pid) || 'Sin nombre' });
            processed.add(c._id); addKids(c._id);
          }
        });
        addKids(g._id);
      }
    });
    // Acompañantes cuyo padre NO está sentado: al final, etiquetados con el padre del evento.
    arr.forEach((g) => {
      if (!processed.has(g._id)) {
        result.push(g.father ? { ...g, isChild: true, parentName: nameById.get(g.father) || 'Sin nombre' } : g);
        processed.add(g._id);
      }
    });
    return result;
  }, [filterGuests?.sentados, nameById]);

  const showPending = filter === 'todos' || filter === 'porsentar'
  const showSeated = filter === 'todos' || filter === 'sentados'

  return (
    <>
      <div className="w-full flex flex-col gap-0.5 py-1">
        {/* POR SENTAR — arrastrables. Se mantienen SIEMPRE montados (solo se ocultan por
            CSS) para no romper el binding de interact.js (dragN / js-dragInvitadoN). */}
        <div className={showPending ? '' : 'hidden'}>
          {sortedGuests.length > 0 &&
            <div className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a0a0a8]">
              {t('tobeseated')} · {sortedGuests.length}
            </div>
          }
          {sortedGuests.map((invitado, index) => (
            <div key={invitado._id} className="flex items-center">
              <DragInvitado
                key={invitado._id}
                tipo={"invitado"}
                index={index}
                invitado={invitado}
                editInv={editInv}
                setEditInv={setEditInv}
                setSelected={setSelected}
              />
            </div>
          ))}
        </div>

        {/* SENTADOS — solo lectura con etiqueta de asiento (Mesa · A{chair+1}). */}
        <div className={showSeated ? '' : 'hidden'}>
          <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EF5B94]">
            {t('seated')} · {seated.length}
          </div>
          {seated.length === 0 && showSeated &&
            <div className="px-3 py-3 text-[11px] text-center text-[#a0a0a8]">{t('nonseatedguests')}</div>
          }
          {seated.map((g) => (
            <div key={g._id} className="w-full flex items-center gap-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition" style={{ paddingLeft: g.isChild ? 26 : 12, paddingRight: 12 }}>
              {g.isChild && <span className="text-[#c4c4cc] -ml-3 flex-none">↳</span>}
              <img
                className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
                src={ImageProfile[g.sexo]?.image || "/profile_men.png"}
                alt={ImageProfile[g.sexo]?.alt || "Invitado"}
              />
              <span className="flex-1 min-w-0 font-display text-sm truncate text-gray-600">{g?.nombre?.trim() ? g.nombre : (g.isChild ? `Acompañante de ${g.parentName}` : t('companion', 'Acompañante'))}</span>
              <span className="text-[10px] font-semibold text-[#EF5B94] bg-[#FCE7F0] px-2 py-0.5 rounded-md whitespace-nowrap">
                {g.nombre_mesa ? `${g.nombre_mesa} · ` : ''}A{(g.chair ?? 0) + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          ul {
            min-height: 15rem
          }
          `}
      </style>
    </>
  );
};

export default ListInvitados;
