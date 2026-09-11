import { useState, useEffect } from "react";
import { fetchApiBodas } from "../../utils/Fetching";
import { BorrarIcon, CompartirIcon, FlechaIcon, SubirImagenIcon } from "../icons";
import { useTranslation } from 'react-i18next';
import { resolveApiBodasOrigin } from "../../utils/apiEndpoints";


const VistaPrevia = ({ event }) => {
  /* console.log(12345, event) */
  const [content, setContent] = useState<string>('');

  async function FetchHtmlContent(idEvento) {
    try {
      const contenido: any = await fetchApiBodas({
        query: `mutation($evento_id:ID!){ obtenerTemplate(evento_id:$evento_id) }`,
        variables: { evento_id: idEvento },
      });
      if (typeof contenido === 'string' && contenido.length) {
        const refImg = `<img width="20" height="38" style="display:block; max-height:38px; max-width:20px;" alt="" src="https://img.mailinblue.com/new_images/rnb/rnb_space.gif">`;
        const pathImage = `${resolveApiBodasOrigin()}${event?.imgInvitacion?.i640}`;
        const img = `<img style="display:block; object-fit: contain; width:300px; right:0; left:0; margin:auto;  alt="" src=${pathImage} />`;
        setContent(contenido
          .replace("{{params.tipoEvento}}", event.tipo == "otro" ? "evento especial" : event.tipo)
          .replace("{{params.invitadoNombre}}", event?.invitados_array[0]?.nombre)
          .replace(refImg, img));
        return contenido;
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    if (event?._id) {
      FetchHtmlContent(event._id);
    }
  }, [event]);

  const PlantillaCorreo = () => {
    return (
      <>
        <iframe sandbox="allow-same-origin" {...({ seamless: 'seamless' } as any)} srcDoc={content} />;
        <style jsx>
          {`
            iframe {
                width: 100%;
                height: 61rem;
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
    <div className=" w-full h-max mt-3">
      <HeaderEmail />
      <PlantillaCorreo />
    </div>
  );
};

export default VistaPrevia;

const HeaderEmail = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-max gap-6 bg-gray-100 rounded-t-xl p-6 flex flex-col justify-center">
      {/*  <div className=" hidden md:block flex gap-2 items-center">
        <div className="w-4 h-4 rounded-full bg-red" />
        <div className="w-4 h-4 rounded-full bg-tertiary" />
        <div className="w-4 h-4 rounded-full bg-green" />
      </div> */}
      <div className="flex items-center  justify-center">
        {/*  <div className="hidden md:block flex items-center gap-3">
          <div className="  bg-base p-2 rounded flex gap-2 items-center">
            <BorrarIcon className="text-gray-100 w-6 h-6" />
            <CompartirIcon className="text-gray-100 w-6 h-6" />
          </div>
          <div className="bg-base p-2 rounded flex gap-2 items-center justify-center">
            <FlechaIcon className="text-gray-100 w-6 h-6" />
            <FlechaIcon className="text-gray-100 w-6 h-6 transform rotate-180" />
          </div>
        </div> */}
        <div className="flex items-center justify-center">
          <div className="bg-base p-2 rounded flex gap-2 items-center md:px-16">
            <h2 className=" text-gray-500 text-lg font-body">{t("emailinvitationpreview")}</h2>
          </div>
        </div>
        {/* <div className=" hidden md:block flex items-center justify-center">
          <div className="bg-base p-2 rounded flex gap-2 items-center">
            <SubirImagenIcon className="text-gray-100 w-6 h-6" />
            <CompartirIcon className="text-gray-100 w-6 h-6" />
          </div>
        </div> */}
      </div>
    </div>
  );
};
