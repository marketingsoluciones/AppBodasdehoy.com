import { FC, useEffect, useRef, useState } from "react"
import { QuillEditor } from "./QuillEditor"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { useNotification } from "../../../hooks/useNotification"
import { IoIosSend } from "react-icons/io";
import { PlusIcon } from "../../icons"
import ClickAwayListener from "react-click-away-listener"
import { PiFileArrowUpThin, PiImageSquareThin } from "react-icons/pi"
import { IoClose } from "react-icons/io5";

interface props {
  itinerario: Itinerary
  task: Task
}

export const InputComments: FC<props> = ({ itinerario, task }) => {
  const { user, config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [value, setValue] = useState<string>("<p><br></p>")
  const [valir, setValir] = useState(false)
  const [pastedImage, setPastedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachment, setAttachment] = useState(false);
  const notification = useNotification()

  useEffect(() => {
    if (value && value !== "<p><br></p>") {
      setValir(true)
    } else {
      setValir(false)
    }
  }, [value])

  useEffect(() => {
    setValue(undefined)
    setValir(false)
  }, [task._id])

  const handleCreateComment = () => {
    if (value) {
      fetchApiEventos({
        query: queries.createComment,
        variables: {
          eventID: event?._id,
          itinerarioID: itinerario?._id,
          taskID: task?._id,
          comment: value
        },
        domain: config.domain
      }).then((results: Comment) => {
        const f1 = event?.itinerarios_array.findIndex(elm => elm?._id === itinerario?._id)
        const f2 = event?.itinerarios_array[f1]?.tasks.findIndex(elm => elm?._id === task?._id)
        event?.itinerarios_array[f1]?.tasks[f2]?.comments.push(results)
        setEvent({ ...event })
        const asd = event.detalles_compartidos_array.filter(elem => ["edit", "view"].includes(elem.permissions.find(el => el.title === "servicios").value)).map(elem => elem.uid)
        let qwe = [...asd, event.usuario_id]
        const af1 = qwe.findIndex(elem => elem === user?.uid)
        if (af1 > -1) {
          qwe.splice(af1, 1)
        }
        const focused = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${task._id}&comment=${results._id}`
        notification({
          type: "user",
          message: ` ha escrito un comentario: ${value.slice(0, 50)}${value.length > 50 ? "..." : ""} | Evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
          uids: qwe,
          focused
        })
      })
      setValue("")
    }
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  useEffect(() => {
    if (pastedImage) {
      const contenedorElement = document.getElementById(`contenedorEditor1-${task._id}`)
      const child = document.getElementById(`quillEditor-${task._id}`)
      if (contenedorElement && child) {
        contenedorElement?.appendChild(child)
        const divEditable = child.getElementsByClassName("ql-editor")[0] as any
        divEditable.focus()
      }
    }
  }, [pastedImage])

  return (
    <div className='bg-white flex items-center space-x-2 pt-2 px-2'>
      <div className='flex flex-1 relative'>
        {pastedImage && (
          <div className='bg-gray-50 absolute z-[20] -translate-y-[calc(100%-60px)] w-[85%] truncate border-gray-200 border-[1px] rounded-md shadow-md flex flex-col items-center justify-center'>
            <div className='bg-gray-300 w-full h-8 flex justify-end items-center px-2'>
              <div onClick={() => {
                const contenedorElement = document.getElementById(`contenedorEditor0-${task._id}`)
                const child = document.getElementById(`quillEditor-${task._id}`)
                if (contenedorElement && child) {
                  contenedorElement?.appendChild(child)
                  const divEditable = child.getElementsByClassName("ql-editor")[0] as HTMLElement
                  divEditable.focus()
                  if (divEditable.textContent.length > 0) {
                    setValir(true)
                  }
                  setTimeout(() => {
                    divEditable.scrollTop = divEditable.scrollHeight;
                  }, 50);
                }
                setPastedImage(false)
              }} className="text-gray-700 cursor-pointer">
                <IoClose className="w-6 h-6" />
              </div>
            </div>
            <img src={pastedImage} alt="Imagen pegada" style={{ maxWidth: '100%', maxHeight: '260px', minHeight: '150px' }} />
            <div id={`contenedorEditor1-${task._id}`} className='bg-gray-200 w-full min-h-[52px] flex items-center px-2'>
              {/* <QuillEditor value={value} setValue={setValue} handlePaste={handlePaste} /> */}
            </div>
            <div className='bg-gray-100 flex w-full h-10'>
              <div className="w-14 h-full flex justify-center items-center">
                <div onClick={() => { setAttachment(!attachment) }} className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                  <PlusIcon className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <div className="flex-1 h-full"></div>
              <span onClick={true ? handleCreateComment : () => { }} className={`${true ? "cursor-pointer font-semibold" : "text-gray-400"} w-10 flex justify-center items-center right-3 bottom-[10.5px]`} >
                <IoIosSend className={`h-[23px] w-auto ${true ? "text-teal-500" : "text-gray-200"} select-none`} />
              </span>
            </div>
          </div>
        )}
        <div className='flex justify-center items-center'>
          <input type="file" accept='image/*' onChange={handleFileChange} id="file-upload-img" className="hidden" multiple />
          <input type="file" onChange={handleFileChange} id="file-upload-doc" className="hidden" multiple />
          <ClickAwayListener onClickAway={() => { setAttachment(false) }}>
            <div className='cursor-pointer '>
              <div className='translate-y-[4px]'>
                {attachment && (
                  <div className='bg-white w-40 absolute z-50 -translate-y-full -translate-x-4 border-gray-200 border-[1px] rounded-md shadow-md'>
                    <ul onClick={() => { }} className='py-2 px-1 text-[11px]'>
                      <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>

                        <label htmlFor="file-upload-img" className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                          <PiImageSquareThin className='w-6 h-6' />
                          <span>Fotos y videos</span>
                        </label>
                      </li>
                      {/* <li className='flex space-x-2 p-1 cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                          <PiCameraThin className='w-6 h-6' />
                          <span className='font-semibold'>Cámara</span>
                        </li> */}
                      <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                        <label htmlFor="file-upload-doc" className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                          <PiFileArrowUpThin className='w-6 h-6' />
                          <span>Documentos</span>
                        </label>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div onClick={() => { setAttachment(!attachment) }} className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                <PlusIcon className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </ClickAwayListener>
        </div>
        <div id={`contenedorEditor0-${task._id}`} className='w-full min-h-[52px] flex items-center'>
          <div id={`quillEditor-${task._id}`} className="w-full">
            <QuillEditor value={value} setValue={setValue} setPastedImage={setPastedImage} pastedImage={pastedImage} setValir={setValir} />
          </div>
        </div>
        {!pastedImage && <span onClick={valir ? handleCreateComment : () => { }} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-400"} absolute right-3 bottom-[10.5px]`} >
          <IoIosSend className={`h-[23px] w-auto ${valir ? "text-teal-500" : "text-gray-200"} select-none`} />
        </span>}
      </div>
    </div>
  )
}