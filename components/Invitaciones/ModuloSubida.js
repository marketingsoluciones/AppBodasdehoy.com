import { useCallback, useContext, useEffect, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import AlertContext from "../../context/AlertContext";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";

const ModuloSubida = ({ evento, use }) => {
  const [cargado, setCargado] = useState({ titulo: "esperando archivo" });
  const [imagePreviewUrl, setImagePreviewUrl] = useState({
    file: {},
    preview: false,
    image: `${process.env.NEXT_PUBLIC_BASE_URL}${evento?.imgInvitacion?.i800}`,
  });

  const { setAlerts } = useContext(AlertContext);
  const { setEvent } = EventContextProvider()

  const subir_archivo = async () => {
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
        _id: evento?._id,
        use: use,
      },
    };

    let map = {
      0: ["variables.file"],
    };

    newFile.append("operations", JSON.stringify(params));
    newFile.append("map", JSON.stringify(map));
    newFile.append("0", imagePreviewUrl.file, imagePreviewUrl.file.name);

    try {
      const { data } = await api.UploadFile(newFile);
      setEvent((old) => {
        return { ...old, imgInvitacion: data?.data?.singleUpload }
      })
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
        console.log(1, e)
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
          >
            <SubirImagenIcon />
            {imagePreviewUrl.preview ? cargado.titulo : "Añadir invitacion"}
          </label>
        )}

        {true && (
          <div className="w-full font-dsplay flex text-gray-500 bottom-0 absolute ">
            <BotonConfirmar onClick={subir_archivo} />

            <label
              className="flex gap-1 items-center justify-center w-full bg-white px-3 py-1 hover:scale-105 transition transform cursor-pointer"
            >
              Cambiar <EditarIcon />
            </label>
          </div>
        )}
      </div>
      hola<br />
      hola<br />
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
      className="flex gap-1 items-center justify-center bg-secondary w-full  px-3 py-1 hover:scale-105 transition transform"
    >
      Confirmar <CheckIcon />
    </div>
  );
};
