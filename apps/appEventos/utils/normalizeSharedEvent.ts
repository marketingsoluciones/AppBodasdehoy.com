import type { Event } from './Interfaces';

/**
 * Prepara un evento compartido para el usuario actual sin asumir que los arrays
 * legacy de usuarios y detalles tienen la misma longitud.
 *
 * Los eventos antiguos pueden contener el UID en compartido_array pero no tener
 * la entrada equivalente en detalles_compartidos_array. En ese caso se conserva
 * el evento con permisos vacios: la UI sigue disponible sin conceder permisos
 * que el backend no haya enviado.
 */
export function normalizeEventShareForUser(event: Event, userUid?: string): Event {
  const sharedUserIds = Array.isArray(event?.compartido_array) ? event.compartido_array : [];
  const shareDetails = Array.isArray(event?.detalles_compartidos_array)
    ? event.detalles_compartidos_array
    : [];
  const currentUserIndex = userUid ? sharedUserIds.findIndex((uid) => uid === userUid) : -1;

  if (currentUserIndex < 0) return event;

  const currentUserDetail = shareDetails[currentUserIndex];
  const permissions = Array.isArray(currentUserDetail?.permissions)
    ? [...currentUserDetail.permissions]
    : [];

  return {
    ...event,
    permissions,
    compartido_array: sharedUserIds.filter((_, index) => index !== currentUserIndex),
    detalles_compartidos_array: shareDetails.filter((_, index) => index !== currentUserIndex),
  };
}
