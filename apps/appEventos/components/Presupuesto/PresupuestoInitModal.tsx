/**
 * PresupuestoInitModal
 *
 * Aparece cuando un evento no tiene categorías de presupuesto.
 * Ofrece 3 opciones:
 *   1. Generar con IA (usa KB del planner via RAG)
 *   2. Copiar de otro evento (DuplicatePresupuesto existente)
 *   3. Empezar desde cero (cierra el modal)
 */

import { FC, useState } from 'react';
import { EventContextProvider } from '../../context';

interface Props {
  onClose: () => void;
  onDuplicate: () => void;
}

export const PresupuestoInitModal: FC<Props> = ({ onClose, onDuplicate }) => {
  const { event } = EventContextProvider();
  const [generating, setGenerating] = useState(false);

  const handleGenerateWithAI = () => {
    if (generating) return;
    setGenerating(true);

    const eventName = event?.nombre || 'mi evento';
    const guests = (event as any)?.cant_invitados || '';
    const eventDate = (event as any)?.fecha;
    const date = eventDate
      ? new Date(eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      : '';

    // Construir prompt rico con contexto del evento
    const parts = [
      `Quiero generar las categorías de presupuesto para el evento "${eventName}".`,
    ];
    if (guests) parts.push(`Hay aproximadamente ${guests} invitados.`);
    if (date) parts.push(`La fecha es ${date}.`);
    parts.push(
      'Usa mi base de conocimiento para proponer las categorías más adecuadas con sus porcentajes estimados según el presupuesto total del evento. ' +
      'Para cada categoría crea también las partidas (gastos) principales con su coste estimado. ' +
      'Utiliza la herramienta create_budget_category para cada categoría y create_budget_item para cada partida.'
    );

    const promptMessage = parts.join(' ');

    // Disparar CustomEvent — CopilotIframe lo captura y lo reenvía al iframe
    window.dispatchEvent(
      new CustomEvent('copilot:send-prompt', {
        detail: {
          message: promptMessage,
          context: {
            eventId: event?._id,
            eventName: event?.nombre,
            numGuests: guests,
            eventDate: date,
          },
        },
      })
    );

    onClose();
  };

  // BUG-CW-N01 (informe QA 22-jun noche): permitir cerrar modal con ESC o
  // click en el backdrop (fuera del contenido). Sin esto, el modal era
  // imposible de cerrar excepto eligiendo una de las 3 opciones — el QA
  // automation no podía interactuar con el panel detrás.
  if (typeof window !== 'undefined') {
    // Listener Escape (solo uno por instancia)
    (window as any).__presupuestoInitModalEscBound = (window as any).__presupuestoInitModalEscBound || false
    if (!(window as any).__presupuestoInitModalEscBound) {
      const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', onEsc, { once: true })
      ;(window as any).__presupuestoInitModalEscBound = true
      setTimeout(() => { (window as any).__presupuestoInitModalEscBound = false }, 100)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        // Click en el backdrop (no en el contenido del modal) → cerrar.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="bg-primary px-6 py-4 relative">
          {/* BUG-CW-N01: botón X visible para cerrar el modal sin tener que elegir
              una opción. Mejora UX y permite QA automation acceder al panel detrás. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-2 right-3 text-white/80 hover:text-white text-xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            ×
          </button>
          <h2 className="text-white font-display font-semibold text-lg pr-8">¿Cómo quieres empezar?</h2>
          <p className="text-white/80 text-xs mt-0.5">Este evento aún no tiene categorías de presupuesto</p>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Opción 1: IA */}
          <button
            onClick={handleGenerateWithAI}
            disabled={generating}
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-primary text-sm">Generar con IA</p>
              <p className="text-xs text-gray-500 mt-0.5">
                El copilot usará tu base de conocimiento para proponer categorías y partidas adaptadas a tu estilo de trabajo y país.
              </p>
            </div>
          </button>

          {/* Opción 2: Duplicar */}
          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left group"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Copiar de otro evento</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Importa las categorías y partidas de un evento anterior que ya tengas configurado.
              </p>
            </div>
          </button>

          {/* Opción 3: Desde cero */}
          <button
            onClick={onClose}
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
          >
            <span className="text-2xl">📝</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Empezar desde cero</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Crea las categorías manualmente a tu ritmo.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
