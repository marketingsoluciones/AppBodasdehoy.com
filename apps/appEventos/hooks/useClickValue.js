import { useEffect, useRef, useState } from "react"

export const useClickValue = () => {
    const [value, setValue] = useState("")
    const ref = useRef(null)
    


    useEffect(() => {
        (() => {
            const node = ref.current;
            if (node) {
                node.addEventListener('click', HandleClick);
            }

            return () => {
                node.addEventListener('click', HandleClick)
            }
        })()
    }, [ref.current])

    return [ref, value]
}