import { useEffect, useRef, useState } from "react"

export const useClickValue = (): [React.MutableRefObject<any>, string] => {
    const [value, setValue] = useState("")
    const ref = useRef<any>(null)

    // HandleClick no estaba definido en .js original — stub para evitar referencia rota
    const HandleClick = () => { /* TODO: implementar */ };

    useEffect(() => {
        (() => {
            const node = ref.current;
            if (node) {
                node.addEventListener('click', HandleClick);
            }

            return () => {
                if (node) node.removeEventListener('click', HandleClick)
            }
        })()
    }, [ref.current])

    return [ref, value]
}