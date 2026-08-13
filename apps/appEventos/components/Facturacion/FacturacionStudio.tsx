import { FC, useState } from "react";
import { usePlanLimits } from "../../hooks/usePlanLimits";
import { humanizeQuota, TIER_COLORS } from "@bodasdehoy/shared/plans";
import { resolveApiBodasGraphqlUrl } from "../../utils/apiEndpoints";
import { MetodosDePago, InformacionFacturacion, HistorialFacturacion } from "./index";

const QUOTA_SKUS = ["events-count", "guests-per-event", "ai-tokens", "image-gen", "whatsapp-msg", "sms-invitations", "storage-gb"];
const eur = (n: number) => n.toFixed(2).replace(".", ",") + "€";

function getSupportLabel(r: any) { return r?.white_label ? "Dedicado" : r?.priority_support ? "Prioritario" : "Comunidad"; }
function extractFlags(plan: any) {
  const r = plan.feature_restrictions ?? {};
  const flags: { label: string; included: boolean }[] = [{ label: "Copiloto IA", included: true }, { label: "Wallet prepago", included: true }];
  if (plan.global_discount?.value) flags.push({ label: `${plan.global_discount.value}% descuento en servicios`, included: true });
  else flags.push({ label: "Descuentos en servicios", included: false });
  flags.push({ label: `Soporte ${getSupportLabel(r)}`, included: true });
  if (r.api_access) flags.push({ label: "API acceso completo", included: true });
  if (r.white_label) flags.push({ label: "Gestor de cuenta dedicado", included: true });
  return flags;
}

async function handleSubscribePlan(planId: string, billingPeriod: "monthly" | "yearly") {
  const { authBridge } = await import("@bodasdehoy/shared");
  const authState = authBridge.getSharedAuthState();
  if (!authState.idToken) { window.location.href = "/login"; return; }
  const API_MCP_URL = resolveApiBodasGraphqlUrl();
  const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || "bodasdehoy";
  const res = await fetch(API_MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authState.idToken}`, "X-Development": DEVELOPMENT },
    body: JSON.stringify({
      query: `mutation SubscribeToPlan($plan_id: String!, $billing_period: String, $success_url: String!, $cancel_url: String!) { subscribeToPlan(plan_id: $plan_id, billing_period: $billing_period, success_url: $success_url, cancel_url: $cancel_url) { success checkout_url } }`,
      variables: { plan_id: planId, billing_period: billingPeriod, success_url: `${window.location.origin}/facturacion?upgraded=1`, cancel_url: `${window.location.origin}/facturacion?cancelled=1` },
    }),
  });
  const json = await res.json();
  const url = json.data?.subscribeToPlan?.checkout_url;
  if (url) window.location.href = url;
}

const WL_FEATS = ["Instancia dedicada", "Firebase propio", "Branding personalizado", "Copiloto IA", "Wallet prepago", "Soporte prioritario", "API acceso completo", "Gestor de cuenta dedicado"];
const TABS = ["Planes", "Métodos de pago", "Información de facturación", "Historial de facturación"];
const ORDER = ["FREE", "BASIC", "PRO", "MAX", "ENTERPRISE"];

const FacturacionStudio: FC = () => {
  const { allPlans, tier, loading } = usePlanLimits() as any;
  const [tab, setTab] = useState(0);
  const [anual, setAnual] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const allActive = (allPlans || []).filter((p: any) => p.is_active !== false).sort((a: any, b: any) => a.pricing.monthly_fee - b.pricing.monthly_fee);
  const mainPlans = allActive.filter((p: any) => p.tier !== "ENTERPRISE" && p.tier !== "CUSTOM");
  const whitelabelPlan = allActive.find((p: any) => p.tier === "ENTERPRISE");
  const curPlan = allActive.find((p: any) => p.tier === tier);
  const curPrice = curPlan ? (curPlan.tier === "FREE" ? "Gratis" : eur(curPlan.pricing.monthly_fee) + "/mes") : "";
  const curIdx = ORDER.indexOf(tier);

  const choose = async (planId: string) => { setSubscribing(planId); try { await handleSubscribePlan(planId, anual ? "yearly" : "monthly"); } finally { setSubscribing(null); } };

  const openModal = (plan: any) => {
    const upgrade = ORDER.indexOf(plan.tier) > curIdx;
    const priceTxt = plan.tier === "FREE" ? null : (anual && plan.pricing.annual_fee ? eur(plan.pricing.annual_fee) + "/año" : eur(plan.pricing.monthly_fee) + "/mes");
    setModal({
      plan,
      name: plan.name,
      body: upgrade
        ? "El cambio se aplica de inmediato. Hoy se factura la diferencia prorrateada de tu ciclo actual."
        : `Tu plan ${curPlan?.name || tier} seguirá activo hasta el fin de tu ciclo. Después tus límites pasarán a los de ${plan.name}.`,
      losses: upgrade ? [] : (plan.product_limits || []).filter((l: any) => QUOTA_SKUS.includes(l.sku)).map((l: any) => `${l.service_name}: ${humanizeQuota(l.sku, l.free_quota)}`),
      charge: priceTxt ? `${priceTxt} · ${upgrade ? "facturado a partir de hoy" : "al renovar"}` : null,
    });
  };

  const pill = (bg: string, fg: string, brd: string, text: any) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 999, background: bg, border: `1px solid ${brd}`, font: "600 11.5px Poppins", color: fg, whiteSpace: "nowrap" }}>{text}</span>
  );

  return (
    <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", padding: "24px 20px 80px", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".fs-in:focus{border-color:#EF5B94!important;}" }} />

      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {TABS.map((label, i) => {
          const on = tab === i;
          return <button key={i} onClick={() => setTab(i)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${on ? "#EF5B94" : "#E7E7EA"}`, background: on ? "#EF5B94" : "#fff", font: "600 13px Poppins", color: on ? "#fff" : "#6b6b72", whiteSpace: "nowrap", cursor: "pointer" }}>{label}</button>;
        })}
      </div>

      {/* CONTEXTO PLAN ACTUAL */}
      {curPlan && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, background: "#FCE7F0", border: "1px solid #F8CFE2" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8Z" /></svg>
            <span style={{ font: "600 12px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>Tu plan actual: <b>{curPlan.name}</b> · {curPrice}</span>
          </div>
        </div>
      )}

      {/* ===== PLANES ===== */}
      {tab === 0 && (
        loading ? <div style={{ textAlign: "center", padding: 60, color: "#a0a0a8", font: "500 13px Poppins" }}>Cargando planes…</div> : (
          <div>
            {/* Toggle Mensual/Anual */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
              <div style={{ display: "inline-flex", background: "#fff", border: "1px solid #ececef", borderRadius: 999, padding: 5, gap: 4 }}>
                <button onClick={() => setAnual(false)} style={{ padding: "9px 22px", borderRadius: 999, background: anual ? "transparent" : "#EF5B94", color: anual ? "#6b6b72" : "#fff", font: "600 13px Poppins", boxShadow: anual ? "none" : "0 4px 12px rgba(239,91,148,.3)", cursor: "pointer", border: "none" }}>Mensual</button>
                <button onClick={() => setAnual(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 999, background: anual ? "#EF5B94" : "transparent", color: anual ? "#fff" : "#6b6b72", font: "600 13px Poppins", boxShadow: anual ? "0 4px 12px rgba(239,91,148,.3)" : "none", cursor: "pointer", border: "none" }}>Anual <span style={{ font: "700 12px Poppins", color: anual ? "#fff" : "#EF5B94" }}>−20%</span></button>
              </div>
            </div>

            {/* Whitelabel como plan actual (arriba) */}
            {whitelabelPlan && tier === "ENTERPRISE" && (
              <section style={{ background: "#fff", border: "1.5px solid #F8CFE2", borderRadius: 16, padding: "30px 34px", marginBottom: 30 }}>
                <div style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ font: "700 20px Poppins", color: "#3A3A42" }}>Whitelabel</div>
                      {pill("#E4F5EE", "#1E8F63", "#E4F5EE", <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Tu plan actual</>)}
                    </div>
                    <div style={{ font: "500 13px Poppins", color: "#8a8a90", lineHeight: 1.6, maxWidth: 560, marginBottom: 18 }}>Para empresas que quieren desplegar su propia marca blanca. Incluye instancia dedicada, Firebase propio, branding personalizado y soporte prioritario.</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,auto)", gap: "10px 34px", justifyContent: "start" }}>
                      {WL_FEATS.map((f) => <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg><span style={{ font: "500 12.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap" }}>{f}</span></div>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, justifyContent: "flex-end" }}><span style={{ font: "800 34px Poppins", color: "#3A3A42" }}>149€</span><span style={{ font: "500 13px Poppins", color: "#a0a0a8" }}>/mes</span></div>
                    <button disabled style={{ marginTop: 14, padding: "12px 24px", borderRadius: 10, background: "#f7f7f9", color: "#a0a0a8", font: "600 13px Poppins", cursor: "default", border: "none" }}>Plan actual</button>
                  </div>
                </div>
              </section>
            )}

            <div style={{ font: "700 12px Poppins", letterSpacing: 1.5, textTransform: "uppercase", color: "#a0a0a8", marginBottom: 22 }}>Planes disponibles</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, alignItems: "stretch", marginBottom: 24 }}>
              {mainPlans.map((plan: any) => {
                const isPro = plan.tier === "PRO";
                const isCurrent = plan.tier === tier;
                const isFree = plan.tier === "FREE";
                const pop = isPro && !isCurrent;
                const upgrade = ORDER.indexOf(plan.tier) > curIdx;
                const priceN = anual && plan.pricing.annual_fee ? plan.pricing.annual_fee / 12 : plan.pricing.monthly_fee;
                const quotas = (plan.product_limits || []).filter((l: any) => QUOTA_SKUS.includes(l.sku));
                const flags = extractFlags(plan);
                return (
                  <div key={plan.plan_id} style={{ position: "relative", background: pop ? "#FDF4F8" : "#fff", border: `${(pop || isCurrent) ? "1.5px" : "1px"} solid ${isCurrent ? "#B7E3CE" : pop ? "#EF5B94" : "#ececef"}`, borderRadius: 16, padding: "26px 22px", display: "flex", flexDirection: "column", boxShadow: pop ? "0 10px 30px rgba(239,91,148,.16)" : "none" }}>
                    {pop && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "6px 15px", borderRadius: 999, background: "#EF5B94", color: "#fff", font: "700 11px Poppins", whiteSpace: "nowrap", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>★ Más popular</div>}
                    {isCurrent && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 15px", borderRadius: 999, background: "#E4F5EE", border: "1px solid #B7E3CE", font: "700 11px Poppins", color: "#1E8F63", whiteSpace: "nowrap" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Tu plan actual</div>}
                    <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 10 }}>{plan.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}><span style={{ font: "800 32px Poppins", color: "#3A3A42" }}>{isFree ? "Gratis" : eur(priceN)}</span><span style={{ font: "500 13px Poppins", color: "#a0a0a8" }}>{isFree ? "" : "/mes"}</span></div>
                    <div style={{ font: "500 11.5px Poppins", color: "#a0a0a8", margin: "2px 0 18px", minHeight: 17 }}>{isCurrent ? "Tu plan activo" : isFree ? "Siempre gratis" : anual ? `Facturado anualmente · ahorras ${Math.round(plan.pricing.monthly_fee * 0.2 * 12)}€/año` : "Facturado cada mes"}</div>
                    <button onClick={() => !isCurrent && openModal(plan)} disabled={isCurrent || subscribing === plan.plan_id} style={{ padding: "12px 20px", borderRadius: 10, background: isCurrent ? "#f7f7f9" : pop ? "#EF5B94" : "#fff", border: `1.5px solid ${isCurrent ? "#f7f7f9" : "#EF5B94"}`, color: isCurrent ? "#a0a0a8" : pop ? "#fff" : "#EF5B94", font: "600 13px Poppins", boxShadow: pop ? "0 6px 16px rgba(239,91,148,.3)" : "none", marginBottom: 20, cursor: isCurrent ? "default" : "pointer" }}>{isCurrent ? "Plan actual" : upgrade ? "Mejorar a este plan" : isFree ? "Cambiar a Gratis" : "Cambiar a este plan"}</button>
                    <div style={{ font: "700 10.5px Poppins", letterSpacing: 1, textTransform: "uppercase", color: "#b3b3ba", marginBottom: 12 }}>Incluye</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
                      {quotas.map((l: any) => <div key={l.sku} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}><span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>{l.service_name}</span><span style={{ font: "700 12px Poppins", color: "#3A3A42", textAlign: "right", whiteSpace: "nowrap" }}>{humanizeQuota(l.sku, l.free_quota)}</span></div>)}
                    </div>
                    <div style={{ font: "700 10.5px Poppins", letterSpacing: 1, textTransform: "uppercase", color: "#b3b3ba", marginBottom: 12 }}>Funcionalidades</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {flags.map((f) => <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>{f.included ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M20 6L9 17l-5-5" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8c8ce" strokeWidth={2.8} strokeLinecap="round" style={{ flex: "none" }}><path d="M6 6l12 12M18 6L6 18" /></svg>}<span style={{ font: "500 12px Poppins", color: f.included ? "#6b6b72" : "#c8c8ce" }}>{f.label}</span></div>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Whitelabel upsell (abajo) */}
            {whitelabelPlan && tier !== "ENTERPRISE" && (
              <section style={{ background: "#fff", border: "1.5px solid #F8CFE2", borderRadius: 16, padding: "30px 34px", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ font: "700 20px Poppins", color: "#3A3A42", marginBottom: 10 }}>Whitelabel</div>
                    <div style={{ font: "500 13px Poppins", color: "#8a8a90", lineHeight: 1.6, maxWidth: 560, marginBottom: 18 }}>Para empresas que quieren desplegar su propia marca blanca. Incluye instancia dedicada, Firebase propio, branding personalizado y soporte prioritario.</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,auto)", gap: "10px 34px", justifyContent: "start" }}>
                      {WL_FEATS.map((f) => <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg><span style={{ font: "500 12.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap" }}>{f}</span></div>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, justifyContent: "flex-end" }}><span style={{ font: "800 34px Poppins", color: "#3A3A42" }}>149€</span><span style={{ font: "500 13px Poppins", color: "#a0a0a8" }}>/mes</span></div>
                    <button onClick={() => openModal(whitelabelPlan)} style={{ marginTop: 14, padding: "12px 24px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", cursor: "pointer" }}>Cambiar a Whitelabel</button>
                  </div>
                </div>
              </section>
            )}

            <div style={{ textAlign: "center", font: "500 12px Poppins", color: "#a0a0a8" }}>Todos los precios mostrados no incluyen IVA. El IVA aplicable se calculará en el checkout según tu país de facturación. Puedes cancelar en cualquier momento.</div>

            {/* MODAL confirmación */}
            {modal && (
              <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(58,58,66,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
                <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "30px 34px", maxWidth: 460, width: "100%", boxShadow: "0 20px 50px rgba(58,58,66,.25)", fontFamily: "'Poppins',sans-serif" }}>
                  <div style={{ font: "700 19px Poppins", color: "#3A3A42", marginBottom: 8 }}>¿Cambiar al plan {modal.name}?</div>
                  <div style={{ font: "500 13px Poppins", color: "#8a8a90", lineHeight: 1.6, marginBottom: 18 }}>{modal.body}</div>
                  {modal.losses.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 20 }}>
                      {modal.losses.map((l: string, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D83E7C" strokeWidth={2.8} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg><span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{l}</span></div>)}
                    </div>
                  )}
                  {modal.charge && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, background: "#FBF0DA", border: "1px solid #EBD298", marginBottom: 20 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg><span style={{ font: "600 12px Poppins", color: "#B4801F", whiteSpace: "nowrap" }}>{modal.charge}</span></div>
                  )}
                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button onClick={() => setModal(null)} style={{ padding: "12px 20px", borderRadius: 10, background: "#f7f7f9", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={() => { const p = modal.plan; setModal(null); choose(p.plan_id); }} style={{ padding: "12px 20px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", cursor: "pointer" }}>Confirmar cambio</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ===== OTRAS PESTAÑAS (componentes existentes; se rediseñan en fases siguientes) ===== */}
      {tab === 1 && <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: 16 }}><MetodosDePago setOptionSelect={setTab} stripeCurrency={null} /></div>}
      {tab === 2 && <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: 16 }}><InformacionFacturacion /></div>}
      {tab === 3 && <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: 16 }}><HistorialFacturacion /></div>}
    </div>
  );
};

export default FacturacionStudio;
