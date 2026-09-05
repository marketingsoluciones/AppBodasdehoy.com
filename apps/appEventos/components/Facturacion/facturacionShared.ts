/** Helpers compartidos por FacturacionStudio (escritorio) y FacturacionStudioMovil. */

export const QUOTA_SKUS = ["events-count", "guests-per-event", "ai-tokens", "image-gen", "whatsapp-msg", "sms-invitations", "storage-gb"];
export const eur = (n: number) => n.toFixed(2).replace(".", ",") + "€";
export const WL_FEATS = ["Instancia dedicada", "Firebase propio", "Branding personalizado", "Copiloto IA", "Wallet prepago", "Soporte prioritario", "API acceso completo", "Gestor de cuenta dedicado"];
export const ORDER = ["FREE", "BASIC", "PRO", "MAX", "ENTERPRISE"];

export function getSupportLabel(r: any) { return r?.white_label ? "Dedicado" : r?.priority_support ? "Prioritario" : "Comunidad"; }

export function extractFlags(plan: any) {
  const r = plan.feature_restrictions ?? {};
  const flags: { label: string; included: boolean }[] = [{ label: "Copiloto IA", included: true }, { label: "Wallet prepago", included: true }];
  if (plan.global_discount?.value) flags.push({ label: `${plan.global_discount.value}% descuento en servicios`, included: true });
  else flags.push({ label: "Descuentos en servicios", included: false });
  flags.push({ label: `Soporte ${getSupportLabel(r)}`, included: true });
  if (r.api_access) flags.push({ label: "API acceso completo", included: true });
  if (r.white_label) flags.push({ label: "Gestor de cuenta dedicado", included: true });
  return flags;
}
