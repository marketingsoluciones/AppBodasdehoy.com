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
};

export const ADAPTER_ENABLED = (field: string | null): boolean =>
  !!field && field in MCP_ADAPTERS;
