'use client';

/**
 * IaLevelPicker — chip clicable en el header de la conversación que
 * permite alternar entre los 3 niveles de IA (Diseño P2 24-jun):
 *   · Manual    — la IA no genera nada, cero llamadas al modelo
 *   · Copiloto  — borrador automático tras mensaje del cliente, requiere aprobación
 *   · Autopiloto — envía inmediatamente sin aprobación (escala si baja confianza)
 *
 * Diseño tokens:
 *   Manual:     bg #F1F0F5 color #6B6678
 *   Copiloto:   bg #CCFBF1 color #0F766E border #99F6E4
 *   Autopiloto: bg #CFFAFE color #0E7490 border #A5F3FC
 *
 * Se configura por bandeja (scope) — y opcionalmente sobrescribible
 * por conversación. La persistencia real (backend) entra en próximo
 * commit cuando api-ia confirme schema de configuración IA por workspace.
 */
import { useEffect, useRef, useState } from 'react';

export type IaLevel = 'manual' | 'copilot' | 'autopilot';

const LEVEL_CONFIG: Record<
  IaLevel,
  { label: string; bg: string; color: string; border: string; icon?: string; desc: string }
> = {
  manual: {
    label: 'Manual',
    bg: '#F1F0F5',
    color: '#6B6678',
    border: 'transparent',
    desc: 'La IA no genera nada. Tú escribes todas las respuestas.',
  },
  copilot: {
    label: 'Copiloto',
    icon: '✦',
    bg: '#CCFBF1',
    color: '#0F766E',
    border: '#99F6E4',
    desc: 'La IA genera borradores. Tú apruebas antes de enviar.',
  },
  autopilot: {
    label: 'Autopiloto',
    icon: '⚡',
    bg: '#CFFAFE',
    color: '#0E7490',
    border: '#A5F3FC',
    desc: 'La IA envía automáticamente. Escala a humano si baja confianza.',
  },
};

interface IaLevelPickerProps {
  level: IaLevel;
  onChange: (next: IaLevel) => void;
  /** Si true, deshabilita el cambio (modo solo-lectura). */
  disabled?: boolean;
}

export function IaLevelPicker({ level, onChange, disabled = false }: IaLevelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = LEVEL_CONFIG[level];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
        title={cfg.desc}
        type="button"
      >
        {cfg.icon && <span aria-hidden>{cfg.icon}</span>}
        <span>{cfg.label}</span>
        <span aria-hidden className="ml-0.5 opacity-60">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {(Object.keys(LEVEL_CONFIG) as IaLevel[]).map((v) => {
            const c = LEVEL_CONFIG[v];
            const isActive = level === v;
            return (
              <button
                aria-selected={isActive}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                  isActive ? 'bg-gray-50' : ''
                }`}
                key={v}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
                >
                  {c.icon && <span aria-hidden>{c.icon}</span>}
                  {c.label}
                </span>
                <span className="mt-0.5 text-[11px] text-gray-500">{c.desc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
