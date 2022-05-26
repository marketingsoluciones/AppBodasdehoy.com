import { useState, useEffect } from "react";
import { api } from "../../api";
import { BorrarIcon, CompartirIcon, FlechaIcon, SubirImagenIcon } from "../icons";

const VistaPrevia = ({ evento }) => {
  const [content, setContent] = useState();

  async function FetchHtmlContent(idEvento) {
    const params = {
      query: `mutation obtenerTemplate($eventoID: String) {
                obtenerTemplate(evento_id: $eventoID)
              }`,
      variables: {
        eventoID: JSON.stringify(idEvento),
      },
    };

    try {
      const res = await api.ApiBodas(params);
      if (res.data) {
        let contenido = res.data.data.obtenerTemplate;
        const refImg =
          '<img width="20" height="38" style="display:block; max-height:38px; max-width:20px;" alt="" src="https://img.mailinblue.com/new_images/rnb/rnb_space.gif">';
        const pathImage =
          "https://banderas.top/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2020/08/Rep%C3%BAblica-Bolivariana-de-Venezuela.png.webp";
        const img = `<img style="display:block; object-fit: contain; width:500px; right:0; left:0; margin:auto; " alt="imagen" src=${pathImage} />`;
        setContent(contenido
            .replace("{{params.tipoEvento}}", evento.tipo)
            .replace("{{params.invitadoNombre}}", "Nombre y Apellido")
            .replace(refImg, img));
        return res.data.data.obtenerTemplate;
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (evento._id) {
      FetchHtmlContent(evento._id);
    }
  }, [evento]);

  const PlantillaCorreo = () => {
    return (
        <>
        <iframe sandbox="allow-same-origin"  seamless="seamless"  srcDoc={content} />;
        <style jsx>
            {`
            iframe {
                width: 100%;
                height: 55rem;
            }
            ::-webkit-scrollbar {
                display: none;
            }
            `}
        </style>
        </>
    ) 
  };

  return (
    <div className=" w-full h-max">
      <HeaderEmail />
      <PlantillaCorreo />
    </div>
  );
};

export default VistaPrevia;

const HeaderEmail = () => {
  return (
    <div className="w-full h-max gap-6 bg-gray-100 rounded-t-xl p-6 flex flex-col">
      <div className="flex gap-2 items-center">
        <div className="w-4 h-4 rounded-full bg-red" />
        <div className="w-4 h-4 rounded-full bg-tertiary" />
        <div className="w-4 h-4 rounded-full bg-green" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-base p-2 rounded flex gap-2 items-center">
            <BorrarIcon className="text-gray-100 w-6 h-6" />
            <CompartirIcon className="text-gray-100 w-6 h-6" />
          </div>
          <div className="bg-base p-2 rounded flex gap-2 items-center justify-center">
            <FlechaIcon className="text-gray-100 w-6 h-6" />
            <FlechaIcon className="text-gray-100 w-6 h-6 transform rotate-180" />
          </div>
        </div>
        <div className="flex items-center justify-center">
            <div className="bg-base p-2 rounded flex gap-2 items-center px-16">
          <h2 className="text-gray-500 text-lg font-body">Vista previa de invitacion por email</h2>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-base p-2 rounded flex gap-2 items-center">
            <SubirImagenIcon className="text-gray-100 w-6 h-6" />
            <CompartirIcon className="text-gray-100 w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
