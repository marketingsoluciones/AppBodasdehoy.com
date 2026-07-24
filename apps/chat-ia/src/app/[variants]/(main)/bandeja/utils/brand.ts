import { useTheme } from 'antd-style';

/**
 * Paleta de MARCA de la Bandeja, derivada del whitelabel activo.
 *
 * MULTI-MARCA (regla del proyecto): cada whitelabel elige su `primaryColor`
 * (bodasdehoy = #ec4899 rosa · otros = #6771ae, #6096B9, #ecb290…). El tema
 * (antd-style, `cssVar:true`, `AppTheme.tsx`) lo expone en `theme.colorPrimary`
 * y sus derivados. El prototipo "Bandeja - Prototipo.dc.html" usa #7C3AED como
 * color de marca de DEMOSTRACIÓN; aquí ese morado = el primario del whitelabel,
 * así cada marca se pinta en SU paleta.
 *
 * Lo que NO va aquí (colores SEMÁNTICOS, iguales entre marcas):
 *   RSVP (verde/ámbar/rojo), canales (WA verde, IG rosa, SMS gris…), IA teal/cyan.
 * Esos siguen fijos porque su significado no cambia por marca.
 */
export interface BandejaBrand {
  /** Color de marca (demo #7C3AED / #6B4EFF). */
  brand: string;
  /** Fondo claro de marca para estados activos (demo #EDE9FE / #F4F1FE / #EFE9FB). */
  brandBg: string;
  /** Fondo claro de marca al hover. */
  brandBgHover: string;
  /** Borde de marca suave (demo #C4B5FD). */
  brandBorder: string;
  /** Texto de marca sobre fondo claro (demo #5B21B6). */
  brandText: string;
  /** Texto sobre el color de marca sólido (blanco). */
  onBrand: string;
}

export function useBandejaBrand(): BandejaBrand {
  const theme = useTheme();
  return {
    brand: theme.colorPrimary,
    brandBg: theme.colorPrimaryBg,
    brandBgHover: theme.colorPrimaryBgHover,
    brandBorder: theme.colorPrimaryBorder,
    brandText: theme.colorPrimaryTextActive || theme.colorPrimaryText,
    onBrand: theme.colorTextLightSolid || '#fff',
  };
}
