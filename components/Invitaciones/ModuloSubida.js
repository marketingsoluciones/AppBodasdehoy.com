import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import Resizer from "react-image-file-resizer";
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PiCheckFatThin } from "react-icons/pi";
import { LiaLinkSolid } from "react-icons/lia";


const resizeImage = (file) => {
  try {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        1200,
        1200,
        "JPEG",
        100,
        0,
        (uri) => resolve(uri),
        "file"
      );
    });
  } catch (error) {
    console.error("Error resizing image:", error);
    return error;
  }

}

const ModuloSubida = ({ event, use }) => {
  const { t } = useTranslation();
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
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 3000);
    }
  }, [copied])

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


export const subir_archivo = async ({ imagePreviewUrl, event, use }) => {
  try {
    if (imagePreviewUrl?.file) {
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
      let map = { 0: ["variables.file"] };
      newFile.append("operations", JSON.stringify(params));
      newFile.append("map", JSON.stringify(map));
      newFile.append("0", imagePreviewUrl.file, imagePreviewUrl.file.name);
      const { data } = await api.UploadFile(newFile);
      return data?.data?.singleUpload
    }
  } catch (error) {
    throw new Error(error)
  }
};

const ModuloSubida = (props) => {
  const { event, use, defaultImagen, setValueImage } = props
  const defaultImagePreviewUrl = {
    file: null,
    preview: false,
    image: event
      ? event[use]?.i800
        ? `${process.env.NEXT_PUBLIC_BASE_URL}${event[use]?.i800}`
        : defaultImagen
      : defaultImagen
  }
  const { t } = useTranslation();
  const [imagePreviewUrl, setImagePreviewUrl] = useState(defaultImagePreviewUrl);
  const toast = useToast();
  const { setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (imagePreviewUrl?.file) {
      if (event) {
        subir_archivo({ imagePreviewUrl, event, use })
          .then(result => {
            setValueImage(result)
            setEvent((old) => ({ ...old, [use]: result }));
          })
          .catch(error => {
            console.log(100087, error)
            toast("error", t("erroroccurred"));
          })
      } else {
        setValueImage(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!imagePreviewUrl?.file) {
      setImagePreviewUrl(defaultImagePreviewUrl)
    }
  }, [defaultImagen]);

  const handleChange = async (e) => {
    try {
      e.preventDefault();
      let file = e.target.files[0];
      if (!file) {
        console.log("No file selected.");
        return;
      }
      const fileNew = file?.size > 900000 ? await resizeImage(file) : file;
      let reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl({ file: fileNew, image: reader.result, preview: true });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast("error", t("erroroccurred"));
      console.error(100088, error);
    }
  };

  return (
    <>
      <div className="w-full z-10 h-full background-image bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-xl shadow-lg flex flex-col text-white items-center justify-center overflow-hidden border-[1px] border-gray-200" {...props}>
        {imagePreviewUrl?.file && <div onClick={() => { setImagePreviewUrl(defaultImagePreviewUrl) }} className="absolute w-9 h-9 bg-gray-200 border-[1px] border-gray-100 text-gray-500 rounded-full right-1 top-1 cursor-pointer flex justify-center items-center">
          <LiaTrashSolid className="w-6 h-6 hover:scale-110 transition transform" />
        </div>}
        <input
          id="file"
          type="file"
          name="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          ref={fileInputRef}
        />
        {(!imagePreviewUrl?.preview && !imagePreviewUrl?.image) && (
          <label
            onClick={() => (!isAllowed() ? ht() : null)}
            htmlFor={!isAllowed() ? "null" : "file"}
            className="hover:scale-120 transform text-md flex flex-col items-center justify-center gap-1 cursor-pointer relative"
          >
            <SubirImagenIcon />
            {imagePreviewUrl.preview ? t("processing") : use === "imgInvitacion" ? t("addinvitation") : ""}
          </label>
        )}

        <div className="w-full flex text-gray-500 bottom-0 translate-y-full absolute rounded-b-xl text-xs overflow-hidden border-[1px] border-gray-300">
          <label onClick={() => !isAllowed() ? ht() : null} htmlFor={!isAllowed() ? "null" : "file"} className="bg-gray-200 gap-1 flex items-center justify-center w-1/2 py-1 cursor-pointer">
            {t("change")} <EditarIcon className="w-6 h-6" />
          </label>
          <CopyToClipboard text={`${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgInvitacion?.i800}`}>
            <label onClick={() => { setCopied(true) }} className="flex items-center justify-center w-1/2 py-1 cursor-pointer">
              {t("copylink")} {copied ? <PiCheckFatThin className="w-6 h-6" /> : <LiaLinkSolid className="w-6 h-6" />}
            </label>
          </CopyToClipboard>

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
            height: 100%; /* Asegúrate de que el contenedor tenga una altura definida */
          }
        `}
      </style>
    </>
  );
};

export default ModuloSubida;

const BotonConfirmar = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className="flex gap-1 items-center justify-center bg-secondary w-full px-3 py-1 hover:scale-105 transition transform rounded-bl-xl hover:z-10"
    >
      {t("confirm")} <CheckIcon />
    </div>
  );
};

