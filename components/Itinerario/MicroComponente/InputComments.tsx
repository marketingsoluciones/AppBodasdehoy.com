import { FC, useEffect, useState } from "react"
import { QuillEditor } from "./QuillEditor"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { Comment, FileData, Itinerary, Task } from "../../../utils/Interfaces"
import { useNotification } from "../../../hooks/useNotification"
import { IoIosSend } from "react-icons/io";
import { PlusIcon } from "../../icons"
import ClickAwayListener from "react-click-away-listener"
import { PiFileArrowUpThin } from "react-icons/pi"
import { IoClose } from "react-icons/io5";
import { SwiperPastedAndDropFiles } from "./SwiperPastedAndDropFiles"
import { LiaTrashSolid } from "react-icons/lia";
import { FileIconComponent } from "./FileIconComponent"
import { getStorage, ref, uploadBytesResumable } from "firebase/storage"
import { TempPastedAndDropFiles } from "./ItineraryPanel"
import { customAlphabet } from "nanoid"

interface props {
  itinerario: Itinerary
  task: Task
  tempPastedAndDropFiles: TempPastedAndDropFiles[]
  setTempPastedAndDropFiles: any
}

export type PastedAndDropFile = {
  _id?: string
  type: string
  name: string
  size: number
  file: string | ArrayBuffer
  loading: boolean
}

export const InputComments: FC<props> = ({ itinerario, task, tempPastedAndDropFiles, setTempPastedAndDropFiles }) => {
  const { user, config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [value, setValue] = useState<string>("<p><br></p>")
  const [valir, setValir] = useState(false)
  const [pastedAndDropFiles, setPastedAndDropFiles] = useState<PastedAndDropFile[]>([]);
  const [slideSelect, setSlideSelect] = useState(0)
  const [attachment, setAttachment] = useState(false);
  const notification = useNotification()
  const storage = getStorage();

  useEffect(() => {
    const valir = value?.replace(/ id="selected"/g, "")?.replace(/ focusoffset="[^"]*"/g, '').split("<p><br></p>").find(elem => elem !== "")

    /* Falta Validar espacios en blancos y saltos de linea al principio y al final*/
    // console.log(100011, !!valir, valir)
    // console.log(100012, value?.replace(/ id="selected"/g, "")?.replace(/ focusoffset="[^"]*"/g, '').split("<p><br></p><p><br></p>").filter(elem => elem !== ""))

    if (value && !!valir) {
      setValir(true)
    } else {
      setValir(false)
    }
  }, [value])

  useEffect(() => {
    setValue(undefined)
    setValir(false)
  }, [task._id])

  useEffect(() => {
    if (tempPastedAndDropFiles?.length) {
      const f1 = tempPastedAndDropFiles.findIndex((elem) => !elem.uploaded)
      if (tempPastedAndDropFiles[f1]?.files.length) {
        tempPastedAndDropFiles[f1].uploaded = true
        const promises = tempPastedAndDropFiles[f1]?.files.map(async (elem) => {
          const storageRef = ref(storage, `event-${event?._id}//itinerary-${itinerario?._id}//task-${tempPastedAndDropFiles[f1].taskID}//comment-${tempPastedAndDropFiles[f1].commentID}//${elem.name}`)
          const myBlob = new Blob([elem.file], { type: "text/plain" });
          return uploadBytesResumable(storageRef, myBlob)
            .then(() => {
              elem.loading = false
            })
            .catch((error) => { console.log(error) })
        })
        Promise.all(promises).then(() => {
          setTempPastedAndDropFiles([...tempPastedAndDropFiles])
        });
      }
    }
  }, [tempPastedAndDropFiles])

  const handleCreateComment = () => {
    setValir(false)
    if (value || pastedAndDropFiles.length) {
      const valueSend = value?.replace(/ id="selected"/g, "")?.replace(/ focusoffset="[^"]*"/g, '')
      const attachments = pastedAndDropFiles?.map((elem): FileData => {
        return { name: elem.name, size: elem.size }
      })
      fetchApiEventos({
        query: queries.createComment,
        variables: {
          eventID: event?._id,
          itinerarioID: itinerario?._id,
          taskID: task?._id,
          comment: valueSend,
          attachments
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
        if (pastedAndDropFiles?.length) {
          tempPastedAndDropFiles.push({
            taskID: task._id,
            commentID: results?._id,
            files: pastedAndDropFiles,
            uploaded: false,
          })
          setTempPastedAndDropFiles([...tempPastedAndDropFiles])
          handleClosePasteImages()
        }
        const focused = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${task._id}&comment=${results?._id}`
        notification({
          type: "user",
          message: ` ha escrito un comentario: ${valueSend.slice(0, 50)}${valueSend.length > 50 ? "..." : ""} | Evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
          uids: qwe,
          focused
        })
      })
      setValue("")
    }
  }

  const handleFileChange = async ({ event, type }) => {
    const files: File[] = event.target.files;
    // Creamos un array de promesas para procesar cada archivo
    const filePromises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event1) => {
          const payload = {
            type,//: file.type.indexOf('image') === 0 ? "image" : "file",
            file: event1.target.result,
            name: file.name,
            size: file.size,
            _id: customAlphabet('1234567890abcdef', 24)(),
            loading: true,
          };
          pastedAndDropFiles.push(payload); // Agregamos el archivo al array
          resolve(); // Resolvemos la promesa cuando termina la lectura del archivo
        };
        reader.readAsDataURL(file);
      });
    });
    // Esperamos que todas las promesas se resuelvan antes de actualizar el estado
    await Promise.all(filePromises).then((a) => {
      setPastedAndDropFiles([...pastedAndDropFiles]);
    })
  };

  const handleClosePasteImages = () => {
    let contenedorElement = document.getElementById(`contenedorEditor0-${task._id}`)
    let child = document.getElementById(`quillEditor-${task._id}`)
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
    setSlideSelect(0)
    setPastedAndDropFiles([])
    contenedorElement = document.getElementById(`contenedorAttachment0-${task._id}`)
    child = document.getElementById(`attachment-${task._id}`)
    if (contenedorElement && child) {
      contenedorElement?.appendChild(child)
    }
  };

  useEffect(() => {
    if (pastedAndDropFiles?.length) {
      let contenedorElement = document.getElementById(`contenedorEditor1-${task._id}`)
      let child = document.getElementById(`quillEditor-${task._id}`)
      if (contenedorElement && child) {
        contenedorElement?.appendChild(child)
        const divEditable = child.getElementsByClassName("ql-editor")[0] as any
        divEditable.focus()
      }
      contenedorElement = document.getElementById(`contenedorAttachment1-${task._id}`)
      child = document.getElementById(`attachment-${task._id}`)
      if (contenedorElement && child) {
        contenedorElement?.appendChild(child)
      }
    }
  }, [pastedAndDropFiles])

  return (
    <div className='bg-white flex items-center space-x-2 pt-2 px-2'>
      <div className='flex flex-1 relative'>
        {!!pastedAndDropFiles?.length && (
          <>
            {/* <div className="bg-white fixed w-full h-full top-0 left-0 opacity-30 z-20"></div> */}
            <div className='bg-gray-50 absolute z-[20] -translate-y-[calc(100%-90px)] w-full md:w-[90%] border-gray-200 border-[1px] rounded-md shadow-md flex flex-col items-center justify-center'>
              <div className='bg-gray-300 w-full h-8 flex justify-end items-center px-2'>
                <div onClick={() => {
                  if (slideSelect === pastedAndDropFiles.length - 1 && pastedAndDropFiles.length > 1) {
                    setSlideSelect(slideSelect - 1)
                  }
                  if (pastedAndDropFiles.length === 1) {
                    handleClosePasteImages()
                  }
                  pastedAndDropFiles.splice(slideSelect, 1)
                  setPastedAndDropFiles([...pastedAndDropFiles])
                }} className="cursor-pointer">
                  <LiaTrashSolid className="w-6 h-6 mr-6" />
                </div>
                <div onClick={() => {
                  handleClosePasteImages()
                }} className="text-gray-700 cursor-pointer">
                  <IoClose className="w-6 h-6" />
                </div>
              </div>
              {pastedAndDropFiles[slideSelect].type === "image"
                ? <img src={pastedAndDropFiles[slideSelect].file as string} alt="Imagen" style={{ maxWidth: '100%', maxHeight: '240px', minHeight: '150px' }} />
                : <div className="w-full h-[150px] flex flex-col items-center justify-center">
                  <FileIconComponent extension={pastedAndDropFiles[slideSelect].name.split(".").slice(-1)[0]} className="w-10 h-10 mb-2 border-[1px] border-gray-300 rounded-[5px]" />
                  <p className="w-[150px] text-center">{pastedAndDropFiles[slideSelect].name}</p>
                  <span className="text-gray-600">{Math.trunc(pastedAndDropFiles[slideSelect].size / 1024)} K</span>
                </div>
              }
              <div id={`contenedorEditor1-${task._id}`} className='bg-gray-200 w-full min-h-[52px] flex items-center px-2'>
                {/* <QuillEditor value={value} setValue={setValue} handlePaste={handlePaste} /> */}
              </div>
              <div className='bg-gray-100 flex w-full h-10'>
                <div className="w-14 h-full flex justify-center items-center">
                  <div id={`contenedorAttachment1-${task._id}`}>
                    {/* <div onClick={() => { setAttachment(!attachment) }} className='w-10 h-10 flex justify-center items-center hover:bg-white rounded-full cursor-pointer'>
                    <PlusIcon className="w-5 h-5 text-gray-700" />
                  </div> */}
                  </div>
                </div>
                <div className="flex-1 h-full flex justify-center items-center">
                  {pastedAndDropFiles.length > 1 && <SwiperPastedAndDropFiles pastedAndDropFiles={pastedAndDropFiles} setSlideSelect={setSlideSelect} slideSelect={slideSelect} />}
                </div>
                <span onClick={true ? handleCreateComment : () => { }} className={`${true ? "cursor-pointer font-semibold" : "text-gray-400"} w-10 flex justify-center items-center right-3 bottom-[10.5px]`} >
                  <IoIosSend className={`h-[23px] w-auto ${true ? "text-teal-500" : "text-gray-200"} select-none`} />
                </span>
              </div>
            </div>
          </>
        )}
        <div className='flex justify-center items-center'>
          <input type="file" accept='image/*' onChange={(event) => handleFileChange({ event, type: "image" })} id={`file-upload-img-${task._id}`} className="hidden" multiple />
          <input type="file" onChange={(event) => handleFileChange({ event, type: "doc" })} id={`file-upload-doc-${task._id}`} className="hidden" multiple />
          <div id={`contenedorAttachment0-${task._id}`}>
            <div id={`attachment-${task._id}`}>
              <ClickAwayListener onClickAway={() => { setAttachment(false) }}>
                <div className='cursor-pointer select-none'>
                  <div className='translate-y-[4px]'>
                    {attachment && (
                      <div className='bg-white w-40 absolute z-50 -translate-y-full -translate-x-4 border-gray-200 border-[1px] rounded-md shadow-md'>
                        <ul onClick={() => { }} className='py-2 px-1 text-[11px]'>
                          {/* <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>

                            <label htmlFor={`file-upload-img-${task._id}`} className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                              <PiImageSquareThin className='w-6 h-6' />
                              <span>Fotos y videos</span>
                            </label>
                          </li> */}
                          {/* <li className='flex space-x-2 p-1 cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                          <PiCameraThin className='w-6 h-6' />
                          <span className='font-semibold'>Cámara</span>
                        </li> */}
                          <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                            <label htmlFor={`file-upload-doc-${task._id}`} className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                              <PiFileArrowUpThin className='w-6 h-6' />
                              <span>Adjuntar archivo</span>
                            </label>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div onClick={() => {
                    setTimeout(() => {
                      setAttachment(!attachment)
                    }, 10);
                  }} className={`w-10 h-10 flex justify-center items-center ${pastedAndDropFiles?.length ? "hover:bg-white" : "hover:bg-gray-100"} rounded-full`}>
                    <PlusIcon className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
              </ClickAwayListener>
            </div>
          </div>
        </div>
        <div id={`contenedorEditor0-${task._id}`} className='w-full min-h-[52px] flex items-center'>
          <div id={`quillEditor-${task._id}`} className="w-full">
            <QuillEditor value={value} setValue={setValue} setPastedAndDropFiles={setPastedAndDropFiles} pastedAndDropFiles={pastedAndDropFiles} setValir={setValir} />
          </div>
        </div>
        {!pastedAndDropFiles.length && <span onClick={valir ? handleCreateComment : () => { }} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-400"} absolute right-3 bottom-[10.5px]`} >
          <IoIosSend className={`h-[23px] w-auto ${valir ? "text-teal-500" : "text-gray-200"} select-none`} />
        </span>}
      </div>
    </div>
  )
}