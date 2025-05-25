import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import Resizer from "react-image-file-resizer";
import { useTranslation } from 'react-i18next';
import { useField } from "formik"

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
  const { event, use, name = undefined } = props
  const [field, meta, helpers] = useField({ name: name })
  const { t } = useTranslation();
  const [imagePreviewUrl, setImagePreviewUrl] = useState({
    file: null,
    preview: false,
    image: event ? `${process.env.NEXT_PUBLIC_BASE_URL}${event[use]?.i800}` : "",
  });
  const toast = useToast();
  const { setEvent } = EventContextProvider();
  const [showAddImg, setShowAddImg] = useState(true);
  const [isAllowed, ht] = useAllowed();

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (imagePreviewUrl?.file) {
      if (event) {
        subir_archivo({ imagePreviewUrl, event, use })
          .then(result => {
            helpers.setValue(result)
            setEvent((old) => ({ ...old, [use]: result }));
          })
          .catch(error => {
            toast("error", t("erroroccurred"));
          })
      } else {
        helpers.setValue(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl]);

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
      console.error("Error in handleChange:", error);
    }
  };

  useEffect(() => {
    event && setShowAddImg(!event[use]?.i800 && !imagePreviewUrl.preview);
  }, [event, imagePreviewUrl.preview]);

  return (
    <>
      <div className="w-full z-10 h-full background-image bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-xl shadow-lg flex flex-col text-white items-center justify-center overflow-hidden" {...props}>
        <input
          id="file"
          type="file"
          name="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          ref={fileInputRef}
        />
        {showAddImg && (
          <label
            onClick={() => (!isAllowed() ? ht() : null)}
            htmlFor={!isAllowed() ? "null" : "file"}
            className="hover:scale-120 transform text-md flex flex-col items-center justify-center gap-1 cursor-pointer relative"
          >
            <SubirImagenIcon />
            {imagePreviewUrl.preview ? t("processing") : t("addinvitation")}
          </label>
        )}
        <div className="w-full flex flex-col text-gray-500 bottom-0 translate-y-full absolute">
          <label
            onClick={() => (!isAllowed() ? ht() : null)}
            htmlFor={!isAllowed() ? "null" : "file"}
            className="gap-1 flex items-center justify-center w-full bg-gray-200 px-3 py-1 cursor-pointer rounded-b-xl shadow-sm hover:z-10"
          >
            <div className="flex hover:scale-105 transition transform">
              {t("change")} <EditarIcon className="w-6 h-6" />
            </div>
          </label>
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
