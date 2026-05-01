type McpInvitado = {
  id: string
  nombre: string
  email?: string | null
  telefono?: string | null
  menu?: { id?: string; nombre?: string; precio?: number } | null
  menu_seleccion?: { entrada?: string; plato_principal?: string; postre?: string; bebida?: string } | null
  alergenos?: string[] | null
  asistencia?: string | null
  acompanantes?: number | null
  mesa?: string | null
  puesto?: string | null
  rol?: string | null
  sexo?: string | null
  grupo_edad?: string | null
  comunicaciones?: {
    tipo?: string
    estado?: string
    fecha?: string
    mensaje_id?: string
    template_name?: string
  }[] | null
}

type McpMenu = {
  id?: string | null
  nombre?: string | null
  nombre_menu?: string | null
  precio?: number | null
  descripcion?: string | null
  ingredientes?: string[] | null
  restricciones_compatibles?: string[] | null
}

export function normalizeInvitados(invitados: McpInvitado[] | undefined | null) {
  if (!invitados || !Array.isArray(invitados)) return []
  return invitados.map((g) => ({
    _id: g.id,
    nombre: g.nombre,
    correo: g.email ?? '',
    telefono: g.telefono ?? '',
    nombre_menu: g.menu?.nombre ?? '',
    nombre_mesa: g.mesa ?? '',
    mesa: g.mesa ?? '',
    puesto: g.puesto ?? '',
    asistencia: g.asistencia ?? '',
    rol: g.rol ?? '',
    sexo: g.sexo ?? '',
    grupo_edad: g.grupo_edad ?? '',
    alergenos: g.alergenos ?? [],
    comunicaciones_array: (g.comunicaciones || []).map((c) => ({
      _id: '',
      tipo: c.tipo ?? '',
      transport: c.tipo ?? '',
      template_id: '',
      template_name: c.template_name ?? '',
      message_id: c.mensaje_id ?? '',
      statuses: [],
    })),
    chairs: undefined,
    chats_array: [],
    invitacion: undefined,
    fecha_invitacion: undefined,
    estatus: undefined,
    movil: undefined,
    direccion: undefined,
    poblacion: undefined,
    pais: undefined,
    father: undefined,
    passesQuantity: undefined,
    grupo_relacion: undefined,
    orden_puesto: undefined,
    tableNameRecepcion: undefined,
    tableNameCeremonia: undefined,
  }))
}

export function normalizeMenus(menus: unknown) {
  if (!menus || !Array.isArray(menus)) return []
  return (menus as any[]).map((m) => {
    if (typeof m === 'string') {
      return { nombre_menu: m, tipo: '', _id: m }
    }
    const nombre_menu =
      (typeof m?.nombre_menu === 'string' && m.nombre_menu) ||
      (typeof m?.nombre === 'string' && m.nombre) ||
      ''
    const _id =
      (typeof m?.id === 'string' && m.id) ||
      (typeof m?._id === 'string' && m._id) ||
      nombre_menu
    return { nombre_menu, tipo: '', _id }
  })
}
