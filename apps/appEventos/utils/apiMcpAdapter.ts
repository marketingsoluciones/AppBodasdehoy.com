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

type Vars = Record<string, any>;

export interface McpAdapterEntry {
  // Query/mutation canónica de api-mcp a ejecutar (vía fetchApiBodas).
  canonicalQuery: string;
  // Traduce las variables legacy → variables canónicas de api-mcp.
  mapVariables: (v: Vars) => Vars;
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
};

export const ADAPTER_ENABLED = (field: string | null): boolean =>
  !!field && field in MCP_ADAPTERS;
