import { useEffect, useState } from "react";

export const Loading = (set) => {
  set(true)
  setTimeout(() => {
    set(false)
  }, 1000)
}


export function useDelayUnmount(isMounted, delayTime) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isMounted && !shouldRender) {
      setShouldRender(true);
    }
    else if (!isMounted && shouldRender) {
      timeoutId = setTimeout(
        () => setShouldRender(false),
        delayTime
      );
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, delayTime, shouldRender]);

  return shouldRender;
}

export const getCurrency = (value, currency = "EUR") => {
  const v = parseFloat(!!value ? value : 0)
  return v.toLocaleString(navigator.language, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const getAllFilterGuest = (event) => {
  if (event) {
    return event.planSpace.map((planSpace) => {
      const guestsSections = planSpace?.sections?.reduce((sections, section) => {
        const guestsSection = section?.tables?.reduce((tables, table) => {
          if (table?.guests?.length > 0) {
            const asd = table.guests.map(elem => {
              return {
                guestID: elem._id,
                planSpaceID: planSpace?._id,
                sectionID: undefined,
                tableID: table._id,
                chair: elem.chair,
                order: elem.order,
              }
            })
            tables = [...tables, asd]
          }
          return tables
        }, [])
        sections.push(...guestsSection)
        return sections
      }, [])
      const guestsTables = planSpace?.tables?.reduce((tables, table) => {
        if (table?.guests?.length > 0) {
          const asd = table.guests.map(elem => {
            return {
              guestID: elem._id,
              planSpaceID: planSpace._id,
              sectionID: undefined,
              tableID: table._id,
              chair: elem.chair,
              order: elem.order,
            }
          })
          tables = [...tables, ...asd]
        }
        return tables
      }, [])
      const guestsSentados = [...guestsSections, ...guestsTables]
      const guestsSentadosIds = guestsSentados.map(elem => elem.guestID)
      const filterGuest = event?.invitados_array?.reduce((acc, item) => {
        if (guestsSentadosIds?.includes(item._id)) {
          const guest = guestsSentados.find(elem => elem.guestID === item._id)
          acc.sentados.push({
            ...item,
            ...guest
          })
          return acc
        }
        acc.noSentados.push(item)
        return acc
      }, { sentados: [], noSentados: [] })
      return filterGuest
    })
  }

}


// Objeto de icono perfil
export const ImageProfile = {
  hombre: {
    image: "/profile_men.png",
    alt: "Hombre",
  },
  mujer: {
    image: "profile_woman.png",
    alt: "Mujer",
  },
};