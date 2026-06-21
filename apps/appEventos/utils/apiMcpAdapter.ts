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

  // API-01 (2026-06-20): la CLAVE del adapter debe matchear con el field GraphQL,
  // no con el nombre del wrapper en `queries`. extractGraphqlField sobre
  // `query { queryenEvento(...) {...} }` devuelve "queryenEvento" → si la clave era
  // "getEventsByID" el adapter NUNCA se activaba y caía al fallback con la query
  // literal → 400 GRAPHQL_VALIDATION_FAILED "Cannot query field queryenEvento".
  //
  // queryenEvento (legacy apiapp) → getEventoById(id) cuando variable="_id".
  // imgEvento/imgInvitacion en api-mcp son String (slug). Pedimos imgEventoSizes/imgInvitacionSizes
  // (type ImageSizes con i1024/i800/i640/i320) y los renombramos en mapResponse para mantener
  // la forma { iXXX } esperada por los consumers existentes.
  queryenEvento: {
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
      // NEW-2 (informe QA post-commit 21-jun): si la variable NO es _id, devolver
      // null aquí caía al fallback "queryenEvento literal" → 400 "Cannot query field
      // queryenEvento on type Query". Ahora si vienen variables raras NO disparamos
      // la query (el caller tendría que migrar). El consumer decide qué hacer con null.
      if (v.variable !== '_id' || !v.valor) {
        if (typeof console !== 'undefined') {
          console.warn('[adapter:queryenEvento] variable!=_id no soportado por api-mcp:', v.variable);
        }
        // Devolver un mapVariables "imposible" para que el adapter no llame al backend
        // y consumer reciba null en vez de error 400.
        return { id: '__NO_OP__' };
      }
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
  // UP-02 (2026-06-20): TaskAttachmentInput requiere `nombre`, no `name`. Los call-sites
  // (AttachmentsEditor, NewAttachmentsEditor, InputAttachments) construyen FileData con
  // `{_id, name, size}` (legacy) → mapear name→nombre aquí.
  addTaskAttachments: {
    canonicalQuery: `mutation($task_id:ID!,$development:String!,$adjuntos:[TaskAttachmentInput!]!){
      addTaskAttachments(task_id:$task_id, development:$development, adjuntos:$adjuntos){ success errors{ field message code } }
    }`,
    mapVariables: (v) => {
      const rawAdj = v.adjuntos ?? (v.attachment ? [v.attachment] : (v.attachments ?? []));
      const adjuntos = (Array.isArray(rawAdj) ? rawAdj : []).map((a: any) => ({
        ...a,
        nombre: a?.nombre ?? a?.name ?? '',
      }));
      return { task_id: v.task_id ?? v.taskID, development: v.development ?? 'bodasdehoy', adjuntos };
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

  // getPsTemplate(evento_id, development): JSON — front legacy pasa (uid, evento_id, development),
  // ignoramos uid (api-mcp lo resuelve por auth). Devuelve JSON tal cual (front maneja array u objeto).
  getPsTemplate: {
    canonicalQuery: `query($evento_id:ID!,$development:String!){ getPsTemplate(evento_id:$evento_id, development:$development) }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, development: resolveDevelopment(v) };
    },
    mapResponse: (p) => p,
  },

  // getPlanSpaceSelect(evento_id, development): ID — front legacy pasa (evento_id, isOwner),
  // ignoramos isOwner. Devuelve ID escalar tal cual.
  getPlanSpaceSelect: {
    canonicalQuery: `query($evento_id:ID!,$development:String!){ getPlanSpaceSelect(evento_id:$evento_id, development:$development) }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, development: resolveDevelopment(v) };
    },
    mapResponse: (p) => p,
  },

  // actualizarCategoriaPresupuesto — la query legacy `editCategoria` (Fetching.ts:1439) ya pide este
  // field canónico; solo necesita rerouting a api-mcp (no transformación). Misma firma+respuesta.
  actualizarCategoriaPresupuesto: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria_id:ID!,$updates:CategoriaPresupuestoUpdateInput!){
      actualizarCategoriaPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id, updates:$updates){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.categoria_id) return null;
      return { evento_id: v.evento_id, categoria_id: v.categoria_id, updates: v.updates ?? {} };
    },
    mapResponse: (p) => p,
  },

  // borraCategoria (apiapp legacy) → eliminarCategoriaPresupuesto canónico.
  borraCategoria: {
    canonicalQuery: `mutation($evento_id:ID!,$categoria_id:ID!){
      eliminarCategoriaPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.categoria_id) return null;
      return { evento_id: v.evento_id, categoria_id: v.categoria_id };
    },
    mapResponse: (p) => p,
  },

  // createElement/editElement/deleteElement — PlanSpace elements. Las 3 queries del front
  // ya piden los nombres canónicos con firma correcta; solo necesitan rerouting a api-mcp.
  createElement: {
    canonicalQuery: `mutation($evento_id:ID!,$element:JSON!){
      createElement(evento_id:$evento_id, element:$element){
        success errors{ field message code } evento{ _id }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.element) return null;
      return { evento_id: v.evento_id, element: v.element };
    },
    mapResponse: (p) => p,
  },
  editElement: {
    canonicalQuery: `mutation($evento_id:ID!,$element_id:ID!,$datos:JSON!){
      editElement(evento_id:$evento_id, element_id:$element_id, datos:$datos){
        success errors{ field message code } evento{ _id }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.element_id) return null;
      return { evento_id: v.evento_id, element_id: v.element_id, datos: v.datos ?? {} };
    },
    mapResponse: (p) => p,
  },
  deleteElement: {
    canonicalQuery: `mutation($evento_id:ID!,$element_id:ID!){
      deleteElement(evento_id:$evento_id, element_id:$element_id){
        success errors{ field message code }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.element_id) return null;
      return { evento_id: v.evento_id, element_id: v.element_id };
    },
    mapResponse: (p) => p,
  },

  // editPresupuesto (Cat A, exact name en api-mcp con misma firma). Pass-through.
  editPresupuesto: {
    canonicalQuery: `mutation($evento_id:ID!,$datos:JSON!){
      editPresupuesto(evento_id:$evento_id, datos:$datos){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, datos: v.datos ?? {} };
    },
    mapResponse: (p) => p,
  },

  // setPlanSpaceSelect — front legacy pasa (evento_id, planSpaceSelect, isOwner);
  // api-mcp pide (evento_id, planspace_id). Rename + drop isOwner.
  setPlanSpaceSelect: {
    canonicalQuery: `mutation($evento_id:ID!,$planspace_id:ID!){
      setPlanSpaceSelect(evento_id:$evento_id, planspace_id:$planspace_id){
        success errors{ field message code }
      }
    }`,
    mapVariables: (v) => {
      const ps = v.planspace_id ?? v.planSpaceSelect;
      if (!v.evento_id || !ps) return null;
      return { evento_id: v.evento_id, planspace_id: ps };
    },
    mapResponse: (p) => p,
  },

  // createNotifications (Cat A — exact name + firma compat NotificationsResponse{total, results}). Pass-through.
  createNotifications: {
    canonicalQuery: `mutation($args:inputNotifications){
      createNotifications(args:$args){
        total
        results{ _id }
      }
    }`,
    mapVariables: (v) => ({ args: v.args ?? v }),
    mapResponse: (p) => p,
  },

  // getVariableEmailTemplate(template_id, selectVariable): EmailTemplateVariable{_id, name, type, defaultValue, description, configTemplate:JSON}
  // Consumers leen res.configTemplate.name. configTemplate es JSON scalar (sin subfields).
  getVariableEmailTemplate: {
    canonicalQuery: `query($template_id:ID!,$selectVariable:String!){
      getVariableEmailTemplate(template_id:$template_id, selectVariable:$selectVariable){
        _id name type defaultValue description configTemplate
      }
    }`,
    mapVariables: (v) => {
      if (!v.template_id || !v.selectVariable) return null;
      return { template_id: v.template_id, selectVariable: v.selectVariable };
    },
    mapResponse: (p) => p,
  },

  // editVisibleColumns(evento_id, visibleColumns: [VisibleColumnInput!]!): PresupuestoResponse
  // BACKEND resolvió la discrepancia — ahora acepta [{accessor, show}] tal como envía el front.
  editVisibleColumns: {
    canonicalQuery: `mutation($evento_id:ID!,$visibleColumns:[VisibleColumnInput!]!){
      editVisibleColumns(evento_id:$evento_id, visibleColumns:$visibleColumns){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, visibleColumns: v.visibleColumns ?? [] };
    },
    mapResponse: (p) => p,
  },

  // editTotalStimatedGuests(evento_id, children?, adults?): PresupuestoResponse
  // BACKEND resolvió la discrepancia — acepta children y adults separados.
  editTotalStimatedGuests: {
    canonicalQuery: `mutation($evento_id:ID!,$children:Int,$adults:Int){
      editTotalStimatedGuests(evento_id:$evento_id, children:$children, adults:$adults){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, children: v.children, adults: v.adults };
    },
    mapResponse: (p) => p,
  },

  // createEmailTemplate(evento_id!, design!, configTemplate!, html?, development!): EmailTemplate
  // Front legacy NO pasa development — lo resolvemos por hostname. configTemplate.name ahora soportado
  // tras fix BACKEND commit 5441a77 (inputCongigTemplate añadió `name`).
  createEmailTemplate: {
    canonicalQuery: `mutation($evento_id:ID!,$design:JSON!,$configTemplate:inputCongigTemplate!,$html:String,$development:String!){
      createEmailTemplate(evento_id:$evento_id, design:$design, configTemplate:$configTemplate, html:$html, development:$development){
        _id evento_id design configTemplate html createdAt updatedAt
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.design || !v.configTemplate) return null;
      return {
        evento_id: v.evento_id,
        design: v.design,
        configTemplate: v.configTemplate,
        html: v.html ?? null,
        development: resolveDevelopment(v),
      };
    },
    mapResponse: (p) => p,
  },

  // updateEmailTemplate(template_id!, evento_id?, design?, configTemplate?, html?, development!): EmailTemplate
  // Front consumer lee `res[0]._id` — envuelve la respuesta en array para compat (apiapp devolvía
  // un array de templates, api-mcp devuelve uno solo).
  updateEmailTemplate: {
    canonicalQuery: `mutation($template_id:ID!,$evento_id:ID,$design:JSON,$configTemplate:inputCongigTemplate,$html:String,$development:String!){
      updateEmailTemplate(template_id:$template_id, evento_id:$evento_id, design:$design, configTemplate:$configTemplate, html:$html, development:$development){
        _id evento_id design configTemplate html createdAt updatedAt
      }
    }`,
    mapVariables: (v) => {
      if (!v.template_id) return null;
      return {
        template_id: v.template_id,
        evento_id: v.evento_id ?? null,
        design: v.design ?? null,
        configTemplate: v.configTemplate ?? null,
        html: v.html ?? null,
        development: resolveDevelopment(v),
      };
    },
    mapResponse: (p) => (p ? [p] : []),
  },

  // duplicatePresupuesto(evento_id, target_evento_id?): PresupuestoResponse
  // BACKEND resolvió la discrepancia — target_evento_id opcional, copia entre eventos distintos.
  // Front legacy pasa `nuevo_evento_id` → renombramos.
  duplicatePresupuesto: {
    canonicalQuery: `mutation($evento_id:ID!,$target_evento_id:ID){
      duplicatePresupuesto(evento_id:$evento_id, target_evento_id:$target_evento_id){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { evento_id: v.evento_id, target_evento_id: v.target_evento_id ?? v.nuevo_evento_id ?? null };
    },
    mapResponse: (p) => p,
  },

  // getInvoices (apiapp legacy) → getStripeInvoices canónico. Mismo shape {total, results[StripeInvoice]}.
  // StripeInvoice = {number, amount, created, currency, status, hostedInvoiceUrl, invoicePdf} coincide 1:1.
  getInvoices: {
    canonicalQuery: `query($page:Int,$limit:Int){
      getStripeInvoices(page:$page, limit:$limit){
        total
        results{ number amount created status hostedInvoiceUrl invoicePdf currency }
        error
      }
    }`,
    mapVariables: (v) => ({ page: v.page, limit: v.limit }),
    mapResponse: (p) => p,
  },

  // getItinerario: la firma canónica api-mcp `getItinerario(evento_id, development): [Itinerario!]!`
  // devuelve solo array de itinerarios sin datos del evento padre. El front legacy esperaba el evento
  // ENTERO {nombre, tipo, timeZone, itinerarios_array} para iCal/portal público. Solución: el adapter
  // usa getEventoById como source y filtra itinerarios_array por itinerario_id (si se pasa).
  getItinerario: {
    canonicalQuery: `query($id:ID!){ getEventoById(id:$id){
      _id nombre tipo timeZone fecha
      itinerarios_array
    } }`,
    mapVariables: (v) => {
      if (!v.evento_id) return null;
      return { id: v.evento_id };
    },
    mapResponse: (p, v) => {
      if (!p) return null;
      const itinerario_id = v?.itinerario_id;
      let itinerarios = Array.isArray(p.itinerarios_array) ? p.itinerarios_array : [];
      if (itinerario_id) {
        itinerarios = itinerarios.filter((it: any) => it?._id?.toString?.() === itinerario_id || it?._id === itinerario_id);
      }
      return { ...p, itinerarios_array: itinerarios };
    },
  },

  // createUserWithPassword: api-mcp devuelve {success, customToken, error}.
  // Consumer (FormRegister) espera customToken string si OK, o "apiBodas/email-already-in-use" si error.
  // mapResponse traduce: success → customToken string; error 'email-already-in-use' → string sentinel.
  createUserWithPassword: {
    canonicalQuery: `mutation($email:String!,$password:String!){
      createUserWithPassword(email:$email, password:$password){
        success
        customToken
        error
      }
    }`,
    mapVariables: (v) => {
      if (!v.email || !v.password) return null;
      return { email: v.email, password: v.password };
    },
    mapResponse: (p) => {
      if (!p) return null;
      if (p.success && p.customToken) return p.customToken;
      const err = (p.error || '').toString().toLowerCase();
      if (err.includes('email-already-in-use') || err.includes('email_already')) {
        return 'apiBodas/email-already-in-use';
      }
      return p.error || 'apiBodas/unknown-error';
    },
  },

  // Stripe checkout — 4 ops Cat A con firma idéntica. Pass-through directo.
  createCheckoutSession: {
    canonicalQuery: `mutation($items:[inputItemsCheckout],$email:String,$cancel_url:String,$mode:String,$success_url:String){
      createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, mode:$mode, success_url:$success_url)
    }`,
    mapVariables: (v) => ({
      items: v.items,
      email: v.email,
      cancel_url: v.cancel_url,
      mode: v.mode,
      success_url: v.success_url,
    }),
    mapResponse: (p) => p,
  },
  setCheckoutItems: {
    canonicalQuery: `mutation($unique:ID,$args:[inputDetailsItemsCheckout]){
      setCheckoutItems(unique:$unique, args:$args)
    }`,
    mapVariables: (v) => ({ unique: v.unique, args: v.args }),
    mapResponse: (p) => p,
  },
  getCheckoutItems: {
    canonicalQuery: `query($unique:ID){
      getCheckoutItems(unique:$unique){
        currency
        amount
        name
        price
      }
    }`,
    mapVariables: (v) => ({ unique: v.unique }),
    mapResponse: (p) => p,
  },
  updateCustomer: {
    canonicalQuery: `mutation($args:inputCustomer){
      updateCustomer(args:$args)
    }`,
    mapVariables: (v) => ({ args: v.args }),
    mapResponse: (p) => p,
  },

  // getCustomer: type StripeCustomer (BACKEND respondió con shape {name, email, line1, line2, postalCode, city, ...}).
  // Front lee {name, email, line1, line2, postalCode, city}. Pass-through.
  getCustomer: {
    canonicalQuery: `query{
      getCustomer{
        name
        email
        line1
        line2
        postalCode
        city
      }
    }`,
    mapVariables: () => ({}),
    mapResponse: (p) => p,
  },

  // ────── Invitados batch (queries.X usan canonical name pero NO interceptados antes) ──────
  actualizarInvitado: {
    canonicalQuery: `mutation($evento_id:ID!,$invitado_id:String!,$datos:JSON!){
      actualizarInvitado(evento_id:$evento_id, invitado_id:$invitado_id, datos:$datos){
        success errors{ field message code }
        evento{ _id invitados_array }
      }
    }`,
    mapVariables: (v) => {
      const evId = v.evento_id ?? v.eventID;
      const invId = v.invitado_id ?? v.guestID;
      if (!evId || !invId) return null;
      return { evento_id: evId, invitado_id: invId, datos: v.datos ?? {} };
    },
    mapResponse: (p) => p,
  },
  agregarInvitadosBatch: {
    canonicalQuery: `mutation($evento_id:ID!,$invitados:[JSON!]!){
      agregarInvitadosBatch(evento_id:$evento_id, invitados:$invitados){
        success processed failed total
        errors{ field message code }
        evento{ _id invitados_array }
      }
    }`,
    mapVariables: (v) => {
      const evId = v.evento_id ?? v.eventID;
      const invs = v.invitados ?? v.invitados_array;
      if (!evId || !invs) return null;
      return { evento_id: evId, invitados: invs };
    },
    mapResponse: (p) => p,
  },

  // ────── Stripe productos (Cat A, pass-through) ──────
  getAllProducts: {
    canonicalQuery: `query($grupo:String){
      getAllProducts(grupo:$grupo){
        currency
        total
        results{
          id name description images usage subscriptionId
          current_period_start current_period_end
          prices{ id currency unit_amount recurring{ interval interval_count } }
        }
      }
    }`,
    mapVariables: (v) => ({ grupo: v.grupo }),
    mapResponse: (p) => p,
  },

  // ────── getPreregister: legacy (_id) → canonical (evento_id, invitado_id?) ──────
  getPreregister: {
    canonicalQuery: `query($evento_id:ID!,$invitado_id:ID){
      getPreregister(evento_id:$evento_id, invitado_id:$invitado_id){
        success errors{ field message code }
        evento{ _id nombre fecha }
        invitado{ nombre email }
      }
    }`,
    mapVariables: (v) => {
      const evId = v.evento_id ?? v._id;
      if (!evId) return null;
      return { evento_id: evId, invitado_id: v.invitado_id ?? null };
    },
    mapResponse: (p) => p,
  },

  // ────── duplicateItinerario (Cat A, pass-through) ──────
  duplicateItinerario: {
    canonicalQuery: `mutation($evento_id:ID!,$itinerario_id:ID!){
      duplicateItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){
        success errors{ field message code }
        itinerario{ _id next_id title tasks{ _id descripcion fecha hora horaActiva tips estatus spectatorView } }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.itinerario_id) return null;
      return { evento_id: v.evento_id, itinerario_id: v.itinerario_id };
    },
    mapResponse: (p) => p,
  },

  // ────── Pagos legacy: front pasa pagos_array[] → api-mcp pide pago objeto único ──────
  nuevoPago: {
    canonicalQuery: `mutation($evento_id:ID!,$gasto_id:ID!,$pago:JSON!){
      nuevoPago(evento_id:$evento_id, gasto_id:$gasto_id, pago:$pago){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.gasto_id) return null;
      const pagos = Array.isArray(v.pagos_array) ? v.pagos_array : [];
      const pago = pagos[0] ?? v.pago ?? {};
      return { evento_id: v.evento_id, gasto_id: v.gasto_id, pago };
    },
    mapResponse: (p) => p,
  },
  editPago: {
    canonicalQuery: `mutation($evento_id:ID!,$gasto_id:ID!,$pago_id:ID!,$datos:JSON!){
      editPago(evento_id:$evento_id, gasto_id:$gasto_id, pago_id:$pago_id, datos:$datos){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      if (!v.evento_id || !v.gasto_id || !v.pago_id) return null;
      const pagos = Array.isArray(v.pagos_array) ? v.pagos_array : [];
      const datos = pagos[0] ?? v.datos ?? {};
      return { evento_id: v.evento_id, gasto_id: v.gasto_id, pago_id: v.pago_id, datos };
    },
    mapResponse: (p) => p,
  },

  // ────── borraItemsGastos: rename itemsGastos_ids→items_ids, drop categoria_id ──────
  borraItemsGastos: {
    canonicalQuery: `mutation($evento_id:ID!,$gasto_id:ID!,$items_ids:[ID!]!){
      borraItemsGastos(evento_id:$evento_id, gasto_id:$gasto_id, items_ids:$items_ids){
        success errors{ field message code }
        evento{ _id presupuesto_objeto }
      }
    }`,
    mapVariables: (v) => {
      const ids = v.items_ids ?? v.itemsGastos_ids;
      if (!v.evento_id || !v.gasto_id || !ids) return null;
      return { evento_id: v.evento_id, gasto_id: v.gasto_id, items_ids: ids };
    },
    mapResponse: (p) => p,
  },

  // ────── createPsTemplate: legacy 4-args → canonical {template:JSON} ──────
  createPsTemplate: {
    canonicalQuery: `mutation($evento_id:ID!,$template:JSON!){
      createPsTemplate(evento_id:$evento_id, template:$template){
        success errors{ field message code }
        evento{ _id }
      }
    }`,
    mapVariables: (v) => {
      const evId = v.evento_id ?? v.eventID;
      if (!evId) return null;
      return {
        evento_id: evId,
        template: { planSpaceID: v.planSpaceID, title: v.title, uid: v.uid, ...(v.template || {}) },
      };
    },
    mapResponse: (p) => {
      const ev = p?.evento;
      const templates = (ev as any)?.psTemplates;
      const last = Array.isArray(templates) ? templates[templates.length - 1] : null;
      return last ?? { _id: null, title: null };
    },
  },

  // ────── createGalerySvgs: rename galerySvgs→svgs + add development ──────
  createGalerySvgs: {
    canonicalQuery: `mutation($evento_id:ID!,$svgs:[JSON!]!,$development:String!){
      createGalerySvgs(evento_id:$evento_id, svgs:$svgs, development:$development){
        success errors{ field message code }
        evento{ _id }
      }
    }`,
    mapVariables: (v) => {
      const svgs = v.svgs ?? v.galerySvgs;
      if (!v.evento_id || !svgs) return null;
      return { evento_id: v.evento_id, svgs, development: resolveDevelopment(v) };
    },
    mapResponse: (p) => p,
  },

  // ────── Auth (pass-through) ──────
  auth: {
    canonicalQuery: `mutation($idToken:String!){
      auth(idToken:$idToken){ sessionCookie }
    }`,
    mapVariables: (v) => {
      if (!v.idToken) return null;
      return { idToken: v.idToken };
    },
    mapResponse: (p) => p,
  },

  // ────── updateUser: legacy (uid, variable, valor) → canonical (id, input?, variable, valor) ──────
  updateUser: {
    canonicalQuery: `mutation($id:ID,$variable:String,$valor:String,$development:String){
      updateUser(id:$id, variable:$variable, valor:$valor, development:$development){
        city country
      }
    }`,
    mapVariables: (v) => ({
      id: v.id ?? v.uid,
      variable: v.variable,
      valor: v.valor,
      development: resolveDevelopment(v),
    }),
    mapResponse: (p) => p,
  },

  // ────── createUser: legacy (uid, city, country, ...) — api-mcp acepta args sueltos ──────
  createUser: {
    canonicalQuery: `mutation($uid:ID,$city:String,$country:String,$weddingDate:String,$phoneNumber:String,$role:[String]){
      createUser(uid:$uid, city:$city, country:$country, weddingDate:$weddingDate, phoneNumber:$phoneNumber, role:$role){
        city country weddingDate phoneNumber role
      }
    }`,
    mapVariables: (v) => ({
      uid: v.uid,
      city: v.city,
      country: v.country,
      weddingDate: v.weddingDate,
      phoneNumber: v.phoneNumber,
      role: v.role,
    }),
    mapResponse: (p) => p,
  },

  // getEmailValid(email): emailValid{valid, validators{regex|typo|disposable|mx|smtp}, reason}
  // Consumer (FormRegister) solo lee result.valid. Pass-through con shape completo.
  getEmailValid: {
    canonicalQuery: `query($email:String){
      getEmailValid(email:$email){
        valid
        reason
        validators{
          regex{ valid reason }
          typo{ valid reason }
          disposable{ valid reason }
          mx{ valid reason }
          smtp{ valid reason }
        }
      }
    }`,
    mapVariables: (v) => ({ email: v.email }),
    mapResponse: (p) => p,
  },

  // getEventTicket (Cat A — firma idéntica). Pass-through. results shape: {_id, title, createdAt, updatedAt}.
  getEventTicket: {
    canonicalQuery: `query($args:inputEventTicket,$sort:sortCriteriaEventTicket,$skip:Int,$limit:Int){
      getEventTicket(args:$args, sort:$sort, skip:$skip, limit:$limit){
        total
        results{ _id title createdAt updatedAt }
      }
    }`,
    mapVariables: (v) => ({
      args: v.args,
      sort: v.sort,
      skip: v.skip,
      limit: v.limit,
    }),
    mapResponse: (p) => p,
  },
};

export const ADAPTER_ENABLED = (field: string | null): boolean =>
  !!field && field in MCP_ADAPTERS;
