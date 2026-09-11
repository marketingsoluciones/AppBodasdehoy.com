import { Formik, Form, useField, FormikValues } from "formik";
import { createPortal } from "react-dom";
import { formikValidateUx } from "./formikValidateUx";
import { FC, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import * as yup from "yup";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";

/**
 * FormCrearGrupoStudio — modal "Crear grupo" fiel al HTML studio, igual que
 * "Crear invitado": panel lateral IZQUIERDO por encima de todo (portal a body).
 * MISMO backend que FormCrearGrupo (mutación queries.createGroup).
 */

const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "11px 14px", font: "500 13px Poppins", color: "#3A3A42", outline: "none", background: "#fff" };
const labelStyle: React.CSSProperties = { font: "600 12.5px Poppins", color: "#EF5B94", marginBottom: 7, display: "block" };
const errStyle: React.CSSProperties = { font: "500 11px Poppins", color: "#D83E7C", marginTop: 5 };

const Field: FC<{ name: string; label: string }> = ({ name, label }) => {
  const [field, meta] = useField(name);
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <input {...field} name={name} type="text" className="fcg-in" style={{ ...inputStyle, borderColor: meta.touched && meta.error ? "#E85C7A" : "#E7E7EA" }} />
      {meta.touched && meta.error && <div style={errStyle}>{String(meta.error)}</div>}
    </div>
  );
};

const validationSchema = yup.object().shape({ nombre: yup.string().required("Nombre requerido") });

const FormCrearGrupoStudio: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const result: any = await fetchApiBodas({
        query: queries.createGroup,
        variables: { eventID: event._id, grupo: values.nombre },
      });
      if (!result?.success || (result?.errors?.length ?? 0) > 0) {
        const backendMsg = result?.errors?.[0]?.message;
        toast("error", `${t("Ha ocurrido un error al crear el grupo")}${backendMsg ? `: ${backendMsg}` : ""}`);
        return;
      }
      setEvent((old: any) => ({ ...old, grupos_array: result?.evento?.grupos_array ?? old?.grupos_array }));
      toast("success", t("Grupo creado con exito"));
      onClose();
    } catch {
      toast("error", t("Ha ocurrido un error al crear el grupo"));
    } finally {
      actions.setSubmitting(false);
    }
  };

  const content = (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(40,40,46,.45)", display: "flex", alignItems: "stretch", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes fcg-slidein{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}.fcg-in:focus{border-color:#EF5B94!important;}" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "94vw", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(0,0,0,.14)", animation: "fcg-slidein .22s ease" }}>
        <Formik {...formikValidateUx} initialValues={{ nombre: "" }} onSubmit={handleSubmit} validationSchema={validationSchema}>
          {({ isSubmitting }) => (
            <Form style={{ display: "flex", flexDirection: "column" }}>
              {/* Cabecera */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px 16px", borderBottom: "1px solid #f0f0f2" }}>
                <h2 style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Crear grupo")}</h2>
                <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", border: "none", background: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>
              {/* Cuerpo */}
              <div style={{ padding: "22px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
                <Field name="nombre" label={t("Nombre del grupo de invitados")} />
                <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: 13, borderRadius: 12, background: isSubmitting ? "#f19bbb" : "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: isSubmitting ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>{t("Crear grupo")}</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined" ? createPortal(content, document.body) : null;
};

export default FormCrearGrupoStudio;
