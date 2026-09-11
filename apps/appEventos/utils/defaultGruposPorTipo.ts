/**
 * Grupos de invitados por defecto según el TIPO de evento.
 *
 * QA I2 (04-jul): al crear un evento el `grupos_array` quedaba vacío
 * (el backend createEvento no setea default y FormCrearEvento no lo
 * mandaba). El select "Rol" de FormInvitado lee `event.grupos_array`
 * → sin grupos, el form de crear invitado se bloqueaba permanentemente
 * (yup "Rol requerido" imposible de satisfacer).
 *
 * Decisión JCP (06-jul, D3 opción b): poblar grupos por defecto SEGÚN
 * el tipo de evento, para que el form nunca se bloquee y los nombres
 * sean coherentes con cada tipo. El owner puede editarlos después.
 *
 * NOTA: reutiliza la nomenclatura de boda que ya existía en
 * `utils/demoEvent.ts` (Familia novia/novio, Amigos novia/novio,
 * Compañeros trabajo) para el tipo BODA. Para el resto, grupos
 * genéricos sin roles de pareja.
 *
 * `tipo` aquí es el valor lowercase del select del front
 * (boda, cumpleaños, corporativo, …), NO el enum EventoTipo del backend.
 */

const GRUPOS_BODA = [
  'Familia novia',
  'Familia novio',
  'Amigos novia',
  'Amigos novio',
  'Compañeros trabajo',
];

const GRUPOS_GENERICOS = ['Familia', 'Amigos', 'Compañeros de trabajo', 'Otros'];

const GRUPOS_CORPORATIVO = ['Dirección', 'Empleados', 'Clientes', 'Proveedores', 'Prensa'];

const GRUPOS_INFANTIL = ['Familia', 'Amigos', 'Compañeros de clase', 'Otros'];

/**
 * Devuelve la lista de grupos por defecto para un tipo de evento dado.
 * Siempre devuelve al menos GRUPOS_GENERICOS (nunca array vacío) para
 * garantizar que el form de invitado nunca quede bloqueado.
 */
export function getDefaultGruposPorTipo(tipo?: string): string[] {
  const t = (tipo || '').toLowerCase().trim();

  switch (t) {
    case 'boda':
    case 'despedida de soltero':
      return [...GRUPOS_BODA];

    case 'corporativo':
    case 'religioso':
      return [...GRUPOS_CORPORATIVO];

    case 'cumpleaños':
    case 'comunión':
    case 'bautizo':
    case 'babyshower':
    case 'graduación':
      return [...GRUPOS_INFANTIL];

    // social, otro, o cualquier tipo no contemplado
    default:
      return [...GRUPOS_GENERICOS];
  }
}
