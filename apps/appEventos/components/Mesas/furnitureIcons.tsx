import { FC, SVGProps } from 'react';

// Iconos de mobiliario EXACTOS del prototipo MESAS.dc.html (func furnIcon, líneas 395-401).
// stroke=currentColor → el color lo pone el contenedor (rosa #EF5B94 en el menú, gris #6b6b72
// en el plano). Aceptan props (className/style) para el cloneElement del canvas (ElementContent).
const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const TextoIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><path d="M5 6h14M12 6v13M9 19h6" /></svg>
);
export const ArbolIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><path d="M12 3l5 7h-3l3 5H7l3-5H7z" /><path d="M12 15v6" /></svg>
);
export const PlantaIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><path d="M12 21v-8" /><path d="M12 13c-4 0-6-2-6-6 4 0 6 2 6 6zM12 13c4 0 6-2 6-5-4 0-6 1-6 5z" /></svg>
);
export const CabinaDjIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8" cy="12" r="2.2" /><circle cx="16" cy="12" r="2.2" /></svg>
);
export const ArcoIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><path d="M5 21V11a7 7 0 0 1 14 0v10" /></svg>
);
export const PianoIcon: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="6" rx="1" /><path d="M6 11v8M18 11v8M6 15h12" /></svg>
);

export interface FurnitureDef {
  /** modelo/tipo que se guarda en el elemento (createElement tipo). 'text' es especial (Quill). */
  model: string;
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  size: { width: number; height: number };
}

// Paleta del menú Mobiliario (6, fiel al HTML). El orden = el del prototipo.
export const FURNITURE: FurnitureDef[] = [
  { model: 'text', label: 'Texto', Icon: TextoIcon, size: { width: 60, height: 120 } },
  { model: 'arbol', label: 'Árbol', Icon: ArbolIcon, size: { width: 60, height: 120 } },
  { model: 'planta', label: 'Planta', Icon: PlantaIcon, size: { width: 70, height: 100 } },
  { model: 'dj', label: 'Cabina DJ', Icon: CabinaDjIcon, size: { width: 140, height: 110 } },
  { model: 'arco', label: 'Arco', Icon: ArcoIcon, size: { width: 120, height: 120 } },
  { model: 'piano', label: 'Piano', Icon: PianoIcon, size: { width: 120, height: 120 } },
];
