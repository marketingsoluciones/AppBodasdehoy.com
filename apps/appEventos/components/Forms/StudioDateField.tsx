import { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

/**
 * StudioDateField — selector de fecha propio con el tema rosa studio, en vez del
 * calendario nativo del navegador (azul, no estilizable). Guarda el mismo formato
 * "yyyy-mm-dd" que producía <input type="date"> → no cambia la lógica de guardado.
 */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DOW = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"]; // semana empieza en domingo (como el nativo)
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m 0-based
const parseISO = (s: any): { y: number; m: number; d: number } | null => {
  if (!s || typeof s !== "string") return null;
  const p = s.split("T")[0].split("-");
  const y = +p[0], m = +p[1], d = +p[2];
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
};
const eq = (a: any, b: { y: number; m: number; d: number }) => !!a && a.y === b.y && a.m === b.m && a.d === b.d;

const navBtn: any = { width: 25, height: 25, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #ececef", color: "#6b6b72", cursor: "pointer" };
const footBtn: any = { background: "none", border: "none", cursor: "pointer", font: "600 11.5px Poppins", color: "#EF5B94", padding: "3px 5px" };

interface Props { name: string; label?: string; }

const StudioDateField: FC<Props> = ({ name, label }) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField(name);
  const { setValue } = helpers;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sel = parseISO(field.value);
  const now = new Date();
  const [view, setView] = useState<{ y: number; m: number }>(() => sel ? { y: sel.y, m: sel.m } : { y: now.getFullYear(), m: now.getMonth() });

  const openCal = () => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    const s = parseISO(field.value);
    if (s) setView({ y: s.y, m: s.m });
    setOpen(true);
  };

  const pick = (d: Date) => { setValue(toISO(d.getFullYear(), d.getMonth(), d.getDate())); setOpen(false); };

  const display = sel ? `${pad(sel.d)}/${pad(sel.m + 1)}/${sel.y}` : "";

  // Rejilla de 42 celdas empezando en domingo (muestra colas del mes anterior/siguiente en gris).
  const first = new Date(view.y, view.m, 1);
  const gridStart = new Date(view.y, view.m, 1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const cal = open && mounted && pos ? createPortal(
    <>
      <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10000 }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 10001, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, boxShadow: "0 18px 44px rgba(0,0,0,.16)", padding: "11px 12px 9px", width: 258, maxWidth: "94vw", fontFamily: "'Poppins',sans-serif" }}>
        {/* Cabecera mes + navegación */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <div style={{ font: "700 12.5px Poppins", color: "#3A3A42", textTransform: "capitalize" }}>{MESES[view.m]} {view.y}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" title={t("Mes anterior", { defaultValue: "Mes anterior" }) as string} onClick={() => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })} style={navBtn}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
            <button type="button" title={t("Mes siguiente", { defaultValue: "Mes siguiente" }) as string} onClick={() => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })} style={navBtn}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
          </div>
        </div>
        {/* Días de la semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {DOW.map((d) => <div key={d} style={{ textAlign: "center", font: "600 9.5px Poppins", color: "#a0a0a8", padding: "1px 0" }}>{d}</div>)}
        </div>
        {/* Rejilla de días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {days.map((d, i) => {
            const cur = { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
            const inMonth = d.getMonth() === view.m;
            const isSel = eq(sel, cur);
            const isToday = eq(today, cur);
            return (
              <button type="button" key={i} onClick={() => pick(d)} className="sdf-day" style={{
                height: 29, borderRadius: 8, border: "none", cursor: "pointer",
                font: isSel ? "700 11.5px Poppins" : "500 11.5px Poppins",
                background: isSel ? "#EF5B94" : "transparent",
                color: isSel ? "#fff" : inMonth ? "#3A3A42" : "#c9c9cf",
                boxShadow: isToday && !isSel ? "inset 0 0 0 1.5px #F5A8C7" : "none",
                transition: "background .12s",
              }}>{d.getDate()}</button>
            );
          })}
        </div>
        {/* Pie: Borrar / Hoy */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f2f2f4" }}>
          <button type="button" onClick={() => { setValue(""); setOpen(false); }} style={footBtn}>{t("Borrar", { defaultValue: "Borrar" })}</button>
          <button type="button" onClick={() => pick(new Date())} style={footBtn}>{t("Hoy", { defaultValue: "Hoy" })}</button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: ".sdf-day:hover{background:#FCE7F0 !important;}" }} />
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div>
      {label && <label>{label}</label>}
      <div ref={anchorRef} onClick={openCal} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1.5px solid ${open ? "#EF5B94" : "#E7E7EA"}`, borderRadius: 10, padding: "11px 14px", background: "#fff", cursor: "pointer", transition: "border-color .15s" }}>
        <span style={{ font: "500 13px Poppins", color: display ? "#3A3A42" : "#a0a0a8" }}>{display || "dd/mm/aaaa"}</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      </div>
      {meta.touched && meta.error && <p style={{ font: "500 11px Poppins", color: "#D83E7C", marginTop: 4 }}>{meta.error as string}</p>}
      {cal}
    </div>
  );
};

export default StudioDateField;
