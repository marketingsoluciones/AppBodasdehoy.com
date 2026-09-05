import { FC, useRef, useState } from "react";
import { humanizeQuota } from "@bodasdehoy/shared/plans";
import InformacionFacturacionStudio from "./InformacionFacturacionStudio";
import HistorialFacturacionStudio from "./HistorialFacturacionStudio";
import { QUOTA_SKUS, eur, extractFlags, WL_FEATS, ORDER } from "./facturacionShared";

/**
 * Facturación — versión MÓVIL (fiel al HTML de referencia).
 * Reutiliza los mismos datos y handlers del backend que FacturacionStudio
 * (usePlanLimits, subscribeToPlan, customerPortal). Solo cambia el layout:
 * tabs en scroll horizontal, slider de planes con dots, tarjeta Whitelabel
 * destacada y bottom-sheet de confirmación.
 */

const TABS_M = ["Planes", "Métodos de pago", "Información", "Historial"];

interface Props {
  loading: boolean;
  tab: number; setTab: (n: number) => void;
  anual: boolean; setAnual: (v: boolean) => void;
  mainPlans: any[]; whitelabelPlan: any; curPlan: any;
  tier: string; curIdx: number; curPrice: string;
  openModal: (plan: any) => void;
  choose: (planId: string) => void;
  subscribing: string | null;
  openPortal: () => void; portalLoading: boolean;
  modal: any; setModal: (m: any) => void;
}

const CHECK = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M20 6L9 17l-5-5" /></svg>
);
const CROSS = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c8c8ce" strokeWidth={2.8} strokeLinecap="round" style={{ flex: "none" }}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

const FacturacionStudioMovil: FC<Props> = ({
  loading, tab, setTab, anual, setAnual,
  mainPlans, whitelabelPlan, curPlan, tier, curIdx, curPrice,
  openModal, choose, subscribing, openPortal, portalLoading, modal, setModal,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState(0);
  const onSliderScroll = () => {
    const el = sliderRef.current; if (!el) return;
    const cardW = el.scrollWidth / Math.max(1, mainPlans.length);
    setDot(Math.max(0, Math.min(mainPlans.length - 1, Math.round(el.scrollLeft / cardW))));
  };
  const isWLcurrent = tier === "ENTERPRISE";

  // Tarjeta Whitelabel (destacada arriba si es el plan actual; upsell abajo si no).
  const wlCard = (current: boolean) => {
    if (!whitelabelPlan) return null;
    const price = whitelabelPlan.tier === "FREE" ? "Gratis" : eur(whitelabelPlan.pricing.monthly_fee);
    return (
      <section style={{ background: "#fff", border: "1.5px solid #F8CFE2", borderRadius: 16, padding: "22px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ font: "700 18px Poppins", color: "#3A3A42" }}>Whitelabel</div>
          {current && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: "#E4F5EE", font: "600 10.5px Poppins", color: "#1E8F63" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Tu plan actual
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ font: "800 30px Poppins", color: "#3A3A42" }}>{price}</span>
          <span style={{ font: "500 12.5px Poppins", color: "#a0a0a8" }}>{whitelabelPlan.tier === "FREE" ? "" : "/mes"}</span>
        </div>
        <div style={{ font: "500 12px Poppins", color: "#8a8a90", lineHeight: 1.6, margin: "12px 0 14px" }}>Instancia dedicada, Firebase propio, branding personalizado y soporte prioritario para tu marca blanca.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
          {WL_FEATS.map((f) => <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>{CHECK}<span style={{ font: "500 11.5px Poppins", color: "#6b6b72" }}>{f}</span></div>)}
        </div>
        {!current && (
          <button onClick={() => openModal(whitelabelPlan)} style={{ width: "100%", padding: 13, borderRadius: 10, background: "#EF5B94", border: "none", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", marginTop: 16, cursor: "pointer" }}>Cambiar a Whitelabel</button>
        )}
      </section>
    );
  };

  return (
    <div className="md:hidden" style={{ maxWidth: 430, margin: "0 auto", padding: "14px 16px 40px", position: "relative", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".fs-hscroll{scrollbar-width:none;}.fs-hscroll::-webkit-scrollbar{display:none;}.fs-in:focus{border-color:#EF5B94!important;}" }} />

      {/* TABS */}
      <div className="fs-hscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 14px" }}>
        {TABS_M.map((label, i) => {
          const on = tab === i;
          return <button key={i} onClick={() => setTab(i)} style={{ flex: "none", padding: "9px 16px", borderRadius: 10, border: `1px solid ${on ? "#EF5B94" : "#E7E7EA"}`, background: on ? "#EF5B94" : "#fff", font: "600 12.5px Poppins", color: on ? "#fff" : "#6b6b72", whiteSpace: "nowrap", minHeight: 38, cursor: "pointer" }}>{label}</button>;
        })}
      </div>

      {/* CONTEXTO PLAN ACTUAL */}
      {curPlan && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 999, background: "#FCE7F0", border: "1px solid #F8CFE2" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8Z" /></svg>
            <span style={{ font: "600 11px Poppins", color: "#EF5B94" }}>Tu plan: <b>{curPlan.name}</b> · {curPrice}</span>
          </div>
        </div>
      )}

      {/* ===== PLANES ===== */}
      {tab === 0 && (loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#a0a0a8", font: "500 13px Poppins" }}>Cargando planes…</div>
      ) : (
        <div>
          {/* Segmento Mensual/Anual */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-flex", background: "#fff", border: "1px solid #ececef", borderRadius: 999, padding: 5, gap: 4 }}>
              <button onClick={() => setAnual(false)} style={{ padding: "10px 20px", borderRadius: 999, background: anual ? "transparent" : "#EF5B94", color: anual ? "#6b6b72" : "#fff", font: "600 12.5px Poppins", boxShadow: anual ? "none" : "0 4px 12px rgba(239,91,148,.3)", border: "none", minHeight: 40, cursor: "pointer" }}>Mensual</button>
              <button onClick={() => setAnual(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 999, background: anual ? "#EF5B94" : "transparent", color: anual ? "#fff" : "#6b6b72", font: "600 12.5px Poppins", boxShadow: anual ? "0 4px 12px rgba(239,91,148,.3)" : "none", border: "none", minHeight: 40, cursor: "pointer" }}>Anual <span style={{ font: "700 11.5px Poppins", color: anual ? "#fff" : "#EF5B94" }}>−20%</span></button>
            </div>
          </div>

          {/* Whitelabel actual arriba */}
          {isWLcurrent && wlCard(true)}

          {/* Encabezado slider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ font: "700 11px Poppins", letterSpacing: 1.5, textTransform: "uppercase", color: "#a0a0a8" }}>Planes disponibles</div>
            <div style={{ font: "500 10.5px Poppins", color: "#c0b8bc" }}>Desliza →</div>
          </div>

          {/* Slider de planes */}
          <div ref={sliderRef} onScroll={onSliderScroll} className="fs-hscroll" style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", padding: "14px 2px 4px", margin: "0 -16px 6px" }}>
            <div style={{ flex: "none", width: 2 }} />
            {mainPlans.map((plan: any) => {
              const isPro = plan.tier === "PRO";
              const isCurrent = plan.tier === tier;
              const isFree = plan.tier === "FREE";
              const pop = isPro && !isCurrent;
              const upgrade = ORDER.indexOf(plan.tier) > curIdx;
              const priceN = anual && plan.pricing.annual_fee ? plan.pricing.annual_fee / 12 : plan.pricing.monthly_fee;
              const note = isCurrent ? "Tu plan activo" : isFree ? "Siempre gratis" : anual ? `Anual · ahorras ${Math.round(plan.pricing.monthly_fee * 0.2 * 12)}€/año` : "Facturado cada mes";
              const quotas = (plan.product_limits || []).filter((l: any) => QUOTA_SKUS.includes(l.sku));
              const flags = extractFlags(plan);
              const cta = isCurrent ? "Plan actual" : upgrade ? "Mejorar a este plan" : isFree ? "Cambiar a Gratis" : "Cambiar a este plan";
              return (
                <div key={plan.plan_id} style={{ position: "relative", flex: "none", width: "82%", scrollSnapAlign: "center", background: pop ? "#FDF4F8" : "#fff", border: `${(pop || isCurrent) ? "1.5px" : "1px"} solid ${isCurrent ? "#B7E3CE" : pop ? "#EF5B94" : "#ececef"}`, borderRadius: 16, padding: "24px 20px 20px", boxShadow: pop ? "0 10px 30px rgba(239,91,148,.16)" : "none" }}>
                  {pop && <div style={{ position: "absolute", top: -12, left: 20, padding: "5px 13px", borderRadius: 999, background: "#EF5B94", color: "#fff", font: "700 10.5px Poppins", whiteSpace: "nowrap", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>★ Más popular</div>}
                  {isCurrent && <div style={{ position: "absolute", top: -12, left: 20, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 999, background: "#E4F5EE", border: "1px solid #B7E3CE", color: "#1E8F63", font: "700 10.5px Poppins", whiteSpace: "nowrap" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Tu plan actual</div>}
                  <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}><span style={{ font: "800 28px Poppins", color: "#3A3A42" }}>{isFree ? "Gratis" : eur(priceN)}</span><span style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{isFree ? "" : "/mes"}</span></div>
                  <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{note}</div>
                  <button onClick={() => !isCurrent && openModal(plan)} disabled={isCurrent || subscribing === plan.plan_id} style={{ width: "100%", padding: 13, borderRadius: 10, background: isCurrent ? "#f7f7f9" : pop ? "#EF5B94" : "#fff", border: `1.5px solid ${isCurrent ? "#f7f7f9" : "#EF5B94"}`, color: isCurrent ? "#a0a0a8" : pop ? "#fff" : "#EF5B94", font: "600 13px Poppins", boxShadow: pop ? "0 6px 16px rgba(239,91,148,.3)" : "none", margin: "14px 0 16px", minHeight: 46, cursor: isCurrent ? "default" : "pointer" }}>{cta}</button>
                  <div style={{ font: "700 10px Poppins", letterSpacing: 1, textTransform: "uppercase", color: "#b3b3ba", marginBottom: 10 }}>Incluye</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {quotas.map((l: any) => <div key={l.sku} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}><span style={{ font: "500 11.5px Poppins", color: "#6b6b72" }}>{l.service_name}</span><span style={{ font: "700 11.5px Poppins", color: "#3A3A42", textAlign: "right", whiteSpace: "nowrap" }}>{humanizeQuota(l.sku, l.free_quota)}</span></div>)}
                  </div>
                  <div style={{ font: "700 10px Poppins", letterSpacing: 1, textTransform: "uppercase", color: "#b3b3ba", marginBottom: 10 }}>Funcionalidades</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {flags.map((f) => <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 11.5px Poppins", color: f.included ? "#6b6b72" : "#c8c8ce" }}>{f.included ? CHECK : CROSS}<span>{f.label}</span></div>)}
                  </div>
                </div>
              );
            })}
            <div style={{ flex: "none", width: 2 }} />
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 20 }}>
            {mainPlans.map((_: any, i: number) => <span key={i} style={{ width: i === dot ? 20 : 7, height: 7, borderRadius: 999, background: i === dot ? "#EF5B94" : "#e3d9de", transition: "all .25s" }} />)}
          </div>

          {/* Whitelabel upsell abajo (si no es el actual) */}
          {!isWLcurrent && wlCard(false)}

          <div style={{ textAlign: "center", font: "500 11px Poppins", color: "#a0a0a8", lineHeight: 1.6 }}>Precios sin IVA. El IVA se calcula en el checkout según tu país. Puedes cancelar en cualquier momento.</div>
        </div>
      ))}

      {/* ===== MÉTODOS DE PAGO ===== */}
      {tab === 1 && (
        <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></svg></div>
          <div style={{ font: "700 16px Poppins", color: "#3A3A42", marginBottom: 8 }}>Sin métodos de pago</div>
          <div style={{ font: "500 12.5px Poppins", color: "#8a8a90", lineHeight: 1.6, marginBottom: 20 }}>Gestiona tus tarjetas y métodos de pago de forma segura a través del portal de Stripe.</div>
          <button onClick={openPortal} disabled={portalLoading} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: 13, borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", minHeight: 46, cursor: "pointer", opacity: portalLoading ? 0.7 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            {portalLoading ? "Abriendo…" : "Gestionar métodos de pago"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
          </button>
          <div style={{ marginTop: 11, font: "500 11px Poppins", color: "#8a8a90" }}>Se abre el portal seguro de Stripe</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setTab(0); }} style={{ marginTop: 8, font: "500 12px Poppins", color: "#8a8a90", textDecoration: "underline" }}>Ver planes de suscripción</a>
        </section>
      )}

      {/* ===== INFORMACIÓN / HISTORIAL (mismos componentes backend) ===== */}
      {tab === 2 && <InformacionFacturacionStudio />}
      {tab === 3 && <HistorialFacturacionStudio />}

      {/* ===== BOTTOM SHEET confirmación ===== */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(58,58,66,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "26px 22px 34px", width: "100%", maxWidth: 430, boxShadow: "0 -10px 40px rgba(58,58,66,.25)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: "#e7e7ea", margin: "0 auto 18px" }} />
            <div style={{ font: "700 17px Poppins", color: "#3A3A42", marginBottom: 8 }}>¿Cambiar al plan {modal.name}?</div>
            <div style={{ font: "500 12.5px Poppins", color: "#8a8a90", lineHeight: 1.6, marginBottom: 14 }}>{modal.body}</div>
            {modal.losses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {modal.losses.map((l: string, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#D83E7C" strokeWidth={2.8} strokeLinecap="round" style={{ flex: "none" }}><path d="M6 6l12 12M18 6L6 18" /></svg><span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>{l}</span></div>)}
              </div>
            )}
            {modal.charge && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 999, background: "#FBF0DA", border: "1px solid #EBD298", marginBottom: 18 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg><span style={{ font: "600 11px Poppins", color: "#B4801F" }}>{modal.charge}</span></div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => { const p = modal.plan; setModal(null); choose(p.plan_id); }} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", minHeight: 48, cursor: "pointer" }}>Confirmar cambio</button>
              <button onClick={() => setModal(null)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#f7f7f9", color: "#6b6b72", font: "600 13.5px Poppins", border: "none", minHeight: 48, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturacionStudioMovil;
