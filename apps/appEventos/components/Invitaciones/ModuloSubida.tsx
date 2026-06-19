import { useEffect, useRef, useState } from "react";
import { EventContextProvider } from "../../context";
import { CheckIcon, EditarIcon, SubirImagenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import Resizer from "react-image-file-resizer";
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PiCheckFatThin } from "react-icons/pi";
import { LiaLinkSolid, LiaTrashSolid } from "react-icons/lia";
import { convertHeicIfNeeded, withRetry, categorize, validateFile, PHOTO_TYPES } from "@bodasdehoy/shared/upload";
import { getDevelopmentNameFromHostname } from "@bodasdehoy/shared/types";
import Cookies from "js-cookie";
import { getAuth } from "firebase/auth";
import { createURL } from "../../utils/UrlImage";
import { resolveApiBodasGraphqlUrl } from "../../utils/apiEndpoints";

const resizeImage = (file) => {
  try {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        1200,
        1200,
        "JPEG",
        80,
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

// Sube imagen a api-mcp (singleUpload → R2 multi-tenant). Mantiene la forma de respuesta
// legacy { _id, i1024, i800, i640, i320, createdAt } esperada por los consumers (event[use]
// se guarda en el store y los componentes lo leen como objeto con tamaños).
export const subir_archivo = async ({ imagePreviewUrl, event, use }) => {
  try {
    if (!imagePreviewUrl?.file) return undefined;

    const development = typeof window !== 'undefined'
      ? (getDevelopmentNameFromHostname(window.location.hostname) || 'bodasdehoy')
      : 'bodasdehoy';

    let idToken = Cookies.get("idTokenV0.1.0");
    if (!idToken && getAuth().currentUser) {
      idToken = await getAuth().currentUser?.getIdToken(true);
    }

    const newFile = new FormData();
    const params = {
      query: `mutation ($file: Upload!, $development: String!, $eventId: ID!, $category: String) {
        singleUpload(file: $file, development: $development, eventId: $eventId, category: $category) {
          success
          errors { field message code }
          file {
            _id
            createdAt
            publicUrls { original optimized800w optimized400w thumbnail }
          }
        }
      }`,
      variables: {
        file: null,
        development,
        eventId: event?._id,
        category: use,
      },
    };
    newFile.append("operations", JSON.stringify(params));
    newFile.append("map", JSON.stringify({ 0: ["variables.file"] }));
    newFile.append("0", imagePreviewUrl.file, imagePreviewUrl.file.name);

    // withRetry: red móvil intermitente → 2 reintentos con backoff exponencial
    // (1s, 2s). isRetryableError NO reintenta en 4xx (auth/payload inválido).
    const payload = await withRetry(async () => {
      const res = await fetch(resolveApiBodasGraphqlUrl(), {
        method: "POST",
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          "x-apollo-operation-name": "singleUpload",
        },
        body: newFile,
      });
      if (!res.ok) {
        const err: any = new Error(`singleUpload HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const json = await res.json();
      const p = json?.data?.singleUpload;
      if (!p?.success || !p?.file) {
        const msg = p?.errors?.[0]?.message || json?.errors?.[0]?.message || 'singleUpload failed';
        throw new Error(msg);
      }
      return p;
    }, { maxRetries: 2, initialDelay: 1000, backoffMultiplier: 2 });

    const f = payload.file;
    // Mapear FileMetadata → forma legacy. api-mcp da: original(full), 800w, 400w, thumbnail.
    // Consumers leen i1024/i800/i640/i320 → mapeo más cercano por tamaño.
    return {
      _id: f._id,
      i1024: f.publicUrls?.original ?? null,
      i800: f.publicUrls?.optimized800w ?? f.publicUrls?.original ?? null,
      i640: f.publicUrls?.optimized400w ?? f.publicUrls?.optimized800w ?? null,
      i320: f.publicUrls?.thumbnail ?? f.publicUrls?.optimized400w ?? null,
      createdAt: f.createdAt,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const ModuloSubida = (props) => {
  const { event, use, defaultImagen, setValueImage } = props
  const defaultImagePreviewUrl = {
    file: null,
    preview: false,
    image: event
      ? event[use]?.i800
        ? createURL(event[use]?.i800)
        : defaultImagen
      : defaultImagen
  }
  const { t } = useTranslation();
  const [imagePreviewUrl, setImagePreviewUrl] = useState(defaultImagePreviewUrl);
  const toast = useToast();
  const { setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 3000);
    }
  }, [copied])

  useEffect(() => {
    if (imagePreviewUrl?.file) {
      if (event) {
        subir_archivo({ imagePreviewUrl, event, use })
          .then(result => {
            setValueImage(result)
            setEvent((old) => ({ ...old, [use]: result }));
          })
          .catch(error => {
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
        return;
      }
      // Validar: solo fotos (este input es imgEvento/imgInvitacion, NO docs).
      const v = validateFile(file, { allowedTypes: PHOTO_TYPES });
      if (!v.valid) {
        toast("error", v.error || t("erroroccurred"));
        return;
      }
      file = await convertHeicIfNeeded(file);
      // Comprimir SOLO si la categoría es photos (defensa por si convertHeic
      // cambió el tipo o llegó algo raro). resizeImage es JPEG-only.
      const isPhoto = categorize(file) === 'photos';
      const fileNew = (isPhoto && file?.size > 900000) ? await resizeImage(file) : file;
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
          accept=".heic,.heif,image/*"
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
          {event?.[use]?.i1024 && (
            <CopyToClipboard text={createURL(event[use].i1024) || ""}>
              <label onClick={() => { setCopied(true) }} className="flex items-center justify-center w-1/2 py-1 cursor-pointer">
                {t("copylink")} {copied ? <PiCheckFatThin className="w-6 h-6" /> : <LiaLinkSolid className="w-6 h-6" />}
              </label>
            </CopyToClipboard>
          )}
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
