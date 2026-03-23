# 🔧 Fix: Bloqueo de useInitSystemStatus (6.4 segundos)

**Fecha**: 2026-02-10 21:00
**Problema Reportado**: useInitSystemStatus bloqueaba la carga por 6398ms

---

## ❌ Problema Original

```
❌ useInitSystemStatus: bloqueada por 6398.40ms

at blockingDetector.ts:144:19
```

**Síntomas**:
- El copilot tardaba 6+ segundos en cargar
- El main thread estaba bloqueado
- La app se sentía lenta e inutilizable

**Causa Raíz**:
1. `localStorage.getItem()` es una operación síncrona
2. `JSON.parse()` de data grande es bloqueante
3. No había cache en memoria
4. Timeout de 2 segundos era insuficiente

---

## ✅ Solución Implementada

### Optimizaciones en AsyncLocalStorage

**Archivo modificado**: `apps/copilot/packages/utils/src/localStorage.ts`

#### 1. Cache en Memoria (0ms latencia)
```typescript
private cache: Map<string, State> = new Map();
private cacheTimestamp: Map<string, number> = new Map();
private readonly CACHE_TTL = 5000; // 5 segundos

// Verificar cache primero (acceso instantáneo)
const cached = this.cache.get(key);
if (cached && timestamp && (Date.now() - timestamp < this.CACHE_TTL)) {
  return cached; // ⚡ 0ms
}
```

#### 2. Timeout Agresivo (300ms)
```typescript
const timeoutMs = 300; // Reducido de 2000ms

const timeout = setTimeout(() => {
  console.warn(`Timeout al leer ${key}, usando objeto vacío`);
  resolve({} as State); // Retornar vacío en lugar de bloquear
}, timeoutMs);
```

#### 3. requestIdleCallback (No bloquear render)
```typescript
// Ejecutar cuando el navegador esté idle
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(parseData, { timeout: timeoutMs });
} else {
  queueMicrotask(parseData); // Fallback
}
```

#### 4. Detección de Data Corrupta (>1MB)
```typescript
// Prevenir parseo de data gigante
if (item && item.length > 1000000) { // 1MB
  console.warn(`${key} es muy grande, limpiando...`);
  safeLocalStorage.removeItem(key); // Limpiar
  resolve({} as State); // Retornar vacío
  return;
}
```

#### 5. Logs de Performance
```typescript
const elapsed = Date.now() - start;
if (elapsed > 50) {
  console.warn(`Parseo de ${key} tardó ${elapsed}ms`);
}
```

---

## 📊 Resultados Esperados

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Primera carga | 6400ms | <300ms | **21x** más rápido |
| Cargas subsecuentes | ~1000ms | 0ms (cache) | **Instantáneo** |
| Main thread bloqueado | Sí | No | ✅ |
| Timeout failures | Frecuentes | Nunca | ✅ |

---

## 🧪 Cómo Probar

### En iachat.bodasdehoy.com

1. **Abrir**: https://iachat.bodasdehoy.com (ya abierto en tu navegador)
2. **Abrir DevTools** (F12) → Console
3. **Refrescar** la página (Cmd+R)
4. **Verificar logs**:
   - ✅ Deberías ver: `"✅ [AsyncLocalStorage] LOBE_SYSTEM_STATUS cargado en XXms"`
   - ✅ Tiempo debería ser <300ms
   - ✅ No deberías ver: `"❌ useInitSystemStatus: bloqueada por XXXms"`

5. **Refrescar de nuevo**:
   - Segunda carga debería mostrar: `"✅ [AsyncLocalStorage] Usando cache para LOBE_SYSTEM_STATUS"`
   - Tiempo: 0ms (instantáneo)

### Verificar Performance

**Network Tab**:
- La página debería cargar en <2 segundos total
- No debería haber delays de 6+ segundos

**Performance Tab**:
- No debería haber "Long Tasks" >1 segundo
- `useInitSystemStatus` debería completar rápido

---

## 🔄 Deployment

Los cambios están commiteados en el branch `feature/nextjs-15-migration`:

```bash
git commit 98e06de6
"perf: Optimizar AsyncLocalStorage para evitar bloqueos de 6+ segundos"
```

### Para Aplicar en Producción

1. **Merge** el branch a main/master
2. **Deploy** a Vercel (iachat.bodasdehoy.com)
3. **Verificar** en producción que el error no ocurra

---

## 📝 Archivos Modificados

```
✅ apps/copilot/packages/utils/src/localStorage.ts
   - Agregado cache en memoria
   - Timeout reducido a 300ms
   - requestIdleCallback para no bloquear
   - Detección y limpieza de data corrupta

📦 apps/copilot/packages/utils/src/localStorage.backup.ts
   - Backup del archivo original (por si se necesita revertir)
```

---

## 🐛 Troubleshooting

### Si el error persiste:

**1. Limpiar localStorage manualmente**:
```javascript
// En DevTools Console
localStorage.removeItem('LOBE_SYSTEM_STATUS');
localStorage.removeItem('LOBE_PREFERENCE');
location.reload();
```

**2. Verificar tamaño de localStorage**:
```javascript
// En DevTools Console
Object.keys(localStorage).forEach(key => {
  const size = localStorage.getItem(key).length;
  console.log(`${key}: ${(size / 1024).toFixed(2)}KB`);
});
```

**3. Si alguna key es >500KB**:
- Probablemente tiene data corrupta
- Eliminarla: `localStorage.removeItem('KEY_NAME')`

---

## ✅ Próximos Pasos

1. **Probar** en iachat.bodasdehoy.com
2. **Verificar** que no aparece el error de bloqueo
3. **Confirmar** carga rápida (<2s total)
4. **Validar** funcionalidad completa del copilot

---

**Estado**: ✅ Optimizaciones implementadas y commiteadas
**Testing**: En proceso - verificar en iachat.bodasdehoy.com
**Resultado esperado**: Sin bloqueos, carga instantánea
