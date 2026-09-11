import { Formik, Form, useField, FormikValues } from "formik";
import { createPortal } from "react-dom";
import { formikValidateUx } from "./formikValidateUx";
import { FC, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import * as yup from "yup";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { normalizeMenus } from "../../utils/mcpSchemaAdapter";
import { useTranslation } from "react-i18next";

/**
 * FormCrearMenuStudio — modal "Menús del evento" fiel al HTML studio, igual que
 * "Crear invitado"/"Crear grupo": panel lateral IZQUIERDO por encima de todo
 * (portal a body). MISMO backend: queries.createMenu + queries.deleteMenu.
 * Nota: el backend NO expone edición/renombrado de menú (solo crear/borrar).
 */

const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #EF9CC0", borderRadius: 10, padding: "11px 14px", font: "500 13px Poppins", color: "#3A3A42", outline: "none", background: "#fff" };
const labelStyle: React.CSSProperties = { font: "600 12.5px Poppins", color: "#EF5B94", marginBottom: 7, display: "block" };
const errStyle: React.CSSProperties = { font: "500 11px Poppins", color: "#D83E7C", marginTop: 5 };

const CUTLERY = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v7c0 1.1.9 2 2 2s2-.9 2-2V3M6 12v9M17 3c-1.7 1-3 3.2-3 5.5 0 2 1.3 3.5 3 3.5v9" /></svg>;
const TRASH = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>;

const Field: FC<{ name: string; label: string }> = ({ name, label }) => {
  const [field, meta] = useField(name);
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <input {...field} name={name} type="text" className="fcm-in" style={inputStyle} />
      {meta.touched && meta.error && <div style={errStyle}>{String(meta.error)}</div>}
    </div>
  );
};

const validationSchema = yup.object().shape({ nombre: yup.string().required("Nombre requerido") });

const FormCrearMenuStudio: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const menus: any[] = event?.menus_array || [];

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const result: any = await fetchApiBodas({
        query: queries.createMenu,
        variables: { eventID: event._id, menu: { title: values.nombre, nombre: values.nombre, nombre_menu: values.nombre, precio: 0 } },
      });
      if (!result?.success || (result?.errors?.length ?? 0) > 0) {
        const backendMsg = result?.errors?.[0]?.message;
        toast("error", `${t("Ha ocurrido un error al crear el menú")}${backendMsg ? `: ${backendMsg}` : ""}`);
        return;
      }
      setEvent((old: any) => ({ ...old, menus_array: normalizeMenus(result?.evento?.menus_array) }));
      toast("success", t("Menú creado con exito"));
      actions.resetForm();
    } catch {
      toast("error", t("Ha ocurrido un error al crear el menú"));
    } finally {
      actions.setSubmitting(false);
    }
  };

  const handleDelete = async (menu: any) => {
    try {
      const { evento }: any = await fetchApiBodas({ query: queries.deleteMenu, variables: { eventID: event._id, menuId: menu?._id } });
      setEvent((old: any) => {
        const invitados_array = (old.invitados_array || []).map((g: any) => (g.nombre_menu === menu?.nombre_menu ? { ...g, nombre_menu: null } : g));
        return { ...old, menus_array: normalizeMenus(evento?.menus_array), invitados_array };
      });
      toast("success", t("Menú borrado con exito"));
    } catch {
      toast("error", t("Ha ocurrido un error al borrar el menú"));
    }
  };

  const content = (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(40,40,46,.45)", display: "flex", alignItems: "stretch", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes fcm-slidein{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}.fcm-in:focus{border-color:#EF5B94!important;}.fcm-body::-webkit-scrollbar{width:0;height:0;}" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "94vw", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(0,0,0,.14)", animation: "fcm-slidein .22s ease" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px 16px", borderBottom: "1px solid #f0f0f2" }}>
          <h2 style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Menús del evento")}</h2>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", border: "none", background: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>

        {/* Cuerpo */}
        <div className="fcm-body" style={{ padding: "22px 30px", display: "flex", flexDirection: "column", gap: 18, overflow: "auto", flex: 1 }}>
          <Formik {...formikValidateUx} initialValues={{ nombre: "" }} onSubmit={handleSubmit} validationSchema={validationSchema}>
            {({ isSubmitting }) => (
              <Form style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field name="nombre" label={t("Nombre del menú")} />
                <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: 13, borderRadius: 12, background: isSubmitting ? "#f19bbb" : "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: isSubmitting ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>{t("Crear menú")}</button>
              </Form>
            )}
          </Formik>

          {/* Lista de menús creados */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {menus.length === 0 && <div style={{ padding: "18px 4px", font: "500 12.5px Poppins", color: "#a0a0a8", textAlign: "center" }}>{t("Aún no hay menús.")}</div>}
            {menus.map((m, i) => (
              <div key={m?._id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 4px", borderBottom: i < menus.length - 1 ? "1px solid #f5f5f7" : "none" }}>
                <span style={{ color: "#3A3A42", flex: "none", display: "flex" }}>{CUTLERY}</span>
                <span style={{ font: "500 13.5px Poppins", color: "#3A3A42", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m?.nombre_menu}</span>
                <button type="button" title={t("Borrar") as string} onClick={() => handleDelete(m)} className="fcm-del" style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c4c4cc", cursor: "pointer", border: "none", background: "none", flex: "none" }}>{TRASH}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined" ? createPortal(content, document.body) : null;
};

export default FormCrearMenuStudio;
