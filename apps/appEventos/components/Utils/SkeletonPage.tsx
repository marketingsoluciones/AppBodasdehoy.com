// ─── Skeleton genérico ───────────────────────────────────────────────────────
export function SkeletonPage({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse w-full p-6 space-y-4">
      <div className="h-8 w-48 rounded-md bg-gray-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl bg-gray-100 p-4 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonTable — /invitados ───────────────────────────────────────────────
// Imita tabla con avatar + 4 columnas de texto
export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse w-full p-4 md:p-6 space-y-3">
      {/* barra de título + botón */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-40 rounded-md bg-gray-200" />
        <div className="h-8 w-28 rounded-lg bg-gray-200" />
      </div>
      {/* cabecera */}
      <div className="grid grid-cols-5 gap-3 px-3 py-2 bg-gray-100 rounded-lg">
        {[40, 80, 60, 60, 50].map((w, i) => (
          <div key={i} className={`h-3 w-${w === 40 ? '10' : w === 80 ? '20' : w === 60 ? '16' : '12'} rounded bg-gray-300`} />
        ))}
      </div>
      {/* filas */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-3 items-center px-3 py-3 bg-white border border-gray-100 rounded-lg">
          {/* avatar */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
            <div className="h-3 flex-1 rounded bg-gray-200" />
          </div>
          <div className="h-3 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-3 w-8 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonTimeline — /itinerario ──────────────────────────────────────────
// Imita línea temporal con fecha + tarjetas por hora
export function SkeletonTimeline({ groups = 3, tasksPerGroup = 3 }: { groups?: number; tasksPerGroup?: number }) {
  return (
    <div className="animate-pulse w-full px-4 md:px-6 py-4 space-y-6">
      {/* título + botones de vista */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 rounded-md bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-gray-200" />
          <div className="h-8 w-20 rounded-lg bg-gray-200" />
        </div>
      </div>
      {Array.from({ length: groups }).map((_, g) => (
        <div key={g} className="space-y-3">
          {/* separador de fecha */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="h-5 w-32 rounded-full bg-gray-200" />
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {/* tarjetas de tarea */}
          {Array.from({ length: tasksPerGroup }).map((_, t) => (
            <div key={t} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-5 w-14 rounded-full bg-gray-200 shrink-0" />
              </div>
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="flex gap-2 mt-1">
                <div className="h-6 w-6 rounded-full bg-gray-200" />
                <div className="h-6 w-6 rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonBudget — /presupuesto ───────────────────────────────────────────
// Imita categorías colapsables con totales
export function SkeletonBudget({ categories = 5 }: { categories?: number }) {
  return (
    <div className="animate-pulse w-full p-4 md:p-6 space-y-4">
      {/* título + resumen de totales */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-36 rounded-md bg-gray-200" />
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
      {/* tarjeta de totales */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
        {['Presupuestado', 'Pagado', 'Pendiente'].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-6 w-24 rounded bg-gray-300" />
          </div>
        ))}
      </div>
      {/* lista de categorías */}
      {Array.from({ length: categories }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-300" />
              <div className="h-4 w-28 rounded bg-gray-200" />
            </div>
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
          {i < 2 && (
            <div className="px-3 py-2 space-y-2 bg-white">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-3 w-40 rounded bg-gray-100" />
                  <div className="h-3 w-20 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonCards — /servicios (grid de tarjetas de proveedor) ───────────────
export function SkeletonCards({ cards = 6 }: { cards?: number }) {
  return (
    <div className="animate-pulse w-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-40 rounded-md bg-gray-200" />
        <div className="h-8 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
            {/* imagen placeholder */}
            <div className="h-32 w-full rounded-lg bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-200" />
            <div className="flex items-center justify-between mt-2">
              <div className="h-5 w-20 rounded-full bg-gray-200" />
              <div className="h-5 w-16 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SkeletonMesas — /mesas ───────────────────────────────────────────────────
// Imita grid de mesas circulares/rectangulares
export function SkeletonMesas({ tables = 6 }: { tables?: number }) {
  return (
    <div className="animate-pulse w-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-28 rounded-md bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-gray-200" />
          <div className="h-8 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: tables }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`${i % 3 === 0 ? 'rounded-full h-24 w-24' : 'rounded-xl h-20 w-32'} bg-gray-200`} />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
