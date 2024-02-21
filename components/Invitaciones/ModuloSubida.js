import { useEffect, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";

const ModuloSubida = ({ event, use }) => {
  const [cargado, setCargado] = useState({ titulo: "esperando archivo" });
  const [imagePreviewUrl, setImagePreviewUrl] = useState({
    file: {},
    preview: false,
    image: `${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgInvitacion?.i800}`,
  });
  const toast = useToast()
  const { setEvent } = EventContextProvider()
  const [showAddImg, setShowAddImg] = useState(true)
  const [sendedImg, setSendedImg] = useState(false)
  const [isAllowed, ht] = useAllowed()

  const subir_archivo = async () => {
    try {
      if (imagePreviewUrl?.file?.type && !sendedImg) {
        const newFile = new FormData();
        const params = {
          query: `mutation ($file: Upload!, $_id : String, $use : String) {
                singleUpload(file: $file, _id:$_id, use : $use){
                  _id
                  i1024
                  i800
                  i640
                  i320
                  createdAt
                }
              }
            `,
          variables: {
            file: null,
            _id: event?._id,
            use: use,
          },
        };

        let map = {
          0: ["variables.file"],
        };

        newFile.append("operations", JSON.stringify(params));
        newFile.append("map", JSON.stringify(map));
        newFile.append("0", imagePreviewUrl.file, imagePreviewUrl.file.name);


        const { data } = await api.UploadFile(newFile);
        setEvent((old) => {
          return { ...old, imgInvitacion: data?.data?.singleUpload }
        })
        setSendedImg(true)
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setSendedImg(false)
    subir_archivo()
  }, [imagePreviewUrl?.file])

  const handleChange = (e) => {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    if (file?.size < 5000000) {
      reader.onloadend = () => {
        const imagePreviewUrl = { file: file, image: reader.result, preview: true }
        setImagePreviewUrl(imagePreviewUrl);
      };
      reader.readAsDataURL(file);
    } else {
      toast("error", "Upss... La imagen es muy pesada (Máximo 5MB)")
    }
  };

  useEffect(() => {
    setShowAddImg(!event?.imgInvitacion?.i800 && !imagePreviewUrl.preview ? true : false)
  }, [event?.imgInvitacion?.i800, imagePreviewUrl.preview])

  return (
    <>
      <div className=" w-full z-10 h-full background-image bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-xl shadow-lg flex flex-col text-white items-center justify-center  overflow-hidden">
        <input
          id="file"
          type="file"
          name="file"
          accept="image/*"
          required
          onChange={(e) => handleChange(e)}
          className="hidden"
        />
        {showAddImg && (
          <label
            onClick={() => !isAllowed() ? ht() : null}
            htmlFor={!isAllowed() ? "null" : "file"}
            className="hover:scale-120 transform text-md flex flex-col items-center justify-center gap-1 cursor-pointer relative"
          >
            <SubirImagenIcon />
            {imagePreviewUrl.preview ? cargado.titulo : "Añadir invitación"}
          </label>
        )}
        <div className="w-full flex flex-col text-gray-500 bottom-0 translate-y-full absolute">
          <label onClick={() => !isAllowed() ? ht() : null} htmlFor={!isAllowed() ? "null" : "file"} className="gap-1 flex items-center justify-center w-full bg-gray-200 px-3 py-1 cursor-pointer rounded-b-xl shadow-sm hover:z-10">
            <div className="flex hover:scale-105 transition transform">
              Cambiar <EditarIcon className="w-6 h-6" />
            </div>
          </label>
          <span className={`${"text-xs text-gray-600 ml-2 mb-1 flex justify-center"}`}>Tamaño máximo 5M</span>
        </div>
      </div>
      <style jsx>
        {`
          .background-image {
            background-image: url('${imagePreviewUrl?.image}');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            background-color: ${imagePreviewUrl.preview ? "white" : "gray"};
            width: 100%;
          }
          input[type="file"] {
            //display: none;
          }
        `}
      </style>
    </>
  );
};

export default ModuloSubida;

const BotonConfirmar = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex gap-1 items-center justify-center bg-secondary w-full  px-3 py-1 hover:scale-105 transition transform rounded-bl-xl hover:z-10"
    >
      Confirmar <CheckIcon />
    </div>
  );
};
