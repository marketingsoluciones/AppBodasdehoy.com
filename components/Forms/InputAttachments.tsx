import { useField } from "formik"
import React, { ChangeEvent, FC, InputHTMLAttributes } from "react"
import { useAllowed } from "../../hooks/useAllowed";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { IoIosAttach } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { PlusIcon } from "../icons";
import { MdCheck, MdClose } from "react-icons/md";
import { getStorage, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { FileData, Task } from "../../utils/Interfaces";
import { customAlphabet } from "nanoid";
import { fetchApiEventos, queries } from "../../utils/Fetching";

interface props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
  disabled?: boolean
  labelClass?: boolean
  task: Task
  itinerarioID: string
}
interface Flag {
  pre: string
  name: string
  cod: number
}

const InputAttachments: FC<Partial<props>> = ({ label, task, itinerarioID, className, disabled = false, labelClass = true, ...props }) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [field, meta, helpers] = useField({ name: props.name })
  const [isAllowed, ht] = useAllowed()
  const storage = getStorage();

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const files = [...Array.from(e.target.files)]
      let attachments: FileData[] = [...field.value, ...files.map((elem: File): FileData => { return { _id: undefined, name: elem.name, size: elem.size } })]
      helpers.setValue([...attachments])
      files.map((elem) => {
        console.log(100040, elem)
        const storageRef = ref(storage, `${task._id}//${elem.name}`)
        uploadBytesResumable(storageRef, elem)
          .then(() => {
            const f1a = attachments.findIndex((el: FileData) => el.name === elem.name)
            attachments[f1a]._id = customAlphabet('1234567890abcdef', 24)()
            fetchApiEventos({
              query: queries.editTask,
              variables: {
                eventID: event._id,
                itinerarioID,
                taskID: task._id,
                variable: "all",
                valor: JSON.stringify({ ...task, attachments })
              },
              domain: config.domain
            })
              .then(() => {
                helpers.setValue([...attachments])
                const f1 = event.itinerarios_array.findIndex(elm => elm._id === itinerarioID)
                const f2 = event.itinerarios_array[f1].tasks.findIndex(elm => elm._id === task._id)
                event.itinerarios_array[f1].tasks[f2].attachments = [...attachments]
                setEvent({ ...event })
              })
          })
      })

    } catch (error) {
      console.log(error)
    }
  }

  const handleDeleteFromInput = (elem) => {
    const storageRef = ref(storage, `${task._id}//${elem.name}`)
    deleteObject(storageRef)
      .then(() => { })
      .catch(() => { })
    const f1 = field.value.findIndex(el => el.name === elem.name)
    field.value.splice(f1, 1)
    fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID,
        taskID: task._id,
        variable: "all",
        valor: JSON.stringify({ ...task, attachments: field.value })
      },
      domain: config.domain
    }).then(() => {
      helpers.setValue([...field.value])
      const f1 = event.itinerarios_array.findIndex(elm => elm._id === itinerarioID)
      const f2 = event.itinerarios_array[f1].tasks.findIndex(elm => elm._id === task._id)
      event.itinerarios_array[f1].tasks[f2].attachments = [...field.value]
      setEvent({ ...event })
    })
  }

  return (
    <div className="w-full h-max relative">
      <label className={`capitalize font-display text-primary text-sm w-full inline-flex`}>{label} <IoIosAttach className="w-4 h-5 text-gray-600" /> </label>
      <div className="w-full relative ">
        <div className={`border-[1px] border-gray-300 flex items-center gap-1`} >
          <p className="bg-white w-full py-2 text-gray-900 p-1">
            {!!field?.value?.length && [...field?.value]?.map((elem, idx) =>
              <div key={idx} className="flex ml-2 mt-1 px-2 py-1 md:py-0 items-center leading-[1.2] space-x-1 border-[1px] rounded-[4px] bg-gray-200 ">
                <span className="flex-1 text-[13px] truncate">{elem?.name}</span>
                <span className="text-[11px] font-semibold">({Math.trunc(elem.size / 1024)} K)</span>
                {elem?._id
                  ? <MdCheck />
                  : <div className="w-5 flex justify-center items-center">
                    <div className="loader ease-linear rounded-full border-[3px] border-gray-50 w-4 h-4" />
                  </div>
                }
                <div onClick={() => handleDeleteFromInput(elem)} className="w-6 h-5 flex justify-center items-center cursor-pointer p-1">
                  <MdClose className="hover:text-gray-500" />
                </div>
              </div>
            )}
            <label htmlFor="attachments" className="cursor-pointer">
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm select-none">Cargar archivos</span>
                <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
              </div>
            </label>
          </p>
        </div>
        <input
          id="attachments"
          type="file"
          multiple
          name="attachments"
          required
          onChange={(e) => handleOnChange(e)}
          className="hidden"
          //accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={false}
        />
      </div>
      <style jsx>
        {`
          .loader {
              border-top-color:  ${config?.theme?.primaryColor};
              -webkit-animation: spinner 1.5s linear infinite;
              animation: spinner 1.5s linear infinite;
          }
          @-webkit-keyframes spinner {
              0% {
              -webkit-transform: rotate(0deg);
              }
              100% {
              -webkit-transform: rotate(360deg);
              }
          }
          @keyframes spinner {
              0% {
              transform: rotate(0deg);
              }
              100% {
              transform: rotate(360deg);
              }
          }
        `}
      </style>
    </div>
  )
}

export default React.memo(InputAttachments)
