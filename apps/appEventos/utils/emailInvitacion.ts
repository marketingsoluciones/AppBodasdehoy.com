/**
 * El HTML de la invitación por correo, y los datos de diseño que necesita.
 *
 * VIVÍA DENTRO DEL COMPONENTE, y esa era la razón de que nunca se hubiera probado:
 * para llamar a una función pura que devuelve una cadena había que arrancar el árbol
 * de React entero, y Jest se atragantaba antes de llegar (primero `document is not
 * defined`, luego un módulo que no sabe transformar). Afirmé que este HTML sobrevive
 * a Gmail y a Outlook sin haberlo renderizado una sola vez.
 *
 * Aquí es una función pura sobre datos, se prueba en milisegundos y el componente la
 * importa igual que antes.
 */

export type TemplateKey = "elegante" | "clasica" | "moderna";

export type FontKey = "elegante" | "moderna" | "script";

export interface DesignData {
  _studio: "v1";
  template: TemplateKey;
  font: FontKey;
  accent: string;
  cover: string;
  title: string;
  names: string;
  date: string;
  message: string;
  venue: string;
  time: string;
  rsvp: string;
}

export const PRESETS: Record<TemplateKey, { label: string; grad: string }> = {
  elegante: { label: "Elegante", grad: "linear-gradient(135deg,#e9d6c3,#d8bfa3)" },
  clasica: { label: "Clásica", grad: "linear-gradient(135deg,#ece4d6,#dccdb4)" },
  moderna: { label: "Moderna", grad: "linear-gradient(135deg,#dfe6ec,#b9cbdb)" },
};

export const PRESET_SOLIDO: Record<TemplateKey, string> = {
  elegante: "#e1cab3",
  clasica: "#e4d8c5",
  moderna: "#ccd8e4",
};

export const FUENTES_EMAIL: Record<FontKey, string> = {
  elegante: "Georgia,'Times New Roman',Times,serif",
  moderna: "'Segoe UI',Helvetica,Arial,sans-serif",
  script: "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif",
};

export const esc = (v: unknown): string =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const renderEmailHtml = (d: DesignData): string => {
  const p = PRESETS[d.template];
  const solido = PRESET_SOLIDO[d.template];
  const font = FUENTES_EMAIL[d.font];
  const acento = esc(d.accent);

  // Con foto, un <img> real (funciona en todas partes). Sin foto, franja de color.
  const portada = d.cover
    ? `<img src="${esc(d.cover)}" width="420" alt="" style="display:block;width:100%;max-width:420px;height:190px;object-fit:cover;border:0;outline:none;text-decoration:none;" />`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="190" bgcolor="${solido}" style="height:190px;background-color:${solido};background-image:${p.grad};">&nbsp;</td></tr></table>`;

  // Bloque de detalles (lo que en la tarjeta es el reverso). Solo si hay algo.
  const detalles = [
    d.venue ? `<div style="margin-top:6px;">${esc(d.venue)}</div>` : "",
    d.time ? `<div style="margin-top:6px;">${esc(d.time)}</div>` : "",
  ].join("");
  const bloqueDetalles = detalles
    ? `<tr><td style="padding:0 26px 4px;text-align:center;font-family:${font};font-size:13px;color:#8a8a90;line-height:1.6;">${detalles}</td></tr>`
    : "";
  const bloqueRsvp = d.rsvp
    ? `<tr><td style="padding:18px 26px 0;text-align:center;font-family:${font};font-size:12px;font-weight:bold;color:${acento};letter-spacing:1px;">${esc(d.rsvp)}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(d.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f1f4;">
<!-- Preheader: lo que se lee en la lista del buzón, antes de abrir. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(d.message)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f1f4" style="background-color:#f1f1f4;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="420" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:420px;max-width:420px;background-color:#ffffff;border:1px solid #f0f0f2;">
      <tr><td style="font-size:0;line-height:0;border-bottom:3px solid ${acento};">${portada}</td></tr>
      <tr><td style="padding:26px 26px 6px;text-align:center;font-family:${font};font-size:15px;font-weight:bold;color:${acento};letter-spacing:3px;">${esc(d.title)}</td></tr>
      <tr><td style="padding:14px 34px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" bgcolor="${acento}" style="height:1px;line-height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
      <tr><td style="padding:0 26px;text-align:center;font-family:${font};font-size:26px;font-weight:bold;color:#3A3A42;">${esc(d.names)}</td></tr>
      <tr><td style="padding:8px 26px 0;text-align:center;font-family:${font};font-size:12px;font-weight:bold;color:${acento};">${esc(d.date)}</td></tr>
      <tr><td style="padding:14px 26px 0;text-align:center;font-family:${font};font-size:13.5px;color:#8a8a90;line-height:1.6;">${esc(d.message)}</td></tr>
      ${bloqueDetalles}
      ${bloqueRsvp}
      <tr><td style="height:30px;line-height:30px;font-size:0;">&nbsp;</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
};
