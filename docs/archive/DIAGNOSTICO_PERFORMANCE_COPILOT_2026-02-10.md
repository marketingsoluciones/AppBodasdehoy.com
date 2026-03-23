# 🐛 Diagnóstico: Copilot Tarda Demasiado en Cargar

**Fecha**: 2026-02-10
**Problema**: "El Copilot tarda demasiado en cargar"
**Impacto**: Usuario no puede usar la aplicación (timeout de 2+ minutos)

---

## 📊 Síntomas Observados

### Logs del Servidor
```
GET / 200 in 122298ms  (122 segundos = 2 minutos)
GET / 200 in 157343ms  (157 segundos = 2.6 minutos)
⚠️ Timeout (1s) al obtener branding, usando fallback
```

### Mensaje de Error al Usuario
```
El Copilot tarda demasiado en cargar.
Verifica que chat-test.bodasdehoy.com responda.
Si usas VPN, prueba desactivarla y pulsa Reintentar.
```

---

## 🔍 Causas Identificadas

### 1. Timeout de Branding (Crítico)
**Archivo**: `apps/copilot/src/server/branding.ts:203`

```typescript
// ❌ PROBLEMA: Intenta obtener branding del backend
const url = `${BACKEND_URL}/api/config/${dev}`;
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 segundo

// Si falla, usa fallback pero ya perdió 1 segundo
```

**Endpoint que falla**:
```
https://api-ia.bodasdehoy.com/api/config/bodasdehoy
```

**Impacto**:
- Cada página que carga metadata llama a `getDeveloperBranding()`
- Si el backend no responde en 1s, timeout
- Se repite múltiples veces durante SSR

### 2. Metadata Bloqueante
**Archivo**: `apps/copilot/src/app/[variants]/metadata.ts:15`

```typescript
// ❌ PROBLEMA: generateMetadata bloquea el render inicial
export const generateMetadata = async (props: DynamicLayoutProps) => {
  const branding = await getDeveloperBranding(); // BLOQUEA AQUÍ
  // ...
}
```

**Impacto**: Next.js espera que metadata se resuelva antes de renderizar

### 3. Inicialización Pesada de Stores
**Archivo**: `apps/copilot/src/layout/GlobalProvider/StoreInitialization.tsx`

**Operaciones que tardan**:
- useInitSystemStatus
- getGlobalConfig (con timeout de 2s)
- Múltiples stores inicializándose en paralelo

---

## 🎯 Soluciones Propuestas

### Solución 1: Cache Estático de Branding (INMEDIATO)

**Impacto**: Elimina 100% de los timeouts de branding

```typescript
// Crear archivo: apps/copilot/public/branding.json
{
  "bodasdehoy": {
    "color_primary": "#FF69B4",
    "color_secondary": "#764ba2",
    "name": "Bodas de Hoy",
    "developer": "bodasdehoy",
    "description": "Planificador de bodas"
  }
}

// Modificar: apps/copilot/src/server/branding.ts
// Cargar desde archivo local en lugar de backend
```

**Ventajas**:
- 0ms de latencia (archivo local)
- Sin dependencia del backend
- Sin timeouts

**Desventajas**:
- Requiere rebuild para cambiar branding
- No dinámico

### Solución 2: Skip Metadata para Desarrollo (RÁPIDO)

```typescript
// apps/copilot/src/app/[variants]/metadata.ts
export const generateMetadata = async (props: DynamicLayoutProps) => {
  // ✅ SKIP en desarrollo
  if (process.env.NODE_ENV === 'development') {
    return {
      title: 'Copilot Dev',
      description: 'Development mode'
    };
  }

  // Solo en producción hacer fetch de branding
  // ...
}
```

### Solución 3: Branding Opcional y Asíncrono (MEJOR PRÁCTICA)

```typescript
// No bloquear render esperando branding
// Cargar branding después del render inicial

// 1. Metadata usa valores por defecto inmediatamente
export const generateMetadata = async () => {
  return getDefaultMetadata(); // Sin fetch, instantáneo
};

// 2. Cliente carga branding después
useEffect(() => {
  fetch('/api/branding').then(setBranding);
}, []);
```

### Solución 4: Endpoint de Branding Local (RECOMENDADO)

**Crear**: `apps/copilot/src/app/api/branding/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // Cache en memoria por 1 hora
  const cached = brandingCache.get(dev);
  if (cached) return NextResponse.json(cached);

  try {
    // Intentar backend con timeout muy corto
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 300); // 300ms

    const response = await fetch(backendUrl, { signal: controller.signal });
    const data = await response.json();

    brandingCache.set(dev, data);
    return NextResponse.json(data);
  } catch {
    // Fallback inmediato
    return NextResponse.json(DEFAULT_BRANDING);
  }
}
```

**Ventajas**:
- Cache en memoria del servidor Next.js
- Timeout más agresivo (300ms)
- Fallback inmediato
- No bloquea SSR

---

## 🚀 Plan de Acción Inmediato

### Paso 1: Cache Estático (5 minutos)
1. Crear `apps/copilot/public/branding-cache.json`
2. Modificar `getDeveloperBranding()` para leer de archivo primero
3. Solo hacer fetch si archivo no existe

### Paso 2: Skip Metadata en Dev (2 minutos)
1. Agregar check de `NODE_ENV === 'development'`
2. Retornar metadata simple sin fetch

### Paso 3: Verificar Backend (INMEDIATO)
1. Probar endpoint manualmente:
   ```bash
   curl -w "\nTime: %{time_total}s\n" https://api-ia.bodasdehoy.com/api/config/bodasdehoy
   ```
2. Ver si responde y en cuánto tiempo

### Paso 4: Logs de Performance
1. Agregar timing logs en metadata
2. Identificar qué más está bloqueando

---

## 📈 Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Primera carga | 120-157s | <3s |
| Branding fetch | timeout (1s) | <300ms o skip |
| Metadata generation | ? | <500ms |
| Time to Interactive | 120s+ | <2s |

---

## 🔧 Debugging Adicional

### Verificar Backend Memories API
```bash
# Ver si el backend está respondiendo lento en general
curl -w "\nTime: %{time_total}s\n" https://api-ia.bodasdehoy.com/api/config/bodasdehoy

# Ver si Memories API responde bien
curl -w "\nTime: %{time_total}s\n" https://api-ia.bodasdehoy.com/api/memories/albums?user_id=test@bodasdehoy.com&development=bodasdehoy
```

### Revisar Network Tab
1. Abrir DevTools → Network
2. Recargar página
3. Ver qué request tarda más
4. Identificar bloqueadores

---

## 💡 Conclusión

**Problema principal**: `getDeveloperBranding()` está bloqueando el SSR de Next.js esperando respuesta del backend que tarda o da timeout.

**Solución más rápida**: Skip metadata fetch en desarrollo + cache estático

**Solución ideal**: Endpoint local de branding con cache agresivo + fallback inmediato

---

**Próximo paso**: Implementar Solución 1 (cache estático) y Solución 2 (skip en dev)
