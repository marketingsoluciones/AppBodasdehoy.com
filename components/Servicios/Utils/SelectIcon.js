import { useField } from "formik";
import { AddIcon, Anillos, FuegosArtificiales, Baile, Baile2, Brindis, Carro, Cena, Cocteles, Comida, Fotografo, Iglesia, Maquillaje, Merienda, Novios, Salida, SesionFotos, Sol, Torta, Vestido, Dress } from "../../icons"
import { Modal } from "../../Utils/Modal";
import { IconList } from "../../Itinerario/MicroComponente/IconList";
import { useEffect, useState } from "react";
import { useAllowed } from "../../../hooks/useAllowed";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { useRouter } from "next/navigation";
import { IconArray } from "../VistaTabla/NewSelectIcon";

export const SelectIcon = ({ handleChange, ...props }) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [field] = useField({ name: props.name ?? '' })
  const [selectIcon, setSelectIcon] = useState()
  const [openIcon, setOpenIcon] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const r = useRouter()

  useEffect(() => {
    if (selectIcon) {
      /* helpers?.setValue(selectIcon) */
      handleChange("icon", selectIcon)
    }
  }, [selectIcon])

  return (
    <>
      {field?.value
        ? <div className={`${["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname) ? "" : "cursor-pointer hover:text-gray-800"} w-full h-full flex items-center justify-center text-gray-600 `}
          onClick={() => {
            ["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname) ?
              null :
              !isAllowed() ? ht() :
                ["/itinerario"].includes(window?.location?.pathname) ?
                  user?.uid === event?.usuario_id ?
                    setOpenIcon(!openIcon) :
                    props?.data?.estatus === false || props?.data?.estatus === null || props?.data?.estatus === undefined ? setOpenIcon(!openIcon) :
                      null :
                  setOpenIcon(!openIcon)

          }} {...props}>
          {IconArray.find((elem) => elem?.title === field?.value)?.icon ?? <span className="text-gray-400">?</span>}
        </div >
        : <div className={` ${["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname) ? "" : "cursor-pointer hover:text-gray-800"} w-full h-full flex items-center justify-center text-gray-600  `}
          onClick={() => {
            ["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname) ?
              null :
              !isAllowed() ? ht() :
                ["/itinerario"].includes(window?.location?.pathname) ?
                  user?.uid === event?.usuario_id ?
                    setOpenIcon(!openIcon) :
                    props?.data?.estatus === false || props?.data?.estatus === null || props?.data?.estatus === undefined ? setOpenIcon(!openIcon) :
                      null :
                  setOpenIcon(!openIcon)

          }}>
          <AddIcon />
        </div>
      }
      {
        openIcon
          ? <Modal openIcon={openIcon} setOpenIcon={setOpenIcon} classe={"h-max md:w-[30%] flex items-center justify-center"} >
            <IconList IterArry={IconArray} openIcon={openIcon} setOpenIcon={setOpenIcon} setSelectIcon={setSelectIcon} />
          </Modal>
          : null
      }
    </>
  )
}