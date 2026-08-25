import { Formik, Form, useField, FormikValues } from "formik";
import { createPortal } from "react-dom";
import { formikValidateUx } from "./formikValidateUx";
import { FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import * as yup from "yup";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { ImageProfile } from "../../utils/Funciones";
import { ImportGuest } from "./ImportGuest";
import { useImportGuest } from "../../hooks/useImportGuest";
import { ForApiPeople } from "./ForApiGoogle";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { useTranslation } from "react-i18next";

/**
 * FormInvitadoStudio — modal "Crear invitado" fiel al HTML studio.
 * Panel lateral IZQUIERDO por encima de todo (z-index alto). MISMO backend que
 * FormInvitado: misma validación (yup), misma mutación (queries.createGuests) y
 * mismo flujo de Importar Contactos.
 */

const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "11px 14px", font: "500 13px Poppins", color: "#3A3A42", outline: "none", background: "#fff" };
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c4c4cc' stroke-width='2.4'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center", cursor: "pointer" };
const labelStyle: React.CSSProperties = { font: "600 12.5px Poppins", color: "#EF5B94", marginBottom: 7, display: "block" };
const errStyle: React.CSSProperties = { font: "500 11px Poppins", color: "#D83E7C", marginTop: 5 };

const COUNTRIES = [
  { label: "us +1", pfx: "+1" },
  { label: "es +34", pfx: "+34" },
  { label: "mx +52", pfx: "+52" },
  { label: "co +57", pfx: "+57" },
  { label: "ve +58", pfx: "+58" },
];

const Field: FC<{ name: string; label: string; type?: string; inputMode?: any }> = ({ name, label, type = "text", inputMode }) => {
  const [field, meta] = useField(name);
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <input {...field} name={name} type={type} inputMode={inputMode} autoComplete="off" className="fis-in" style={{ ...inputStyle, borderColor: meta.touched && meta.error ? "#E85C7A" : "#E7E7EA" }} />
      {meta.touched && meta.error && <div style={errStyle}>{String(meta.error)}</div>}
    </div>
  );
};

const Select: FC<{ name: string; label: string; options: { value: string; label: string }[]; placeholder?: string }> = ({ name, label, options, placeholder }) => {
  const [field, meta] = useField(name);
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <select {...field} name={name} className="fis-in" style={{ ...selectStyle, borderColor: meta.touched && meta.error ? "#E85C7A" : "#E7E7EA" }}>
        {placeholder && <option value="" hidden>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {meta.touched && meta.error && <div style={errStyle}>{String(meta.error)}</div>}
    </div>
  );
};

const Segment: FC<{ name: string; label: string; options: { value: string; label: string }[] }> = ({ name, label, options }) => {
  const [field, , helpers] = useField(name);
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: "flex", border: "1.5px solid #E7E7EA", borderRadius: 11, overflow: "hidden" }}>
        {options.map((o) => {
          const on = field.value === o.value;
          return <button type="button" key={o.value} onClick={() => helpers.setValue(o.value)} style={{ flex: 1, padding: "10px 4px", font: "600 12.5px Poppins", border: "none", cursor: "pointer", background: on ? "#EF5B94" : "#fff", color: on ? "#fff" : "#8a8a90" }}>{o.label}</button>;
        })}
      </div>
    </div>
  );
};

const PhoneField: FC = () => {
  const [field, meta, helpers] = useField("telefono");
  const v: string = field.value || "";
  const match = COUNTRIES.find((c) => v.startsWith(c.pfx));
  const [pfx, setPfx] = useState(match ? match.pfx : (v.match(/^\+\d+/)?.[0] || "+1"));
  const [num, setNum] = useState(match ? v.slice(match.pfx.length) : v.replace(/^\+\d+/, ""));
  const opts = COUNTRIES.some((c) => c.pfx === pfx) ? COUNTRIES : [{ label: pfx, pfx }, ...COUNTRIES];
  const setBoth = (p: string, n: string) => { setPfx(p); setNum(n); helpers.setValue(p + n); };
  return (
    <div>
      <span style={labelStyle}>Teléfono</span>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={pfx} onChange={(e) => setBoth(e.target.value, num)} style={{ ...selectStyle, width: 92, flex: "none" }}>
          {opts.map((c) => <option key={c.pfx} value={c.pfx}>{c.label}</option>)}
        </select>
        <input name="telefono" inputMode="tel" autoComplete="off" value={num} onChange={(e) => setBoth(pfx, e.target.value)} onBlur={() => helpers.setTouched(true)} className="fis-in" style={{ ...inputStyle, flex: 1, borderColor: meta.touched && meta.error ? "#E85C7A" : "#E7E7EA" }} />
      </div>
      {meta.touched && meta.error && <div style={errStyle}>{String(meta.error)}</div>}
    </div>
  );
};

const ResetForm: FC<{ setFieldValue: any; resetForm: any; contact: any }> = ({ setFieldValue, resetForm, contact }) => {
  useEffect(() => {
    if (contact) {
      resetForm();
      const contacto: Record<string, any> = { telefono: contact?.phones?.[0], nombre: contact?.name, correo: contact?.email };
      for (const clave in contacto) setFieldValue(clave, contacto[clave]);
    }
  }, [contact]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const FormInvitadoStudio: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider() as any;
  const { event, setEvent } = EventContextProvider() as any;
  const toast = useToast();
  const { isPhoneValid } = useAuthentication();
  const [contactsForApiGoogle] = useImportGuest();
  const [contact, setContact] = useState<any>(null);
  const [showMedioSelectImport, setShowMedioSelectImport] = useState(false);
  const [showForApiGoogle, setShowForApiGoogle] = useState<any>({ state: false, payload: {} });
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const scriptGsi = document.createElement("script");
    scriptGsi.src = "https://accounts.google.com/gsi/client"; scriptGsi.async = true;
    document.body.appendChild(scriptGsi);
    const scriptGapi = document.createElement("script");
    scriptGapi.src = "https://apis.google.com/js/api.js"; scriptGapi.async = true;
    document.body.appendChild(scriptGapi);
  }, []);

  const validationSchema = yup.object().shape({
    nombre: yup.string().required("Nombre requerido"),
    telefono: yup.string().test("Unico", "Teléfono requerido", (value) => (value?.length ?? 0) >= 4)
      .test("Unico", "Número inválido", (value) => {
        const name = document.activeElement?.getAttribute("name");
        if (name !== "telefono" && (value?.length ?? 0) > 3) return isPhoneValid(value);
        return true;
      })
      .test("Unico", "Número asignado a otro invitado", (value) => {
        const name = document.activeElement?.getAttribute("name");
        if (name !== "telefono" && (value?.length ?? 0) > 3) return !(event?.invitados_array ?? []).map((i: any) => i?.telefono).includes(value);
        return true;
      }),
    rol: yup.string().required("Rol requerido").notOneOf(["Seleccionar"], "Seleccione un Rol válido"),
    correo: yup.string().email("El formato del correo no es válido").test("Unico", "Correo asignado a otro invitado", (value) => {
      if (!value) return true;
      return !(event?.invitados_array ?? []).filter(Boolean).map((i: any) => i?.correo).includes(value);
    }),
  });

  const menuOptions = Array.from(new Set([...(event?.menus_array || []).map((m: any) => m?.nombre_menu).filter(Boolean), "sin menú"]));
  const initialValues = {
    nombre: "",
    sexo: "hombre",
    grupo_edad: "adulto",
    correo: "",
    telefono: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
    rol: "",
    nombre_menu: (menuOptions[0] as string) || "sin menú",
    passesQuantity: 0,
  };

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      if (values?.telefono?.[0] === "0") {
        values.telefono = `+${phoneUtil.getCountryCodeForRegion(geoInfo.ipcountry)}${values?.telefono.slice(1)}`;
      }
      if (values.nombre_menu === "sin menú") values.nombre_menu = undefined;
      const result: any = await fetchApiBodas({
        query: queries.createGuests,
        variables: { eventID: event._id, invitados_array: [values] },
      });
      if (!result?.success || (result?.errors?.length ?? 0) > 0) {
        const backendMsg = result?.errors?.[0]?.message;
        toast("error", `${t("Ha ocurrido un error")}${backendMsg ? `: ${backendMsg}` : ""}`);
        return;
      }
      const updated = result?.evento?.invitados_array;
      if (Array.isArray(updated)) setEvent((old: any) => ({ ...old, invitados_array: updated }));
      toast("success", t("Invitado creado con exito"));
      onClose();
    } catch (error) {
      toast("error", `${t("Ha ocurrido un error")} ${error}`);
    } finally {
      actions.setSubmitting(false);
    }
  };

  const roleOptions = (event?.grupos_array || []).map((g: string) => ({ value: g, label: g }));

  const content = (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(40,40,46,.45)", display: "flex", alignItems: "stretch", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes fis-slidein{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}.fis-in:focus{border-color:#EF5B94!important;}.fis-body::-webkit-scrollbar{width:0;height:0;}" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "94vw", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(0,0,0,.14)", animation: "fis-slidein .22s ease" }}>
        <Formik {...formikValidateUx} initialValues={initialValues} onSubmit={handleSubmit} validationSchema={validationSchema}>
          {({ isSubmitting, values, setFieldValue, resetForm }) => (
            <Form autoComplete="off" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <ResetForm setFieldValue={setFieldValue} resetForm={resetForm} contact={contact} />
              {showForApiGoogle.state && <ForApiPeople setContact={setContact} showForApiGoogle={showForApiGoogle} setShowForApiGoogle={setShowForApiGoogle} />}
              {showMedioSelectImport && <ImportGuest setShowMedioSelectImport={setShowMedioSelectImport} setContact={setContact} setShowForApiGoogle={setShowForApiGoogle} />}

              {/* Cabecera */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px 16px", borderBottom: "1px solid #f0f0f2" }}>
                <h2 style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Crear invitado")}</h2>
                <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", border: "none", background: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>

              {/* Cuerpo */}
              <div className="fis-body" style={{ padding: "22px 30px", display: "flex", flexDirection: "column", gap: 16, overflow: "auto", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EAF3F0", overflow: "hidden", flex: "none" }}>
                    <img src={ImageProfile[values.sexo]?.image ?? "/placeholder/user.png"} alt={ImageProfile[values.sexo]?.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <button type="button" onClick={() => { (window as any)["ReactNativeWebView"] || (navigator as any)["contacts"] ? setShowMedioSelectImport(true) : contactsForApiGoogle().then((r: any) => setShowForApiGoogle(r)); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 20, background: "#EF5B94", color: "#fff", font: "600 12px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)", whiteSpace: "nowrap" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.4" /><path d="M3.5 19c.7-2.8 3-4.5 5.5-4.5s4.8 1.7 5.5 4.5" /><path d="M17 8h5M19.5 5.5v5" /></svg>{t("importcontacts")}</button>
                </div>

                <PhoneField />
                <Field name="nombre" label={t("Nombre")} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Segment name="sexo" label={t("Sexo")} options={[{ value: "hombre", label: t("Hombre") }, { value: "mujer", label: t("Mujer") }]} />
                  <Segment name="grupo_edad" label={t("Edad")} options={[{ value: "adulto", label: t("Adulto") }, { value: "niño", label: t("Niño") }]} />
                </div>

                <Field name="correo" label={t("Correo electrónico")} type="email" />
                <Select name="rol" label={t("Rol")} options={roleOptions} placeholder={t("Seleccionar") as string} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Select name="nombre_menu" label={t("Menú")} options={menuOptions.map((m) => ({ value: m as string, label: m as string }))} />
                  <Field name="passesQuantity" label={t("No. Acompañantes")} type="number" inputMode="numeric" />
                </div>
              </div>

              {/* Pie */}
              <div style={{ display: "flex", gap: 12, padding: "16px 30px 22px", borderTop: "1px solid #f0f0f2", background: "#fff" }}>
                <button type="button" onClick={onClose} style={{ padding: "13px 22px", borderRadius: 12, background: "#f5f5f7", border: "none", color: "#6b6b72", font: "600 13px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: 13, borderRadius: 12, background: isSubmitting ? "#f19bbb" : "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: isSubmitting ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>{t("Crear invitado")}</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined" ? createPortal(content, document.body) : null;
};

export default FormInvitadoStudio;
