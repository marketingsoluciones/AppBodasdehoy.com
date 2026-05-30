// Capa adaptadora apiapp → api-mcp.
//
// Permite migrar el data-layer de eventos a api-mcp SIN tocar los ~167 call-sites ni sus
// consumers: fetchApiEventos consulta este registro por el nombre del campo GraphQL de la
// query legacy; si hay adaptador y está activo, traduce la PETICIÓN a la forma canónica de
// api-mcp (vía fetchApiBodas) y traduce la RESPUESTA de vuelta a la forma legacy que el front
// ya espera (incluyendo formas "superset" cuando distintos consumers leen cosas distintas).
//
// Activación por whitelist (ADAPTER_ENABLED): cero riesgo — lo no listado sigue por apiapp.
// El día que se apague apiapp, todo lo del registro ya habla api-mcp.

import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';

type Vars = Record<string, any>;

// Resuelve el tenant (development) que varios ops de api-mcp exigen como arg y que los call-sites
// legacy no pasaban. Cliente: por hostname; SSR/fallback: bodasdehoy.
// Mapeo central front("boda","cumpleaños"...) → enum EventoTipo de api-mcp (BODA, CUMPLEANOS, ...).
const TIPO_ENUM: Record<string, string> = {
  'boda': 'BODA', 'cumpleaños': 'CUMPLEANOS', 'comunión': 'COMUNION', 'bautizo': 'BAUTIZO',
  'babyshower': 'BABY_SHOWER', 'despedida de soltero': 'DESPEDIDA_SOLTERO', 'graduación': 'GRADUACION',
  'corporativo': 'CORPORATIVO', 'religioso': 'RELIGIOSO', 'social': 'SOCIAL', 'otro': 'OTRO',
};
const mapTipo = (t: any): any => {
  if (typeof t !== 'string') return t;
  return TIPO_ENUM[t.toLowerCase()] ?? t.toUpperCase();
};

const resolveDevelopment = (v: Vars): string => {
  if (typeof v?.development === 'string' && v.development) return v.development;
  if (typeof window !== 'undefined' && window?.location?.hostname) {
    try { return getDevelopmentNameFromHostname(window.location.hostname) || 'bodasdehoy'; } catch { /* noop */ }
  }
  return 'bodasdehoy';
};

export interface McpAdapterEntry {
  // Query/mutation canónica de api-mcp a ejecutar (vía fetchApiBodas).
  canonicalQuery: string;
  // Traduce las variables legacy → variables canónicas de api-mcp. null = no adaptar (cae a apiapp).
  mapVariables: (v: Vars) => Vars | null;
  // Traduce el payload canónico (Object.values(data)[0]) → forma legacy que esperan los consumers.
  mapResponse: (canonicalPayload: any, originalVars: Vars) => any;
}

// Extrae el primer nombre de campo (query/mutation) de un documento GraphQL.
export function extractGraphqlField(query: string): string | null {
  if (!query) return null;
  // salta 'query/mutation (...) {' y captura el primer identificador dentro del primer {
  const m = query.match(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[\s(({]/);
  if (m) return m[1];
  const m2 = query.match(/(?:query|mutation)\b[^{]*\{\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
  return m2 ? m2[1] : null;
}

const parsePresupuesto = (ev: any) => {
  const po = ev?.presupuesto_objeto;
  return typeof po === 'string' ? JSON.parse(po) : po;
};

// Respuesta superset de presupuesto: { ...entidadCreada?, evento:{presupuesto_objeto}, success, errors }.
const presupuestoSuperset = (p: any, pick?: (po: any) => any) => {
  const ev = p?.evento ?? {};
  const po = parsePresupuesto(ev) ?? {};
  const entity = pick ? pick(po) : {};
  return { ...(entity ?? {}), evento: { _id: ev._id, presupuesto_objeto: po }, success: p?.success, errors: p?.errors };
};
const lastGastoOf = (po: any, categoria_id: string) => {
  const cat = (po?.categorias_array ?? []).find((c: any) => String(c?._id) === String(categoria_id));
  const arr = cat?.gastos_array ?? [];
  return arr[arr.length - 1] ?? {};
};

// Registro de adaptadores, keyed por el nombre del campo GraphQL de la query LEGACY del front.
export const MCP_ADAPTERS: Record<string, McpAdapterEntry> = {
  // ── Presupuesto: nuevoCategoria → crearCategoriaPresupuesto ──
  // Consumers en conflicto: tableBudgetV8 lee result como ENTIDAD (result._id, push(result));
  // FormCrearCategoria lee result.evento.presupuesto_objeto. Devolvemos un SUPERSET:
  // la categoría creada (entidad) + .evento para los que leen presupuesto_objeto.
  nuevoCategoria: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria:CategoriaPresupuestoInput!){
      crearCategoriaPresupuesto(evento_id:$evento_id,categoria:$categoria){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      categoria: { nombre: v.nombre ?? v.categoria?.nombre ?? 'Nueva categoría' },
    }),
    mapResponse: (p, v) => {
      const ev = p?.evento ?? {};
      const po = parsePresupuesto(ev) ?? {};
      const cats = po?.categorias_array ?? [];
      const nombre = v.nombre ?? 'Nueva categoría';
      // la última categoría con ese nombre = la recién creada
      const created = [...cats].reverse().find((c: any) => c?.nombre === nombre) ?? cats[cats.length - 1] ?? {};
      // SUPERSET: entidad creada + evento (con presupuesto_objeto) para todos los consumers
      return { ...created, evento: { _id: ev._id, presupuesto_objeto: po }, success: p?.success, errors: p?.errors };
    },
  },

  // nuevoGasto → agregarGastoPresupuesto(evento_id, categoria_id, gasto:{nombre})
  // Consumers: BlockCategoria lee result.evento.presupuesto_objeto; tableBudgetV8 lee el gasto creado.
  nuevoGasto: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria_id:ID!,$gasto:GastoPresupuestoInput!){
      agregarGastoPresupuesto(evento_id:$evento_id,categoria_id:$categoria_id,gasto:$gasto){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      categoria_id: v.categoria_id,
      gasto: { nombre: v.nombre ?? v.gasto?.nombre ?? 'Nueva part. de gasto' },
    }),
    mapResponse: (p, v) => presupuestoSuperset(p, (po) => lastGastoOf(po, v.categoria_id)),
  },

  // borrarGasto → eliminarGastoPresupuesto(evento_id, categoria_id, gasto_id)
  // categoria_id ahora lo pasa el call-site (BlockCategoria parcheado para incluirlo).
  borrarGasto: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria_id:ID!,$gasto_id:ID!){
      eliminarGastoPresupuesto(evento_id:$evento_id,categoria_id:$categoria_id,gasto_id:$gasto_id){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, categoria_id: v.categoria_id, gasto_id: v.gasto_id }),
    mapResponse: (p) => presupuestoSuperset(p),
  },

  // nuevoItemGasto → nuevoItemGasto(evento_id, gasto_id, item:JSON!)  [api-mcp ignora categoria_id]
  nuevoItemGasto: {
    canonicalQuery: `mutation($evento_id:ID!,$gasto_id:ID!,$item:JSON!){
      nuevoItemGasto(evento_id:$evento_id,gasto_id:$gasto_id,item:$item){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, gasto_id: v.gasto_id, item: v.itemGasto ?? v.item ?? {} }),
    mapResponse: (p) => presupuestoSuperset(p),
  },

  // editItemGasto → editItemGasto(evento_id, gasto_id, item_id, datos:JSON!)  [variable/valor → datos:{}]
  editItemGasto: {
    canonicalQuery: `mutation($evento_id:ID!,$gasto_id:ID!,$item_id:ID!,$datos:JSON!){
      editItemGasto(evento_id:$evento_id,gasto_id:$gasto_id,item_id:$item_id,datos:$datos){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      gasto_id: v.gasto_id,
      item_id: v.itemGasto_id ?? v.item_id,
      datos: v.datos ?? (v.variable != null ? { [v.variable]: v.valor } : {}),
    }),
    mapResponse: (p) => presupuestoSuperset(p),
  },

  // ── Invitaciones/Templates ──
  // getWhatsappInvitationTemplates: el front no selecciona subfields (espera escalar); api-mcp
  // devuelve [WhatsappInvitationTemplate!] (typed). El adapter añade la selección y pasa el array.
  getWhatsappInvitationTemplates: {
    canonicalQuery: `query($evento_id:ID){
      getWhatsappInvitationTemplates(evento_id:$evento_id){ _id evento_id data created_at updated_at }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id }),
    mapResponse: (p) => p,
  },

  // getVariablesTemplatesInvitaciones: front sin subfields (escalar); api-mcp [TemplateVariable!]! typed.
  getVariablesTemplatesInvitaciones: {
    canonicalQuery: `query($evento_id:ID!){
      getVariablesTemplatesInvitaciones(evento_id:$evento_id){ key label value category }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id }),
    mapResponse: (p) => p,
  },

  // createWhatsappInvitationTemplate(evento_id, data:JSON) → WhatsappInvitationTemplate typed.
  createWhatsappInvitationTemplate: {
    canonicalQuery: `mutation($evento_id:ID,$data:JSON){
      createWhatsappInvitationTemplate(evento_id:$evento_id,data:$data){ _id evento_id data created_at updated_at }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, data: v.data }),
    mapResponse: (p) => p,
  },

  // deleteWhatsappInvitationTemplate(evento_id, template_id) → Boolean escalar (args compatibles).
  deleteWhatsappInvitationTemplate: {
    canonicalQuery: `mutation($evento_id:ID,$template_id:ID){
      deleteWhatsappInvitationTemplate(evento_id:$evento_id,template_id:$template_id)
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, template_id: v.template_id }),
    mapResponse: (p) => p,
  },

  // getEmailTemplate(template_id, development):JSON single. El front lee res[0].design (array) → wrap.
  getEmailTemplate: {
    canonicalQuery: `query($template_id:ID!,$development:String!){ getEmailTemplate(template_id:$template_id, development:$development) }`,
    mapVariables: (v) => ({ template_id: v.template_id, development: resolveDevelopment(v) }),
    mapResponse: (p) => (p == null ? [] : [p]),
  },

  // getPreviewsEmailTemplates(development):[JSON!]. Front pasa evento_id (ignorado); pide development.
  getPreviewsEmailTemplates: {
    canonicalQuery: `query($development:String!){ getPreviewsEmailTemplates(development:$development) }`,
    mapVariables: (v) => ({ development: resolveDevelopment(v) }),
    mapResponse: (p) => p,
  },

  // deleteEmailTemplate(template_id, development):JSON  (front pasa evento_id, no aceptado).
  deleteEmailTemplate: {
    canonicalQuery: `mutation($template_id:ID!,$development:String!){ deleteEmailTemplate(template_id:$template_id, development:$development) }`,
    mapVariables: (v) => ({ template_id: v.template_id, development: resolveDevelopment(v) }),
    mapResponse: (p) => p,
  },

  // ── Galería / Lista de regalos ──
  // getGalerySvgs(evento_id, development):[JSON!]. Front pide {total,results}; superset desde el array.
  getGalerySvgs: {
    canonicalQuery: `query($evento_id:ID!,$development:String!){ getGalerySvgs(evento_id:$evento_id, development:$development) }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, development: resolveDevelopment(v) }),
    mapResponse: (p) => ({ total: (p ?? []).length, results: p ?? [] }),
  },

  // guardarListaRegalos: el front usaba editEvento(variable_reemplazar). → updateEvento(input:{listaRegalos}).
  guardarListaRegalos: {
    canonicalQuery: `mutation($idEvento:ID!,$input:EventoUpdateInput!){ updateEvento(id:$idEvento, input:$input){ success errors{ field message code } evento{ _id listaRegalos } } }`,
    mapVariables: (v) => ({ idEvento: v.evento_id, input: { [v.variable_reemplazar ?? 'listaRegalos']: v.valor_reemplazar } }),
    mapResponse: (p) => ({ _id: p?.evento?._id, listaRegalos: p?.evento?.listaRegalos, success: p?.success, errors: p?.errors }),
  },

  // ── eventUpdate (variable/value → input) ── captura los call-sites legacy que aún pasan
  // {idEvento, variable, value}. Salta estatus/tipo (enum: estatus pendiente P3; tipo necesita mapeo)
  // devolviendo null en mapVariables → cae a apiapp hasta que se resuelvan.
  eventUpdate: {
    canonicalQuery: `mutation($idEvento:ID!,$input:EventoUpdateInput!){ updateEvento(id:$idEvento, input:$input){ success errors{ field message code } evento{ _id } } }`,
    mapVariables: (v) => {
      if (v.input) return { idEvento: v.idEvento, input: v.input };
      if (v.variable == null) return null;
      // P3 estatus: api-mcp ya acepta lowercase. tipo: el adapter mapea lowercase→enum EventoTipo.
      const val = v.variable === 'tipo' ? mapTipo(v.value) : v.value;
      return { idEvento: v.idEvento, input: { [v.variable]: val } };
    },
    mapResponse: (p) => p,
  },

  // ── Compartición ── inputCompartition {evento_id, usuario_id, permisos} mapea directo.
  addCompartitions: {
    canonicalQuery: `mutation($evento_id:ID!,$usuario_id:String!,$permisos:[String!]!){
      compartirEvento(evento_id:$evento_id, usuario_id:$usuario_id, permisos:$permisos){ success errors{ field message code } evento{ _id compartido_array } }
    }`,
    mapVariables: (v) => ({ evento_id: v.args?.evento_id, usuario_id: v.args?.usuario_id, permisos: v.args?.permisos ?? [] }),
    mapResponse: (p) => p,
  },
  updateCompartitions: {
    canonicalQuery: `mutation($evento_id:ID!,$usuario_id:String!,$permisos:[String!]!){
      compartirEvento(evento_id:$evento_id, usuario_id:$usuario_id, permisos:$permisos){ success errors{ field message code } evento{ _id compartido_array } }
    }`,
    mapVariables: (v) => ({ evento_id: v.args?.evento_id, usuario_id: v.args?.usuario_id, permisos: v.args?.permisos ?? [] }),
    mapResponse: (p) => p,
  },
  deleteCompartitions: {
    canonicalQuery: `mutation($evento_id:ID!,$usuario_id:String!){
      revocarAccesoEvento(evento_id:$evento_id, usuario_id:$usuario_id){ success errors{ field message code } evento{ _id compartido_array } }
    }`,
    mapVariables: (v) => ({ evento_id: v.args?.evento_id, usuario_id: v.args?.usuario_id }),
    mapResponse: (p) => p,
  },

  // ═══════════════════════════════════════════════════════════
  // P2 MESAS (planSpace) — desplegado 2026-05-29
  // ═══════════════════════════════════════════════════════════
  // Front legacy: createTable(eventID, planSpaceID, sectionID, values:JSON.stringify({...}))
  // Canónico:     createTable(evento_id, mesa:JSON!)
  createTable: {
    canonicalQuery: `mutation($evento_id:ID!,$mesa:JSON!){ createTable(evento_id:$evento_id, mesa:$mesa){ success errors{ field message code } evento{ _id } } }`,
    mapVariables: (v) => {
      let parsed: any = {};
      try { parsed = typeof v.values === 'string' ? JSON.parse(v.values) : (v.values ?? {}); } catch { parsed = {}; }
      return { evento_id: v.eventID ?? v.evento_id, mesa: { ...parsed, planSpaceID: v.planSpaceID, sectionID: v.sectionID } };
    },
    mapResponse: (p) => p,
  },
  // Front: editTable(eventID, planSpaceID, sectionID, tableID, variable, valor) → editTable(evento_id, mesa_id, datos:JSON!)
  editTable: {
    canonicalQuery: `mutation($evento_id:ID!,$mesa_id:ID!,$datos:JSON!){ editTable(evento_id:$evento_id, mesa_id:$mesa_id, datos:$datos){ success errors{ field message code } evento{ _id } } }`,
    mapVariables: (v) => {
      let parsedVal: any = v.valor;
      try { if (typeof v.valor === 'string') parsedVal = JSON.parse(v.valor); } catch { /* mantener string */ }
      return { evento_id: v.eventID ?? v.evento_id, mesa_id: v.tableID ?? v.mesa_id, datos: { [v.variable]: parsedVal } };
    },
    mapResponse: (p) => p,
  },
  deleteTable: {
    canonicalQuery: `mutation($evento_id:ID!,$mesa_id:ID!){ deleteTable(evento_id:$evento_id, mesa_id:$mesa_id){ success errors{ field message code } } }`,
    mapVariables: (v) => ({ evento_id: v.eventID ?? v.evento_id, mesa_id: v.tableID ?? v.mesa_id }),
    mapResponse: (p) => p,
  },

  // ═══════════════════════════════════════════════════════════
  // P4 editGasto — GastoPresupuestoUpdateInput desplegado (nombre opcional, sigue requiriendo categoria_id)
  // ═══════════════════════════════════════════════════════════
  // Front legacy: editGasto(evento_id, categoria_id, gasto_id, variable_reemplazar, valor_reemplazar:String)
  // → actualizarGastoPresupuesto(evento_id, categoria_id, gasto_id, updates: GastoPresupuestoUpdateInput!)
  editGasto: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria_id:ID!,$gasto_id:ID!,$updates:GastoPresupuestoUpdateInput!){
      actualizarGastoPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, updates:$updates){
        success errors{ field message code } evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      const FLOAT = new Set(['coste_proporcion','coste_estimado','coste_final','pagado']);
      const key = v.variable_reemplazar;
      let val: any = v.valor_reemplazar;
      if (FLOAT.has(key) && typeof val === 'string') { const n = Number(val); if (!isNaN(n)) val = n; }
      return { evento_id: v.evento_id, categoria_id: v.categoria_id, gasto_id: v.gasto_id, updates: { [key]: val } };
    },
    mapResponse: (p) => presupuestoSuperset(p),
  },

  // ═══════════════════════════════════════════════════════════
  // P1 ITINERARIO/TASKS — desplegado 2026-05-29
  // Front pasa itinerarioID (verificado). TareaInput: descripcion/fecha/responsable/duracion/tags/icon/completada.
  // ═══════════════════════════════════════════════════════════
  // Front editTask(evento_id, task_id, development, updates:TaskUpdateInput) → actualizarTarea
  editTask: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario_id:ID!,$tarea_id:ID!,$updates:TareaUpdateInput!){
      actualizarTarea(evento_id:$evento_id, itinerario_id:$itinerario_id, tarea_id:$tarea_id, updates:$updates){
        success errors{ field message code }
      }
    }`,
    mapVariables: (v) => {
      const it = v.itinerario_id ?? v.itinerarioID;
      const tk = v.tarea_id ?? v.task_id ?? v.taskID;
      if (!it || !tk) return null;
      return { evento_id: v.evento_id, itinerario_id: it, tarea_id: tk, updates: v.updates ?? {} };
    },
    mapResponse: (p) => ({ success: p?.success, errors: p?.errors, task: { _id: p?.itinerario?._id } }),
  },
  // Front createItinerario(evento_id, title, tipo) → crearItinerario(evento_id, itinerario:ItinerarioInput!)
  createItinerario: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario:ItinerarioInput!){
      crearItinerario(evento_id:$evento_id, itinerario:$itinerario){ success errors{ field message code } }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      itinerario: { title: v.title ?? v.nombre ?? '', tipo: v.tipo ?? 'itinerario', viewers: v.viewers, participantes: v.participantes },
    }),
    mapResponse: (p) => p,
  },
  // Front editItinerario(evento_id, itinerario_id, datos) → actualizarItinerario
  editItinerario: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario_id:ID!,$updates:ItinerarioUpdateInput!){
      actualizarItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id, updates:$updates){ success errors{ field message code } }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, itinerario_id: v.itinerario_id, updates: v.datos ?? v.updates ?? {} }),
    mapResponse: (p) => p,
  },
  // Front deleteItinerario(evento_id, itinerario_id) → eliminarItinerario
  deleteItinerario: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario_id:ID!){
      eliminarItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){ success errors{ field message code } }
    }`,
    mapVariables: (v) => ({ evento_id: v.evento_id, itinerario_id: v.itinerario_id }),
    mapResponse: (p) => p,
  },

  // sendComunications: SendComunicationsResponse{success,sent,failed,total,results,errors}. Front usa
  // queries.sendComunications con args legacy (dominio, lang, invitados_ids_array). Mapeo args.
  sendComunications: {
    canonicalQuery: `mutation($evento_id:ID!,$invitado_ids:[ID!]!,$template_id:ID,$tipo:String,$development:String!){
      sendComunications(evento_id:$evento_id, invitado_ids:$invitado_ids, template_id:$template_id, tipo:$tipo, development:$development){
        success sent failed total results errors{ field message code }
      }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      invitado_ids: v.invitado_ids ?? v.invitados_ids_array ?? [],
      template_id: v.template_id,
      tipo: v.tipo ?? v.transport,
      development: v.development ?? v.dominio ?? 'bodasdehoy',
    }),
    mapResponse: (p) => p,
  },

  // testInvitacion: acepta email/phoneNumber sin invitado_id (desplegado 30-may). EventoResponse.
  testInvitacion: {
    canonicalQuery: `mutation($evento_id:ID!,$invitado_id:ID,$email:String,$phoneNumber:String,$template_id:ID){
      testInvitacion(evento_id:$evento_id, invitado_id:$invitado_id, email:$email, phoneNumber:$phoneNumber, template_id:$template_id){
        success errors{ field message code }
      }
    }`,
    mapVariables: (v) => ({
      evento_id: v.evento_id,
      invitado_id: v.invitado_id,
      email: v.email,
      phoneNumber: v.phoneNumber,
      template_id: v.template_id,
    }),
    mapResponse: (p) => p,
  },

  // getEventsByID (queryenEvento legacy) → getEventoById(id) cuando variable="_id". Otros (usuario_id) caen a apiapp.
  // imgEvento/imgInvitacion en api-mcp son String (slug). Pedimos imgEventoSizes/imgInvitacionSizes (type ImageSizes con i1024/i800/i640/i320)
  // y los renombramos en mapResponse para mantener la forma { iXXX } esperada por los consumers existentes.
  getEventsByID: {
    canonicalQuery: `query($id:ID!){ getEventoById(id:$id){
      _id development estatus tipo color nombre fecha poblacion pais
      usuario_id usuario_nombre compartido_array detalles_compartidos_array
      grupos_array invitados_array menus_array mesas_array presupuesto_objeto
      itinerarios_array planSpace listIdentifiers templateEmailSelect templateWhatsappSelect
      estilo tematica showChildrenGuest timeZone listaRegalos
      imgEventoUrl imgEventoSizes{ i1024 i800 i640 i320 }
      imgInvitacionUrl imgInvitacionSizes{ i1024 i800 i640 i320 }
      fecha_creacion fecha_actualizacion
    } }`,
    mapVariables: (v) => {
      if (v.variable !== '_id' || !v.valor) return null;
      return { id: v.valor };
    },
    mapResponse: (p) => {
      if (!p) return p;
      const { imgEventoSizes, imgInvitacionSizes, ...rest } = p;
      return { ...rest, imgEvento: imgEventoSizes ?? null, imgInvitacion: imgInvitacionSizes ?? null };
    },
  },

  // updateActivity → updateActivityV2(args:inputActivity!) — args:{activityId,eventId,development,nombre,...}
  updateActivity: {
    canonicalQuery: `mutation($args:inputActivity!){ updateActivityV2(args:$args){ success errors{ field message code } } }`,
    mapVariables: (v) => ({ args: v.args ?? v }),
    mapResponse: (p) => p,
  },
  // updateActivityLink(args:inputActivityLink) — el nombre canónico es el mismo.
  updateActivityLink: {
    canonicalQuery: `mutation($args:inputActivityLink){ updateActivityLink(args:$args){ success errors{ field message code } evento{ _id } } }`,
    mapVariables: (v) => ({ args: v.args ?? v }),
    mapResponse: (p) => p,
  },

  // createComment(task_id, development, comment:TaskCommentInput!{mensaje}): TaskCommentResponse{success,comment:TaskComment}
  // Consumer legacy lee {_id, comment(mensaje), uid(autor), createdAt(fecha), attachments, nicknameUnregistered}.
  createComment: {
    canonicalQuery: `mutation($task_id:ID!,$development:String!,$comment:TaskCommentInput!){
      createComment(task_id:$task_id, development:$development, comment:$comment){
        success errors{ field message code }
        comment{ id task_id autor mensaje fecha }
      }
    }`,
    mapVariables: (v) => ({
      task_id: v.task_id ?? v.taskID,
      development: v.development ?? 'bodasdehoy',
      comment: { mensaje: v.comment?.mensaje ?? v.mensaje ?? '' },
    }),
    mapResponse: (p) => {
      const c = p?.comment ?? {};
      return { _id: c.id, comment: c.mensaje, uid: c.autor, createdAt: c.fecha, nicknameUnregistered: null, attachments: [], success: p?.success, errors: p?.errors };
    },
  },
  // deleteComment(task_id, comment_id, development): TaskResponse → front lee escalar/success.
  deleteComment: {
    canonicalQuery: `mutation($task_id:ID!,$comment_id:ID!,$development:String!){
      deleteComment(task_id:$task_id, comment_id:$comment_id, development:$development){ success errors{ field message code } }
    }`,
    mapVariables: (v) => ({
      task_id: v.task_id ?? v.taskID,
      comment_id: v.comment_id ?? v.commentID,
      development: v.development ?? 'bodasdehoy',
    }),
    mapResponse: (p) => p,
  },

  // deleteTask(task_id, development): clean — same args, return {success errors}.
  deleteTask: {
    canonicalQuery: `mutation($task_id:ID!,$development:String!){ deleteTask(task_id:$task_id, development:$development){ success errors{ field message code } } }`,
    mapVariables: (v) => ({ task_id: v.task_id ?? v.taskID, development: v.development ?? 'bodasdehoy' }),
    mapResponse: (p) => p,
  },
  // addTaskAttachments(task_id, development, adjuntos:[TaskAttachmentInput!]!): front pasa attachment (single) → array.
  addTaskAttachments: {
    canonicalQuery: `mutation($task_id:ID!,$development:String!,$adjuntos:[TaskAttachmentInput!]!){
      addTaskAttachments(task_id:$task_id, development:$development, adjuntos:$adjuntos){ success errors{ field message code } }
    }`,
    mapVariables: (v) => {
      const adj = v.adjuntos ?? (v.attachment ? [v.attachment] : (v.attachments ?? []));
      return { task_id: v.task_id ?? v.taskID, development: v.development ?? 'bodasdehoy', adjuntos: adj };
    },
    mapResponse: (p) => p,
  },
  // deleteTaskAttachment(task_id, attachment_id, development): clean.
  deleteTaskAttachment: {
    canonicalQuery: `mutation($task_id:ID!,$attachment_id:ID!,$development:String!){
      deleteTaskAttachment(task_id:$task_id, attachment_id:$attachment_id, development:$development){ success errors{ field message code } }
    }`,
    mapVariables: (v) => ({ task_id: v.task_id ?? v.taskID, attachment_id: v.attachment_id ?? v.attachmentID, development: v.development ?? 'bodasdehoy' }),
    mapResponse: (p) => p,
  },

  // Front createTask(evento_id, development, task:TaskInput) → crearTarea
  createTask: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario_id:ID!,$tarea:TareaInput!){
      crearTarea(evento_id:$evento_id, itinerario_id:$itinerario_id, tarea:$tarea){
        success errors{ field message code }
      }
    }`,
    mapVariables: (v) => {
      const it = v.itinerario_id ?? v.itinerarioID;
      if (!it) return null;
      return { evento_id: v.evento_id, itinerario_id: it, tarea: v.task ?? v.tarea ?? {} };
    },
    mapResponse: (p) => ({ success: p?.success, errors: p?.errors, task: { _id: p?.itinerario?._id } }),
  },
};

export const ADAPTER_ENABLED = (field: string | null): boolean =>
  !!field && field in MCP_ADAPTERS;
