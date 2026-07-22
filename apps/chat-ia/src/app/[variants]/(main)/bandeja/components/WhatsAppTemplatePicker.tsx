'use client';

/**
 * WhatsAppTemplatePicker — picker de plantillas HSM aprobadas para enviar
 * cuando la ventana de 24h de WhatsApp ha expirado (Diseño P5 24-jun).
 *
 * Renderizado inline encima del composer normal cuando se detecta ventana
 * expirada. Click en plantilla → callback `onSelect(template)` que el
 * caller usa para precargar el texto en el composer.
 *
 * Nota: el envío real de HSM por la WABA requiere un endpoint dedicado
 * (no el send normal de WhatsApp). Cableo del envío real cuando api-ia
 * o api-mcp expongan POST /api/whatsapp/messages/template (visto en
 * OpenAPI api-ia memorias previas, requiere ?development=).
 */
import { useState } from 'react';

import {
  type WhatsAppTemplate,
  templateBodyText,
  templateFillParams,
  templateParamCount,
  useWhatsAppTemplates,
} from '../hooks/useWhatsAppTemplates';

interface WhatsAppTemplatePickerProps {
  onSelect: (template: WhatsAppTemplate, bodyText: string) => void;
  onDismiss?: () => void;
}

export function WhatsAppTemplatePicker({ onSelect, onDismiss }: WhatsAppTemplatePickerProps) {
  const { templates, loading, error } = useWhatsAppTemplates(true);
  const [open, setOpen] = useState(false);
  // Fix 15-jul: si la template tiene params `{{N}}`, mostramos un mini formulario
  // para rellenarlos ANTES de precargar el textarea. Antes se cargaba el body con
  // los placeholders en crudo → user tenía que buscarlos y editarlos manualmente.
  const [paramDraft, setParamDraft] = useState<{
    template: WhatsAppTemplate;
    body: string;
    values: string[];
  } | null>(null);

  return (
    <div
      className="mb-2 flex flex-col gap-1 rounded-lg border px-3 py-2"
      style={{ backgroundColor: '#FEF6E7', borderColor: '#F59E0B' }}
      role="region"
      aria-label="Ventana 24h WhatsApp expirada"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="text-lg">⏰</span>
        <div className="flex-1">
          <div className="text-xs font-semibold" style={{ color: '#92400E' }}>
            Ventana 24h expirada
          </div>
          <div className="text-[11px]" style={{ color: '#78350F' }}>
            Sólo puedes enviar plantillas HSM aprobadas por Meta.
          </div>
        </div>
        {onDismiss && (
          <button
            aria-label="Cerrar aviso"
            className="text-xs"
            onClick={onDismiss}
            style={{ color: '#92400E' }}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <button
        aria-expanded={open}
        className="mt-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors"
        onClick={() => setOpen((v) => !v)}
        style={{
          backgroundColor: '#fff',
          border: '1px solid #FCD34D',
          color: '#92400E',
        }}
        type="button"
      >
        <span>
          {loading
            ? 'Cargando plantillas…'
            : error
              ? `Error: ${error.message}`
              : templates.length === 0
                ? 'No hay plantillas aprobadas en este workspace'
                : `Seleccionar plantilla aprobada (${templates.length})`}
        </span>
        <span aria-hidden className="opacity-60">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && !loading && !error && templates.length > 0 && (
        <ul
          className="mt-1 max-h-56 overflow-y-auto rounded-md border bg-white"
          role="listbox"
          style={{ borderColor: '#FCD34D' }}
        >
          {templates.map((t) => {
            const body = templateBodyText(t);
            const preview = body.slice(0, 80) + (body.length > 80 ? '…' : '');
            const nParams = templateParamCount(body);
            return (
              <li key={`${t.name}-${t.language}`}>
                <button
                  className="flex w-full flex-col items-start gap-0.5 border-b px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-amber-50"
                  onClick={() => {
                    if (nParams > 0) {
                      setParamDraft({ body, template: t, values: Array.from({ length: nParams }, () => '') });
                      setOpen(false);
                    } else {
                      onSelect(t, body);
                      setOpen(false);
                    }
                  }}
                  style={{ borderColor: '#FDE68A' }}
                  type="button"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800">{t.name}</span>
                    <span className="text-[9px] text-gray-500">
                      {t.language} · {t.category}
                    </span>
                    {nParams > 0 && (
                      <span className="rounded bg-amber-200 px-1 text-[9px] font-semibold text-amber-900">
                        {nParams} {nParams === 1 ? 'variable' : 'variables'}
                      </span>
                    )}
                  </span>
                  {preview && (
                    <span className="line-clamp-2 text-[10px] text-gray-600">{preview}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {paramDraft && (
        <div className="mt-2 rounded-md border bg-white p-2 text-[11px]" style={{ borderColor: '#FCD34D' }}>
          <div className="mb-1 font-semibold text-amber-900">
            Rellena las {paramDraft.values.length} {paramDraft.values.length === 1 ? 'variable' : 'variables'} de "{paramDraft.template.name}"
          </div>
          {paramDraft.values.map((v, i) => (
            <label className="mb-1 block" key={i}>
              <span className="text-[10px] text-gray-600">
                {`{{${i + 1}}}`}
              </span>
              <input
                className="w-full rounded border border-amber-200 px-2 py-1 text-[11px]"
                onChange={(e) => {
                  const next = [...paramDraft.values];
                  next[i] = e.target.value;
                  setParamDraft({ ...paramDraft, values: next });
                }}
                type="text"
                value={v}
              />
            </label>
          ))}
          <div className="mt-2 rounded bg-amber-50 p-1.5 text-[10px] text-gray-700">
            <span className="font-semibold">Vista previa:</span>{' '}
            {templateFillParams(paramDraft.body, paramDraft.values)}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
              onClick={() => setParamDraft(null)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
              onClick={() => {
                const filled = templateFillParams(paramDraft.body, paramDraft.values);
                onSelect(paramDraft.template, filled);
                setParamDraft(null);
              }}
              type="button"
            >
              Usar plantilla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
