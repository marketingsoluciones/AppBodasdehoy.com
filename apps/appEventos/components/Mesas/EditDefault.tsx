import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching"
import { EditDefaultState } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon } from "../icons"

import { MdRotateRight, MdRotateLeft } from 'react-icons/md'
import { useAllowed } from "../../hooks/useAllowed"


export const EditDefault: FC<EditDefaultState> = ({ item, setShowFormEditar, itemTipo }) => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, editDefault, setEditDefault } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()

  const handleDeleteItem = async () => {
    try {
      setEditDefault({})
      const arrayKey = `${itemTipo}s`
      // Update inmutable: filtrar el item borrado del planSpaceActive.
      const newPlanSpaceActive = {
        ...planSpaceActive,
        [arrayKey]: planSpaceActive[arrayKey].filter(elem => elem._id !== item._id),
      }
      setPlanSpaceActive(newPlanSpaceActive)
      setEvent((prev) => ({
        ...prev,
        galerySvgs: (prev?.galerySvgs ?? []).filter(elem => elem._id !== item._id),
        planSpace: prev.planSpace.map(ps =>
          ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
        ),
      }))
      if (itemTipo == "table") {
        await fetchApiEventos({
          query: queries.deleteTable,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            tableID: item._id
          }
        })
        // Toast con «Deshacer» (MesasUndoToast escucha este evento).
        window.dispatchEvent(new CustomEvent('mesas-toast', { detail: { action: 'delete', table: item } }))
      }
      if (itemTipo == "element") {
        await fetchApiBodas({
          query: queries.deleteElement,
          variables: {
            evento_id: event._id,
            element_id: item._id
          }
        })
      }
    } catch {
    }
  }
  const handleRotate = async (direcction) => {
    // Calcular nueva rotación sin mutar el item.
    let newRotation: number
    const currentRotation = typeof item?.rotation === 'number' ? item.rotation : 0
    if (currentRotation === 0 && direcction === "left") {
      newRotation = 360 - 15
    } else {
      newRotation = currentRotation + (direcction === "left" ? -15 : 15)
      if (newRotation === 360) newRotation = 0
      if (newRotation < 0) newRotation = 360 + newRotation
    }
    const arrayKey = itemTipo === "table" ? "tables" : "elements"
    // Update inmutable: rotación del item dentro de planSpaceActive y event.
    const newPlanSpaceActive = {
      ...planSpaceActive,
      [arrayKey]: planSpaceActive[arrayKey].map(elem =>
        elem._id !== item._id ? elem : { ...elem, rotation: newRotation }
      ),
    }
    setPlanSpaceActive(newPlanSpaceActive)
    setEvent((prev) => ({
      ...prev,
      planSpace: prev.planSpace.map(ps =>
        ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
      ),
    }))
    if (itemTipo === "table") {
      // BUG-M-03 (informe QA 22-jun): la mutación se disparaba pero no persistía.
      // Causa: JSON.stringify(15) = "15" (string) y backend espera number. Si
      // valor es number, va sin stringify; si el backend exige string, va el
      // toString plano (no JSON-encoded).
      await fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive?._id,
          tableID: item._id,
          variable: "rotation",
          valor: String(newRotation)
        }
      })
    }
    if (itemTipo === "element") {
      await fetchApiBodas({
        query: queries.editElement,
        variables: {
          evento_id: event._id,
          element_id: item._id,
          datos: { rotation: newRotation }
        }
      })
    }
  }

  // Agrandar/achicar el elemento (fiel al HTML: scaleFurn ±). Escala el size de forma
  // inmutable y lo persiste con editElement (mismo patrón que la rotación). Solo elementos.
  const handleScale = async (factor: number) => {
    const current = item?.size && typeof item.size.width === 'number' ? item.size : { width: 80, height: 80 }
    const clamp = (v: number) => Math.max(24, Math.min(600, Math.round(v)))
    const newSize = { width: clamp(current.width * factor), height: clamp(current.height * factor) }
    const newPlanSpaceActive = {
      ...planSpaceActive,
      elements: planSpaceActive.elements.map(elem =>
        elem._id !== item._id ? elem : { ...elem, size: newSize }
      ),
    }
    setPlanSpaceActive(newPlanSpaceActive)
    setEvent((prev) => ({
      ...prev,
      planSpace: prev.planSpace.map(ps =>
        ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
      ),
    }))
    await fetchApiBodas({
      query: queries.editElement,
      variables: { evento_id: event._id, element_id: item._id, datos: { size: newSize } }
    })
  }

  return (
    <div className="bg-transparent absolute w-full h-full flex flex-col items-center justify-between py-3" >
      <button disabled={!isAllowed()} onClick={handleDeleteItem} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <BorrarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button onClick={() => {
        setEditDefault({ ...editDefault, activeButtons: false })
        setShowFormEditar({ table: item, visible: true })
      }}
        className={`bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center`}
        disabled={!isAllowed() || itemTipo === "element"}>
        <EditarIcon className={`${itemTipo === "table" ? "text-gray-600" : "text-gray-300"} w-5 h-5`} />
      </button>
      {itemTipo === "element" &&
        <>
          <button disabled={!isAllowed()} onClick={() => handleScale(1.2)} title="Agrandar" className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center text-gray-600 text-lg leading-none">＋</button>
          <button disabled={!isAllowed()} onClick={() => handleScale(1 / 1.2)} title="Achicar" className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center text-gray-600 text-lg leading-none">−</button>
        </>
      }
      <button disabled={!isAllowed()} onClick={() => { handleRotate("right") }} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <MdRotateRight className="text-gray-600 w-5 h-5" />
      </button>
      <button disabled={!isAllowed()} onClick={() => { handleRotate("left") }} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <MdRotateLeft className="text-gray-600 w-5 h-5" />
      </button>
    </div>
  )
}

