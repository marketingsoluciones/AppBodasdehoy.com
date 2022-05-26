import { useEffect, useState } from "react";

export const Loading = (set) => {
    set(true)
    setTimeout(() => {
        set(false)
    },1000)
}


export function useDelayUnmount(isMounted, delayTime) {
    const [ shouldRender, setShouldRender ] = useState(false);

    useEffect(() => {
        let timeoutId;
        if (isMounted && !shouldRender) {
            setShouldRender(true);
        }
        else if(!isMounted && shouldRender) {
            timeoutId = setTimeout(
                () => setShouldRender(false), 
                delayTime
            );
        }
        return () => clearTimeout(timeoutId);
    }, [isMounted, delayTime, shouldRender]);

    return shouldRender;
}

export const getCurrency = (value, currency) => {
    const defaultCurrency = currency || "EUR"
    const valor = parseFloat(value)
   return (valor).toLocaleString("es-ES", {
      style: "currency",
      currency: defaultCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
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