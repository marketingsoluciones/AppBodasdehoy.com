import { useContext } from "react"
import AlertContext from "../context/AlertContext"

const prueba = () => {
    const {setAlerts} = useContext(AlertContext) 

    console.log(process.env.NEXT_PUBLIC_URL_API_SOCKET)
    return (
        <div>
            <button onClick={() => setAlerts(old => ([...old, "Nueva notificacion"]))}>Hola mundo</button>
        </div>
    )
}

export default prueba
