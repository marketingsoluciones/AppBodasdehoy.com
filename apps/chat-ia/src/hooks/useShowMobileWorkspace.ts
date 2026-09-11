import { parseAsBoolean, useQueryState } from 'nuqs';

/**
 * MOB-15 QA #34 (29-jun): el chat-dev en mobile mostraba el "session list"
 * por default (sin query param) ocupando 100% ancho. El área de chat real
 * quedaba inaccesible sin agregar `?showMobileWorkspace=true` manual.
 *
 * Fix: default a `true` en mobile → al entrar a /chat se ve el workspace
 * directamente. El user puede volver a la lista con back nav.
 * El default sigue siendo `null` (no se persiste en URL) para que el toggle
 * desde un click en la lista de sesiones siga funcionando.
 */
export const useShowMobileWorkspace = () => {
  const [showMobileWorkspace] = useQueryState(
    'showMobileWorkspace',
    parseAsBoolean.withDefault(true).withOptions({ clearOnDefault: true }),
  );

  return showMobileWorkspace;
};
