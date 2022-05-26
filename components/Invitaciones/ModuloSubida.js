import { useCallback, useContext, useEffect, useState } from "react";
import { api } from "../../api";
import AlertContext from "../../context/AlertContext";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";

const ModuloSubida = ({ evento }) => {
  const [cargado, setCargado] = useState({ titulo: "esperando archivo" });
  const [imagePreviewUrl, setImagePreviewUrl] = useState({
    file: {},
    preview: false,
    image: evento?.invitacion_objeto?.path,
  });
  const { setAlerts } = useContext(AlertContext);

  const subir_archivo = async () => {
    const newFile = new FormData();
    const params = {
      query: `mutation ($file: Upload!) {
                singleUpload(file: $file, evento_id:"${evento?._id}"){
                  id
                  path
                  filename
                  mimetype
                }
              }
            `,
      variables: {
        file: null,
      },
    };

    let map = {
      0: ["variables.file"],
    };

    newFile.append("operations", JSON.stringify(params));
    newFile.append("map", JSON.stringify(map));
    newFile.append("0", imagePreviewUrl.file, imagePreviewUrl.file.name);

    try {
      await api.UploadFile(newFile);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    if (file.size < 5120000) {
      reader.onloadend = () => {
        setImagePreviewUrl({ file: file, image: reader.result, preview: true });
      };
    } else {
      setAlerts((old) => {
        const alert = {
          title: "Upss... La imagen es muy pesada (Max 5MB)",
          page: "Invitaciones",
        };
        return [...old, alert];
      });
    }
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="relative w-full z-10 h-full background-image bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl shadow-lg flex flex-col text-white items-center justify-center cursor-pointer transition overflow-hidden">
        <input
          id="file"
          type="file"
          accept="image/*"
          required
          onChange={(e) => handleChange(e)}
        />
        {imagePreviewUrl.preview == false && (
          <label
            className="hover:scale-120 transform font-display text-md font-medium flex flex-col items-center justify-center gap-1 cursor-pointer"
            for="file"
          >
            <SubirImagenIcon />
            {imagePreviewUrl.preview ? cargado.titulo : "Añadir invitacion"}
          </label>
        )}

        {imagePreviewUrl.preview && (
          <div className="w-full font-dsplay flex text-gray-500 bottom-0 absolute ">
            <BotonConfirmar onClick={subir_archivo} />

            <label
              for="file"
              className="flex gap-1 items-center justify-center w-full bg-white px-3 py-1 hover:scale-105 transition transform cursor-pointer"
            >
              Cambiar <EditarIcon />
            </label>
          </div>
        )}
      </div>
      <style jsx>
        {`
          .background-image {
            background-image: url(${imagePreviewUrl.preview &&
            imagePreviewUrl?.image});
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            background-color: ${imagePreviewUrl.preview ? "white" : "gray"};
            width: 100%;
          }
          input[type="file"] {
            display: none;
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
      className="flex gap-1 items-center justify-center bg-secondary w-full  px-3 py-1 hover:scale-105 transition transform"
    >
      Confirmar <CheckIcon />
    </div>
  );
};
