/**
 * tableRenderer.ts
 * Genera SVGs dinámicos de mesas según configuración del usuario.
 * Pure functions — sin React, sin DOM, sin side effects.
 *
 * Uso:
 *   const svgString = generateTableSVG(config);
 *   const dataUrl = tableToDataURL(svgString);
 *   // En appEventos: canvas.renderSVG(dataUrl)
 *   // En chat-ia:    <img src={dataUrl} />
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type TableShape = 'round' | 'rectangular' | 'oval' | 'square' | 'semicircle' | 'head';
export type ChairStyle = 'chiavari' | 'modern' | 'ghost' | 'bench' | 'none';

export interface TableConfig {
  tableId?: string;
  tableNumber?: number;
  tableName?: string;
  shape: TableShape;
  // Dimensiones reales (cm)
  realDiameterCm?: number;
  realWidthCm?: number;
  realHeightCm?: number;
  // Capacidad
  seats: number;
  seatsTop?: number;
  seatsBottom?: number;
  seatsLeft?: number;
  seatsRight?: number;
  // Estilo
  showChairs?: boolean;
  showNumber?: boolean;
  showName?: boolean;
  chairStyle?: ChairStyle;
  tableColor?: string;
  chairColor?: string;
  // Especial
  isHeadTable?: boolean;
  isKidsTable?: boolean;
  notes?: string;
  // Interno
  minSeats?: number;
  maxSeats?: number;
  autoDistribute?: boolean;
}

export interface TableTotalSize {
  widthCm: number;
  heightCm: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const CHAIR_W = 26;
const CHAIR_H = 16;
const CHAIR_GAP = 6;
const MIN_CM_PER_SEAT = 42;

const CHAIR_STYLES: Record<string, { fill: string; stroke: string; strokeWidth: number; rx: number } | null> = {
  chiavari: { fill: '#E8D5B7', stroke: '#8B6914', strokeWidth: 1.8, rx: 3 },
  modern:   { fill: '#D0D0D0', stroke: '#555555', strokeWidth: 1.5, rx: 2 },
  ghost:    { fill: 'rgba(220,220,220,0.25)', stroke: '#AAAAAA', strokeWidth: 2, rx: 4 },
  bench:    { fill: '#C4A882', stroke: '#6B4226', strokeWidth: 2, rx: 2 },
  none:     null,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALORES POR DEFECTO
// ─────────────────────────────────────────────────────────────────────────────

export const TABLE_DEFAULTS: Record<string, TableConfig> = {
  round: {
    shape: 'round',
    realDiameterCm: 150,
    seats: 8,
    minSeats: 4, maxSeats: 14,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
  'round-180': {
    shape: 'round',
    realDiameterCm: 180,
    seats: 10,
    minSeats: 6, maxSeats: 16,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
  rectangular: {
    shape: 'rectangular',
    realWidthCm: 240, realHeightCm: 90,
    seatsTop: 3, seatsBottom: 3, seatsLeft: 1, seatsRight: 1,
    seats: 8,
    minSeats: 2, maxSeats: 30,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
  oval: {
    shape: 'oval',
    realWidthCm: 220, realHeightCm: 110,
    seats: 10,
    minSeats: 6, maxSeats: 18,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
  square: {
    shape: 'square',
    realWidthCm: 90, realHeightCm: 90,
    seatsTop: 1, seatsBottom: 1, seatsLeft: 1, seatsRight: 1,
    seats: 4,
    minSeats: 2, maxSeats: 8,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
  head: {
    shape: 'semicircle',
    realWidthCm: 400, realHeightCm: 220,
    seats: 6,
    minSeats: 2, maxSeats: 12,
    tableColor: '#FDF5EC', chairColor: '#E8C4B8', chairStyle: 'chiavari',
    showChairs: true, showNumber: false, showName: true,
    tableName: 'Novios',
    isHeadTable: true, isKidsTable: false,
  },
  imperial: {
    shape: 'rectangular',
    realWidthCm: 500, realHeightCm: 90,
    seatsTop: 7, seatsBottom: 7, seatsLeft: 1, seatsRight: 1,
    seats: 16,
    minSeats: 6, maxSeats: 40,
    tableColor: '#F5F0E8', chairColor: '#E8D5B7', chairStyle: 'chiavari',
    showChairs: true, showNumber: true, showName: false,
    isHeadTable: false, isKidsTable: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIÓN DE CAPACIDAD
// ─────────────────────────────────────────────────────────────────────────────

export function getMaxSeats(config: TableConfig): number {
  const { shape, realDiameterCm, realWidthCm = 0, realHeightCm = 0 } = config;
  if (shape === 'round' || shape === 'oval') {
    const d = realDiameterCm ?? Math.max(realWidthCm, realHeightCm);
    return Math.min(20, Math.floor((Math.PI * d) / MIN_CM_PER_SEAT));
  }
  if (shape === 'rectangular' || shape === 'square') {
    const perimeter = 2 * (realWidthCm + realHeightCm);
    return Math.min(40, Math.floor(perimeter / MIN_CM_PER_SEAT));
  }
  return 12;
}

export function clampSeats(config: TableConfig): number {
  const max = getMaxSeats(config);
  return Math.min(Math.max(1, config.seats), max);
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR DE SILLA SVG
// ─────────────────────────────────────────────────────────────────────────────

function chairSVG(x: number, y: number, angleDeg: number, style: ChairStyle, color?: string): string {
  const s = CHAIR_STYLES[style];
  if (!s) return '';
  const fill = color ?? s.fill;
  return `
    <rect
      x="${-CHAIR_W / 2}" y="${-CHAIR_H / 2}"
      width="${CHAIR_W}" height="${CHAIR_H}"
      rx="${s.rx}"
      fill="${fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"
      transform="translate(${x},${y}) rotate(${angleDeg})"
    />`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESA REDONDA
// ─────────────────────────────────────────────────────────────────────────────

function generateRoundTableSVG(config: TableConfig): string {
  const {
    realDiameterCm = 150, seats, tableColor = '#F5F0E8', chairColor,
    chairStyle = 'chiavari', showNumber, showName, tableName, tableNumber,
    isHeadTable, isKidsTable,
  } = config;

  const r = realDiameterCm / 2;
  const chairDist = r + CHAIR_GAP + CHAIR_H / 2;
  const totalR = r + CHAIR_GAP + CHAIR_H;
  const vbSize = totalR * 2 + 4;
  const cx = vbSize / 2;
  const cy = vbSize / 2;

  let chairsSVG = '';
  for (let i = 0; i < seats; i++) {
    const angle = (i / seats) * 2 * Math.PI - Math.PI / 2;
    const sx = cx + chairDist * Math.cos(angle);
    const sy = cy + chairDist * Math.sin(angle);
    const angleDeg = (angle * 180) / Math.PI + 90;
    chairsSVG += chairSVG(sx, sy, angleDeg, chairStyle, chairColor);
  }

  const strokeColor = isHeadTable ? '#8B4513' : isKidsTable ? '#FFD700' : '#2C2C2C';
  const strokeWidth = isHeadTable ? 3 : 2;

  let centerText = '';
  if (showNumber && tableNumber) {
    centerText += `<text x="${cx}" y="${cy + 6}" font-family="Georgia,serif"
      font-size="${Math.max(14, r * 0.35)}" fill="${strokeColor}"
      text-anchor="middle">${tableNumber}</text>`;
  }
  if (showName && tableName) {
    centerText += `<text x="${cx}" y="${cy + (showNumber ? 22 : 6)}" font-family="Georgia,serif"
      font-size="${Math.max(10, r * 0.22)}" fill="${strokeColor}"
      text-anchor="middle" font-style="italic">${tableName}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vbSize} ${vbSize}"
    width="${vbSize}" height="${vbSize}"
    data-type="table" data-shape="round"
    data-real-width="${vbSize}" data-real-height="${vbSize}">
    ${chairsSVG}
    <circle cx="${cx}" cy="${cy}" r="${r}"
      fill="${tableColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    ${centerText}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESA RECTANGULAR / CUADRADA
// ─────────────────────────────────────────────────────────────────────────────

function generateRectangularTableSVG(config: TableConfig): string {
  const {
    realWidthCm = 240, realHeightCm = 90,
    seatsTop = 0, seatsBottom = 0, seatsLeft = 0, seatsRight = 0,
    tableColor = '#F5F0E8', chairColor, chairStyle = 'chiavari',
    showNumber, showName, tableName, tableNumber,
    isHeadTable, isKidsTable,
  } = config;

  const W = realWidthCm;
  const H = realHeightCm;
  const pad = CHAIR_GAP + CHAIR_H;
  const vbW = W + pad * 2 + 4;
  const vbH = H + pad * 2 + 4;
  const mx = pad + 2;
  const my = pad + 2;

  let chairsSVG = '';

  if (seatsTop > 0) {
    const step = W / (seatsTop + 1);
    for (let i = 1; i <= seatsTop; i++) {
      chairsSVG += chairSVG(mx + step * i, my - CHAIR_GAP - CHAIR_H / 2, 0, chairStyle, chairColor);
    }
  }
  if (seatsBottom > 0) {
    const step = W / (seatsBottom + 1);
    for (let i = 1; i <= seatsBottom; i++) {
      chairsSVG += chairSVG(mx + step * i, my + H + CHAIR_GAP + CHAIR_H / 2, 180, chairStyle, chairColor);
    }
  }
  if (seatsLeft > 0) {
    const step = H / (seatsLeft + 1);
    for (let i = 1; i <= seatsLeft; i++) {
      chairsSVG += chairSVG(mx - CHAIR_GAP - CHAIR_H / 2, my + step * i, -90, chairStyle, chairColor);
    }
  }
  if (seatsRight > 0) {
    const step = H / (seatsRight + 1);
    for (let i = 1; i <= seatsRight; i++) {
      chairsSVG += chairSVG(mx + W + CHAIR_GAP + CHAIR_H / 2, my + step * i, 90, chairStyle, chairColor);
    }
  }

  const strokeColor = isHeadTable ? '#8B4513' : isKidsTable ? '#FFD700' : '#2C2C2C';
  const strokeWidth = isHeadTable ? 3 : 2;
  const textCx = mx + W / 2;
  const textCy = my + H / 2;

  let centerText = '';
  if (showNumber && tableNumber) {
    centerText += `<text x="${textCx}" y="${textCy + 6}" font-family="Georgia,serif"
      font-size="${Math.min(20, H * 0.35)}" fill="${strokeColor}" text-anchor="middle">${tableNumber}</text>`;
  }
  if (showName && tableName) {
    centerText += `<text x="${textCx}" y="${textCy + (showNumber ? 22 : 6)}" font-family="Georgia,serif"
      font-size="${Math.min(13, H * 0.22)}" fill="${strokeColor}" text-anchor="middle" font-style="italic">${tableName}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vbW} ${vbH}"
    width="${vbW}" height="${vbH}"
    data-type="table" data-shape="rectangular"
    data-real-width="${vbW}" data-real-height="${vbH}">
    ${chairsSVG}
    <rect x="${mx}" y="${my}" width="${W}" height="${H}" rx="4"
      fill="${tableColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    ${centerText}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESA OVAL
// ─────────────────────────────────────────────────────────────────────────────

function generateOvalTableSVG(config: TableConfig): string {
  const {
    realWidthCm = 220, realHeightCm = 110, seats,
    tableColor = '#F5F0E8', chairColor, chairStyle = 'chiavari',
    showNumber, showName, tableName, tableNumber,
    isHeadTable, isKidsTable,
  } = config;

  const rx = realWidthCm / 2;
  const ry = realHeightCm / 2;
  const pad = CHAIR_GAP + CHAIR_H;
  const vbW = realWidthCm + pad * 2 + 4;
  const vbH = realHeightCm + pad * 2 + 4;
  const cx = vbW / 2;
  const cy = vbH / 2;

  let chairsSVG = '';
  for (let i = 0; i < seats; i++) {
    const angle = (i / seats) * 2 * Math.PI - Math.PI / 2;
    const ex = rx * Math.cos(angle);
    const ey = ry * Math.sin(angle);
    const len = Math.sqrt(ex * ex + ey * ey);
    const nx = ex / len;
    const ny = ey / len;
    const dist = len + CHAIR_GAP + CHAIR_H / 2;
    chairsSVG += chairSVG(cx + nx * dist, cy + ny * dist, (angle * 180) / Math.PI + 90, chairStyle, chairColor);
  }

  const strokeColor = isHeadTable ? '#8B4513' : isKidsTable ? '#FFD700' : '#2C2C2C';
  let centerText = '';
  if (showNumber && tableNumber) {
    centerText = `<text x="${cx}" y="${cy + 6}" font-family="Georgia,serif"
      font-size="${Math.max(14, ry * 0.4)}" fill="${strokeColor}" text-anchor="middle">${tableNumber}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vbW} ${vbH}" width="${vbW}" height="${vbH}"
    data-type="table" data-shape="oval"
    data-real-width="${vbW}" data-real-height="${vbH}">
    ${chairsSVG}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
      fill="${tableColor}" stroke="${strokeColor}" stroke-width="2.5"/>
    ${centerText}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESA SEMICIRCULAR (NOVIOS)
// ─────────────────────────────────────────────────────────────────────────────

function generateHeadTableSVG(config: TableConfig): string {
  const {
    realWidthCm = 400, realHeightCm = 220, seats,
    tableColor = '#FDF5EC', chairColor, chairStyle = 'chiavari',
    showName, tableName,
  } = config;

  const W = realWidthCm;
  const H = realHeightCm;
  const pad = CHAIR_H + CHAIR_GAP + 4;
  const vbW = W + 4;
  const vbH = H + pad + 4;
  const centerX = vbW / 2;
  const tableTop = pad + 2;

  let chairsSVG = '';
  for (let i = 0; i < seats; i++) {
    const angle = Math.PI + (i / ((seats - 1) || 1)) * Math.PI;
    const dist = H * 0.7 + CHAIR_GAP + CHAIR_H / 2;
    chairsSVG += chairSVG(
      centerX + dist * Math.cos(angle),
      tableTop + dist * Math.sin(angle) + H * 0.3,
      (angle * 180) / Math.PI - 90,
      chairStyle,
      chairColor,
    );
  }

  const tablePath = `M ${2} ${tableTop} L ${W + 2} ${tableTop} Q ${W + 2} ${tableTop + H} ${centerX} ${tableTop + H} Q ${2} ${tableTop + H} ${2} ${tableTop} Z`;

  const centerText = showName && tableName
    ? `<text x="${centerX}" y="${tableTop + H * 0.55}" font-family="Georgia,serif"
        font-size="18" fill="#8B4513" text-anchor="middle" font-style="italic">${tableName}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vbW} ${vbH}" width="${vbW}" height="${vbH}"
    data-type="table" data-shape="semicircle"
    data-real-width="${vbW}" data-real-height="${vbH}">
    ${chairsSVG}
    <path d="${tablePath}" fill="${tableColor}" stroke="#8B4513" stroke-width="3"/>
    <circle cx="${centerX}" cy="${tableTop + H * 0.45}" r="${Math.min(W, H) * 0.12}"
      fill="none" stroke="#C8A882" stroke-width="1.5" stroke-dasharray="4,3"/>
    ${centerText}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRADA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera el SVG completo de una mesa según su configuración.
 */
export function generateTableSVG(config: TableConfig): string {
  const defaults = TABLE_DEFAULTS[config.shape] ?? TABLE_DEFAULTS.round;
  const cfg: TableConfig = { ...defaults, ...config };

  cfg.seats = clampSeats(cfg);

  if ((cfg.shape === 'rectangular' || cfg.shape === 'square') && cfg.autoDistribute !== false) {
    cfg.seats = (cfg.seatsTop ?? 0) + (cfg.seatsBottom ?? 0) + (cfg.seatsLeft ?? 0) + (cfg.seatsRight ?? 0);
  }

  switch (cfg.shape) {
    case 'round':         return generateRoundTableSVG(cfg);
    case 'rectangular':
    case 'square':        return generateRectangularTableSVG(cfg);
    case 'oval':          return generateOvalTableSVG(cfg);
    case 'semicircle':
    case 'head':          return generateHeadTableSVG(cfg);
    default:              return generateRoundTableSVG(cfg);
  }
}

/**
 * Convierte SVG string a data URL para usar en <img> o Fabric.js.
 */
export function tableToDataURL(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

/**
 * Calcula dimensiones totales del SVG generado (incluyendo sillas).
 */
export function getTableTotalSize(config: TableConfig): TableTotalSize {
  const cfg: TableConfig = { ...(TABLE_DEFAULTS[config.shape] ?? TABLE_DEFAULTS.round), ...config };
  const pad = (CHAIR_GAP + CHAIR_H) * 2;

  if (cfg.shape === 'round') {
    const total = (cfg.realDiameterCm ?? 150) + pad;
    return { widthCm: total, heightCm: total };
  }
  return {
    widthCm: (cfg.realWidthCm ?? 240) + pad,
    heightCm: (cfg.realHeightCm ?? 90) + pad,
  };
}
