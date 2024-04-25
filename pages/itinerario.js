import { useState } from "react"
/* import { MyDocument } from "../CreatePDF" */
import { HeaderIter, BoddyIter } from "../components/Itinerario"
import { EventContextProvider } from "../context"
/* import { Modal } from "../modals/Modal" */

const Itinerario = () => {
    const [IterArryst, setIterArryst] = useState([])
    const [createPdf, setCreatePdf] = useState(false)
    const { event } = EventContextProvider()

    console.log("en itinerario 1 =>>>", event)

    if (!event) return <></>
    return (
        <>
            <div onClick={() => console.log("atras")} className="flex items-center z-10 text-gray-700 cursor-pointer py-1 space-x-2">
                <span>Volver</span>
            </div>
            <div className="space-y-4 h-[75vh]">
                <HeaderIter IterArryst={IterArryst} setIterArryst={setIterArryst} setCreatePdf={setCreatePdf} createPdf={createPdf} />
                <BoddyIter IterArryst={IterArryst} setIterArryst={setIterArryst} createPdf={createPdf} />
            </div>
            {/*      
                {
                    createPdf ? (
                        <Modal openIcon={createPdf} setOpenIcon={setCreatePdf} classe={"h-[50%] w-[85%]"} >
                            <MyDocument IterArryst={IterArryst} />
                        </Modal>
                    ) : null
                } 
            */}
        </>
    )
}

export default Itinerario