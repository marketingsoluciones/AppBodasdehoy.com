import { useState } from "react"
import { HeaderIter, BoddyIter } from "../components/Itinerario"
import { EventContextProvider } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
/* import { Modal } from "../modals/Modal" */
/* import { MyDocument } from "../CreatePDF" */

const Itinerario = () => {
    const [IterArryst, setIterArryst] = useState([])
    const [createPdf, setCreatePdf] = useState(false)
    const { event } = EventContextProvider()



    if (!event) return <></>
    return (
        <>
            {event &&
                <div className="space-y-4 h-[75vh]">
                    {/* <HeaderIter IterArryst={IterArryst} setIterArryst={setIterArryst} setCreatePdf={setCreatePdf} createPdf={createPdf} /> */}
                      <BoddyIter IterArryst={IterArryst} setIterArryst={setIterArryst} createPdf={createPdf} />
                </div>}
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