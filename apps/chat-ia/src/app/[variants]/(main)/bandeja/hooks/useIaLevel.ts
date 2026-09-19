'use client';

import { useCallback, useEffect, useState } from 'react';

import { getIaLevel, saveIaLevel, type IaLevel } from '../data/iaConfig';



/**
 * useIaLevel — nivel de IA del workspace (manual · copilot · autopilot).
 *
 * M4 (16-09): esto vivía suelto dentro de ConversationHeader, que iba por 857 líneas
 * mezclando datos, permisos, IA y pintura. Separado, se puede probar y reutilizar.
 *
 * `copilot` como valor mientras carga y si el servidor no responde: es el comportamiento
 * que ya tenía y el menos sorprendente (la IA propone, no envía sola).
 */
export function useIaLevel(development: string) {
  const [level, setLevel] = useState<IaLevel>('copilot');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await getIaLevel(development);
        if (!cancelled && saved) setLevel(saved);
      } catch {
        /* silencio: se queda en 'copilot' */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [development]);

  /**
   * Cambia el nivel. La interfaz se mueve al instante y el servidor confirma después; si
   * rechaza, se vuelve atrás — antes un 401 se perdía en silencio y el usuario creía haberlo
   * cambiado.
   */
  const change = useCallback(
    async (next: IaLevel) => {
      const previous = level;
      setLevel(next);
      try {
        const saved = await saveIaLevel(development, next);
        if (!saved) {
          setLevel(previous);
          // eslint-disable-next-line no-console
          console.warn('[bandeja] el servidor no guardó el nivel de IA');
        }
      } catch {
        setLevel(previous);
      }
    },
    [development, level],
  );

  return { change, level };
}

export {type IaLevel} from '../data/iaConfig';