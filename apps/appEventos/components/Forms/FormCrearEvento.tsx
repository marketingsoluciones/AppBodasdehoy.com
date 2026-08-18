import { Form, Formik, FormikValues, useFormikContext } from "formik";
import { formikValidateUx } from "./formikValidateUx";
import { fetchApiBodas, fetchApiEventos, getApiErrorMessage, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import StudioDateField from "./StudioDateField";
import DropdownCountries from "../Utils/DropdownCountries";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';
import { normalizeInvitados, normalizeMenus } from '../../utils/mcpSchemaAdapter';
import { Event, image } from "../../utils/Interfaces";
import ModuloSubida, { subir_archivo } from "../Invitaciones/ModuloSubida";
import { defaultImagenes } from "../Home/Card";
import SelectWithSearchField from "./SelectWithSearchField";
import { useDateTime } from "../../hooks/useDateTime";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDefaultGruposPorTipo } from "../../utils/defaultGruposPorTipo";

// Valores reales del enum EventoTipo en api-mcp (SDL): sin acentos, BABY_SHOWER/DESPEDIDA_SOLTERO/GRADUACION.
const TIPO_ENUM_MAP: Record<string, string> = {
  "boda": "BODA",
  "cumpleaños": "CUMPLEANOS",
  "comunión": "COMUNION",
  "bautizo": "BAUTIZO",
  "babyshower": "BABY_SHOWER",
  "despedida de soltero": "DESPEDIDA_SOLTERO",
  "graduación": "GRADUACION",
  "corporativo": "CORPORATIVO",
  "religioso": "RELIGIOSO",
  "social": "SOCIAL",
  "otro": "OTRO",
};
const mapTipo = (t?: string) => (t ? (TIPO_ENUM_MAP[t.toLowerCase()] || t.toUpperCase()) : t);

// Inverso del map: api-mcp devuelve el tipo en MAYÚSCULAS (enum EventoTipo)
// pero el select del form usa valores minúsculas como ListaTipo[] → al editar un
// evento, sin esta normalización el select queda vacío (BUG-15 "tipo no precarga").
const TIPO_ENUM_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(TIPO_ENUM_MAP).map(([lower, upper]) => [upper, lower])
);
const normalizeTipoForForm = (t?: string) => {
  if (!t) return t;
  return TIPO_ENUM_REVERSE[t] ?? t.toLowerCase();
};

interface propsFromCrearEvento {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  EditEvent?: boolean
  eventData?: Event
}

const FormCrearEvento: FC<propsFromCrearEvento> = ({ state, set, EditEvent, eventData }) => {
  const { t } = useTranslation();
  const { event: eventOrigin, setEvent } = EventContextProvider()
  const { user, config, setUser } = AuthContextProvider();
  const { setEventsGroup, eventsGroup } = EventsGroupContextProvider();
  const toast = useToast();
  const [valir, setValir] = useState(false)
  const searchParams = useSearchParams();
  const studio = searchParams?.get("studio") !== "legacy";
  const [event] = useState(eventData ? eventData : eventOrigin)
  const [valueImage, setValueImage] = useState()
  const { utcDate } = useDateTime();

  const validationSchema = yup.object().shape({
    nombre: yup.string().required(t("Nombre de evento requerido")),
    tipo: yup.string()
      .required(t("Seleciona el tipo de evento"))
      .test("Unico", t("Seleciona el tipo de evento"), (value) => {
        if (value === "Select") {
          return false
        }
        return true
      }),
    fecha: yup.string()
      .required(t("Selecciona una fecha válida"))
      .test("future", t("Selecciona una fecha válida"), (value) => {
        if (!value) return false
        // Comparar sólo fechas (sin hora) para que "hoy" sea válido
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const d = new Date(value + 'T00:00:00')
        return d >= today
      }),
    timeZone: yup.string().required(t("Selecciona una zona horaria")),
  });

  type MyValues = {
    nombre: string
    tipo: string
    fecha: string
    timeZone: string
    pais: string
    poblacion: string
    usuario_id: string
    usuario_nombre: string
    imgEvento?: image
  }

  const initialValues: MyValues = EditEvent ?
    {
      ...event,
      // api-mcp devuelve tipo en MAYÚSCULAS (EventoTipo enum); ListaTipo del select es lowercase.
      // Sin normalizar, el select queda en blanco al editar (BUG-15).
      tipo: normalizeTipoForForm(event.tipo) ?? "",
      fecha: utcDate(event.fecha),
    }
    : {
      nombre: "",
      tipo: "",
      fecha: "",
      timeZone: "",
      pais: "",
      poblacion: "",
      usuario_id: user?.uid || "",
      usuario_nombre: user?.displayName || user?.email || "",
      imgEvento: undefined
    }

  const createEvent = async (values: Partial<Event>) => {
    let succeeded = false;
    try {
      const imagePreviewUrl = values?.imgEvento
      delete values?.imgEvento

      let fechaTimestamp = values.fecha;
      if (values.fecha && typeof values.fecha === 'string') {
        const cleaned = values.fecha.split('T')[0]
        if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fechaTimestamp = cleaned
        } else if (!isNaN(Number(values.fecha))) {
          fechaTimestamp = values.fecha;
        } else {
          const parsed = new Date(values.fecha).getTime();
          fechaTimestamp = isNaN(parsed) ? '' : new Date(parsed).toISOString().split('T')[0]
        }
      }

      const usuario_id =
        (typeof getAuth().currentUser?.uid === "string" && getAuth().currentUser.uid.length ? getAuth().currentUser.uid : null) ||
        (typeof user?.uid === "string" && user.uid.length ? user.uid : null) ||
        (typeof (values as any)?.usuario_id === "string" && (values as any).usuario_id.length ? (values as any).usuario_id : null)
      const usuario_nombre =
        ((typeof getAuth().currentUser?.displayName === "string" && getAuth().currentUser.displayName.length ? getAuth().currentUser.displayName : null) ||
          (typeof getAuth().currentUser?.email === "string" && getAuth().currentUser.email.length ? getAuth().currentUser.email : null)) ||
        (typeof user?.displayName === "string" && user.displayName.length ? user.displayName : null) ||
        (typeof user?.email === "string" && user.email.length ? user.email : null) ||
        (typeof (values as any)?.usuario_nombre === "string" && (values as any).usuario_nombre.length ? (values as any).usuario_nombre : null)

      if (!usuario_id || !usuario_nombre) {
        throw new Error("Falta información de usuario (uid/nombre). Refresca la página e inténtalo de nuevo.")
      }

      const tipoMapped = TIPO_ENUM_MAP[values.tipo as string] || values.tipo
      const sanitizedTimeZone = values.timeZone && typeof values.timeZone === 'string'
        ? values.timeZone.split(/[\d-]/)[0].trim()
        : values.timeZone

      const input = {
        nombre: values.nombre,
        tipo: tipoMapped,
        fecha: fechaTimestamp,
        pais: values.pais || "",
        poblacion: values.poblacion || "",
        usuario_id,
        usuario_nombre,
        timeZone: sanitizedTimeZone,
        // QA I2 (04-jul) / D3 JCP (06-jul): grupos por defecto SEGÚN tipo de
        // evento. Sin esto grupos_array quedaba vacío → select "Rol" de
        // FormInvitado bloqueaba la creación de invitados. `values.tipo` es
        // lowercase (boda/cumpleaños/...), que es lo que espera el helper.
        grupos_array: getDefaultGruposPorTipo(values.tipo),
      }

      const result = await fetchApiBodas({
        query: queries.eventCreate,
        variables: { input },
        development: config?.development || process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy',
      });

      if (!result?.success) {
        // BUG-NEW-13 diagnóstico QA 29-jun: el toast "El servidor rechazó..." era
        // demasiado vago. Loguear payload completo del input + response del
        // server para que QA pueda capturar la causa real (límite plan,
        // validación schema, etc.).
        console.error('[createEvent] backend rejected:', {
          input,
          result,
          backendErrors: result?.errors,
          message: result?.message,
        });
        const backendErrors = Array.isArray(result?.errors) ? result.errors : []
        const errorMsg = backendErrors.length
          ? backendErrors.map((e: any) => `${e.field ?? ''}: ${e.message ?? ''}`).join('; ')
          : (result?.message || "El servidor rechazó la creación del evento")
        throw new Error(errorMsg)
      }

      const createdEvent: Partial<Event> = result?.evento || result
      if (createdEvent) {
        createdEvent.invitados_array = normalizeInvitados((createdEvent as any).invitados)
        createdEvent.menus_array = normalizeMenus((createdEvent as any).menus)
        // La portada NUNCA debe abortar la creación: el evento ya está creado en la BD. Si la subida
        // falla (p.ej. singleUpload 400 al ser invitado / sin auth), se cae con gracia a la imagen por
        // defecto y se avisa en tono suave (no error rojo). subir_archivo SOLO sube el fichero a R2 →
        // hay que asociarlo al evento con eventUpdate (como en editar) o la foto se perdería al recargar.
        let imgEvento: any = undefined
        if ((imagePreviewUrl as any)?.file) {
          try {
            imgEvento = await subir_archivo({ imagePreviewUrl, event: createdEvent, use: "imgEvento" })
            if (imgEvento && createdEvent?._id) {
              await fetchApiBodas({ query: queries.eventUpdate, variables: { idEvento: createdEvent._id, input: { imgEvento } }, token: null })
            }
          } catch (e) {
            console.warn("[CrearEvento] la portada no se pudo subir; se usará la imagen por defecto:", (e as any)?.message ?? e)
            imgEvento = undefined
            toast("warning", t("No se pudo subir la foto; se usó la imagen por defecto.", { defaultValue: "No se pudo subir la foto; se usó la imagen por defecto." }))
          }
        }
        const eventWithImg = { ...createdEvent, imgEvento }
        setEventsGroup({ type: "ADD_EVENT", payload: eventWithImg });
        if (user?.displayName === 'guest') {
          try {
            const key = `guest_events_${user.uid}`
            const existing = JSON.parse(localStorage.getItem(key) || '[]')
            localStorage.setItem(key, JSON.stringify([...existing, eventWithImg]))
          } catch { }
        }
        await fetchApiBodas({
          query: queries.updateUser,
          variables: { variable: "eventSelected", valor: createdEvent?._id },
          development: config?.development
        })
        user.eventSelected = createdEvent?._id
        setUser(user)
        succeeded = true;
        toast("success", t("successfullycreatedevent"));
      }
    } catch (error) {
      const msg =
        getApiErrorMessage(error) ||
        (typeof error?.message === "string" && error.message.length ? error.message : null) ||
        t("Ha ocurrido un error al crear el evento")
      toast("error", msg);
    } finally {
      if (succeeded) {
        set(!state);
        setValir(true)
      }
    }
  }

  useEffect(() => {
    if (valir) {
      setEvent(eventsGroup[eventsGroup?.length - 1])
      setValir(false)
    }
  }, [valir])


  const updateEvent = async (values: any) => {
    try {
      const imagePreviewUrl = values?.imgEvento
      values.fecha = new Date(values.fecha).getTime().toString()
      values.nombre !== event.nombre && await fetchApiBodas({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, input: { nombre: values.nombre } }, token: null
      })
      values.tipo !== event.tipo && await fetchApiBodas({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, input: { tipo: mapTipo(values.tipo) } }, token: null
      })
      values.fecha !== event.fecha && await fetchApiBodas({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, input: { fecha: values.fecha } }, token: null
      })
      values.timeZone !== event.timeZone && await fetchApiBodas({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, input: { timeZone: values.timeZone } }, token: null
      })

      let updatedValues = { ...event, ...values }

      if (imagePreviewUrl?.file) {
        const imgEvento = await subir_archivo({ imagePreviewUrl, event, use: "imgEvento" })
        if (imgEvento) {
          // Persistir la portada en el evento (BD): subir_archivo SOLO sube el fichero a R2,
          // NO asocia imgEvento al evento (a diferencia de nombre/tipo/fecha arriba, que sí
          // hacen eventUpdate). Sin esto la nueva foto se veía local pero se PERDÍA al recargar.
          await fetchApiBodas({
            query: queries.eventUpdate,
            variables: { idEvento: values._id, input: { imgEvento } }, token: null
          })
          updatedValues = { ...updatedValues, imgEvento }
        }
      }

      if (values.fecha !== event.fecha || values.tipo !== event.tipo || values.nombre !== event.nombre || values.timeZone !== event.timeZone || imagePreviewUrl?.file) {
        setEvent(updatedValues)
        toast("success", t("Evento actualizado con exito"))
      }
    } catch (error) {
      const msg =
        getApiErrorMessage(error) ||
        (typeof error?.message === "string" && error.message.length ? error.message : null) ||
        t("Ha ocurrido un error al modificar el evento")
      toast("error", msg);
    } finally {
      set(!state);
    }
  }

  const handleSubmit = async (values: FormikValues) => {
    if (EditEvent) {
      updateEvent({ ...values })
    } else {
      createEvent(values)
      if (user?.displayName === "guest" && eventsGroup?.length === 0) {
        const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest))
        const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        const rawDomain = typeof config?.domain === "string" ? config.domain : ""
        const cookieDomain =
          rawDomain && !rawDomain.startsWith(".")
            ? `.${rawDomain.replace(/^https?:\/\//, "").split("/")[0]}`
            : rawDomain || undefined
        Cookies.set(
          config?.cookieGuest,
          JSON.stringify({ ...cookieContent, eventCreated: true }),
          {
            domain: isLocal ? undefined : cookieDomain,
            expires: dateExpire,
            path: "/",
            secure: typeof window !== "undefined" && window.location.protocol === "https:",
            sameSite: "lax",
          }
        )
      }
    }
  };

  const ListaTipo: string[] = [
    "cumpleaños",
    "boda",
    "babyshower",
    "graduación",
    "bautizo",
    "comunión",
    "despedida de soltero",
    "otro",
  ];

  if (studio) {
    return (
      <Formik
        {...formikValidateUx}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        enableReinitialize
      >
        {({ isSubmitting, values }) => (
          <Form className="ce-studio flex flex-col h-full w-full" style={{ fontFamily: "'Poppins',sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: `
              .ce-head{display:flex;align-items:center;justify-content:space-between;padding:22px 30px 16px;border-bottom:1px solid #f0f0f2;flex:none;}
              .ce-title{font:700 17px Poppins;color:#3A3A42;}
              .ce-close{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#8a8a90;cursor:pointer;background:none;border:none;}
              .ce-close:hover{background:#f5f5f7;}
              .ce-body{flex:1;overflow:auto;padding:22px 30px;display:flex;flex-direction:column;gap:16px;scrollbar-width:none;}
              .ce-body::-webkit-scrollbar{display:none;width:0;}
              .ce-studio .overflow-auto{scrollbar-width:none;-ms-overflow-style:none;}
              .ce-studio .overflow-auto::-webkit-scrollbar{display:none;width:0;height:0;}
              .ce-fila2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
              .ce-label{display:block;font:600 12.5px Poppins;color:#EF5B94;margin-bottom:7px;}
              .ce-foot{display:flex;gap:12px;padding:16px 30px 22px;border-top:1px solid #f0f0f2;flex:none;background:#fff;}
              .ce-btn{flex:1;padding:12px 20px;border-radius:10px;font:600 13px Poppins;cursor:pointer;font-family:inherit;}
              .ce-btn-sec{background:#fff;border:1.5px solid #E7E7EA;color:#6b6b72;}
              .ce-btn-pri{background:#EF5B94;color:#fff;border:none;box-shadow:0 6px 16px rgba(239,91,148,.3);}
              .ce-btn-pri:hover{background:#D83E7C;}
              .ce-studio label{display:block!important;font:600 12.5px Poppins!important;color:#EF5B94!important;margin-bottom:7px!important;text-transform:none!important;}
              .ce-studio input[type="text"],.ce-studio input[type="date"],.ce-studio select,.ce-studio input:not([type]){width:100%!important;border:1.5px solid #E7E7EA!important;border-radius:10px!important;padding:11px 14px!important;font:500 13px Poppins!important;color:#3A3A42!important;outline:none!important;background:#fff!important;height:auto!important;text-transform:none!important;}
              .ce-studio input:focus,.ce-studio select:focus{border-color:#EF5B94!important;box-shadow:none!important;}
            ` }} />
            <AutoSubmitToken valueImage={valueImage} />
            <div className="ce-head">
              <div className="ce-title">{EditEvent ? t("Editar evento") : t("Crear evento")}</div>
              <button type="button" className="ce-close" aria-label={t("Cerrar") as string} onClick={() => set(!state)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="ce-body">
              <div><InputField name="nombre" label={t("nameevent")} /></div>
              <div><SelectField name="tipo" label={t("eventtype")} options={ListaTipo} nullable={true} capitalizeLabels /></div>
              <div className="ce-fila2">
                <div><StudioDateField name="fecha" label={t("eventdate")} /></div>
                <div><SelectWithSearchField name="timeZone" label={t("timeZone")} options={["Europe/Madrid", "Atlantic/Canary", "Europe/Lisbon", "Europe/London", "Europe/Paris", "Europe/Andorra", "Europe/Rome", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/Tijuana", "America/Guatemala", "America/El_Salvador", "America/Tegucigalpa", "America/Managua", "America/Costa_Rica", "America/Panama", "America/Havana", "America/Santo_Domingo", "America/Puerto_Rico", "America/Bogota", "America/Lima", "America/Guayaquil", "America/Caracas", "America/La_Paz", "America/Santiago", "America/Argentina/Buenos_Aires", "America/Asuncion", "America/Montevideo"]} nullable={true} formatLabel={(tz) => { const p = String(tz).split("/"); return p[p.length - 1].replace(/_/g, " "); }} /></div>
              </div>
              <div>
                <label className="ce-label">{t("Foto del evento")}</label>
                <div className="w-full">
                  <ModuloSubida studio setValueImage={setValueImage} event={EditEvent ? event : undefined} use={"imgEvento"} defaultImagen={defaultImagenes[values.tipo?.toLowerCase()]} />
                </div>
              </div>
              <div><DropdownCountries studio name="pais" placeholder={t("Seleccionar país")} label={t("País")} /></div>
            </div>
            <div className="ce-foot">
              <button type="button" className="ce-btn ce-btn-sec" onClick={() => set(!state)}>{t("Cancelar")}</button>
              <button type="submit" disabled={isSubmitting} className="ce-btn ce-btn-pri">{t("save")}</button>
            </div>
          </Form>
        )}
      </Formik>
    );
  }

  return (
    <Formik
      {...formikValidateUx}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      enableReinitialize
    >
      {({ isSubmitting, values }) => {
        return (
          <Form className="w-full flex flex-col">
            <AutoSubmitToken valueImage={valueImage} />
            <div className="border-l-2 border-gray-100 pl-3 w-full">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {EditEvent ? t("edit") : t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("event")}
              </h2>
            </div>
            <div onSubmit={handleSubmit} className="flex flex-col gap-5 py-6 w-full flex-1" >
              <div className="">
                <InputField
                  //placeholder="Ej. Cumpleaños de Ana"
                  name="nombre"
                  label={t("nameevent")}
                />
              </div>
              <div>
                <SelectField
                  name="tipo"
                  label={t("eventtype")}
                  options={ListaTipo}
                  nullable={true}
                />
              </div>
              <InputField
                name="fecha"
                label={t("eventdate")}
                type="date"
              />
              <div>
                <SelectWithSearchField
                  name="timeZone"
                  label={t("timeZone")}
                  options={Intl?.supportedValuesOf('timeZone')}
                  nullable={true}
                />
              </div>
              <div className="w-full flex justify-center">
                <div className="relative w-[304px] h-[140px] mb-4">
                  <ModuloSubida setValueImage={setValueImage} event={EditEvent ? event : undefined} use={"imgEvento"} defaultImagen={defaultImagenes[values.tipo?.toLowerCase()]} />
                </div>
              </div>
              {/* País: auto via /api/geo (CF/Vercel o fallback server) +
                  selección manual. Opcional — backend resuelve si vacío. */}
              <div>
                <DropdownCountries
                  name="pais"
                  placeholder={t("Selecciona el país")}
                  label={t("País")}
                />
              </div>
              {/* <InputField
            name="poblacion"
            placeholder="Murcia"
            label="Poblacion"
            onChange={handleChange}
            value={values.poblacion}
            type="text"
            autoComplete="off"/> */}
              <button
                disabled={isSubmitting}
                type="submit"
                className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 relative z-10 ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
              >
                {t("save")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FormCrearEvento;

const AutoSubmitToken = ({ valueImage }) => {
  const { values, setValues } = useFormikContext();

  useEffect(() => {
    if (valueImage === undefined) return
    setValues({ ...(values as object), imgEvento: valueImage })
  }, [valueImage]);

  return null;
};
