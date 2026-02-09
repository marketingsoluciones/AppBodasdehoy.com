# Diagnóstico: Arquitectura del Copilot y Problema Actual

**Fecha**: 2026-02-08
**Contexto**: Página /copilot en blanco + Clarificación sobre uso de monorepo

---

## 🚨 Problema Inmediato

La página `/copilot` carga pero muestra **pantalla completamente en blanco**:

```
✅ URL cargada: http://localhost:8080/copilot
❌ Header: NO encontrado
❌ Main content: NO encontrado
❌ Iframes: 0 encontrados
```

### Causa Raíz

Mirando el código de [apps/web/pages/copilot.tsx:98-128](apps/web/pages/copilot.tsx#L98-L128):

```tsx
// Redirigir si no esta autenticado
useEffect(() => {
  if (authContext && !user && authContext.verificationDone) {
    router.push('/login?redirect=/copilot');
  }
}, [user, authContext, router]);

// Loading state
if (!authContext || !authContext.verificationDone) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="text-sm text-gray-600">Verificando sesión...</p>
    </div>
  );
}
```

**El problema**:
- La página está **esperando verificación de sesión** (`authContext.verificationDone`)
- Los tests NO tienen sesión autenticada
- Se queda en el loading state (spinner blanco sobre fondo blanco)
- O redirige inmediatamente a `/login`

---

## 🏗️ Arquitectura Actual vs. Arquitectura Deseada

### Arquitectura ACTUAL (con iframes)

```
apps/web (puerto 8080)
    ↓
    router.push('/copilot')
    ↓
    /copilot page → CopilotSplitLayout
    ↓
    CopilotIframe (carga http://localhost:3210)
    ↓
    apps/copilot (puerto 3210) ← SERVIDOR SEPARADO
```

**Problemas**:
- ❌ Requiere dos servidores corriendo (8080 y 3210)
- ❌ Usa iframe para comunicación entre apps
- ❌ Infraestructura adicional innecesaria
- ❌ NO aprovecha el monorepo para compartir componentes

### Arquitectura DESEADA (según mensaje del usuario)

> "Se supone que ya no hay infraestructura, hicimos el monorepo para compartir componentes y cargar más rápido sin infraestructura y sin ventanas modales"

```
apps/web (puerto 8080)
    ↓
    router.push('/copilot')
    ↓
    /copilot page → IMPORTA DIRECTAMENTE componentes de LobeChat
    ↓
    import { ChatInput, ChatUI } from 'apps/copilot/src/...'
    ↓
    UN SOLO SERVIDOR - SIN IFRAMES
```

**Ventajas**:
- ✅ Un solo servidor (puerto 8080)
- ✅ Componentes compartidos directamente
- ✅ Carga más rápida
- ✅ Sin infraestructura adicional
- ✅ Sin iframes ni popups

---

## 🤔 Desafío Técnico

**apps/copilot** es una aplicación Next.js App Router **COMPLETA**:

```
apps/copilot/
├── src/
│   ├── app/              ← Next.js App Router
│   ├── components/       ← 94 componentes
│   ├── features/         ← ChatInput, Plugins, etc.
│   ├── store/            ← Zustand stores
│   ├── database/         ← IndexedDB
│   └── providers/        ← Context providers
```

**Problema**: No podemos simplemente "importar" componentes de una app Next.js en otra porque:
1. Tienen su propia configuración de routing
2. Tienen providers específicos
3. Usan stores globales (zustand)
4. Configuración de build diferente

---

## 💡 Opciones de Solución

### Opción A: Crear paquete compartido `@bodasdehoy/chat` ⭐ RECOMENDADA

**Estrategia**: Extraer componentes core del chat a un paquete compartido

```
packages/chat/
├── src/
│   ├── components/
│   │   ├── ChatInput/
│   │   ├── ChatUI/
│   │   ├── MessageList/
│   │   └── Editor/
│   ├── hooks/
│   ├── store/
│   └── index.ts
```

**Uso en apps/web**:
```tsx
import { ChatInput, ChatUI } from '@bodasdehoy/chat';

// En /copilot page
<ChatUI userId={userId} eventId={eventId} />
```

**Ventajas**:
- ✅ Componentes compartidos entre apps
- ✅ Un solo servidor
- ✅ Sin iframes
- ✅ Mantenimiento centralizado

**Desventajas**:
- ❌ Requiere refactorización significativa
- ❌ Tiempo de implementación: ~2-4 días

---

### Opción B: Mantener arquitectura actual (iframes) pero mejorar

**Estrategia**: Mantener apps/copilot separado pero optimizar

**Cambios**:
1. Fix el problema de autenticación en /copilot
2. Optimizar comunicación entre iframes
3. Mejorar UX del loading

**Ventajas**:
- ✅ Funciona ahora (una vez arreglado auth)
- ✅ No requiere refactorización
- ✅ apps/copilot mantiene todas sus funcionalidades

**Desventajas**:
- ❌ Sigue requiriendo dos servidores
- ❌ Sigue usando iframes
- ❌ NO cumple el objetivo del monorepo

---

### Opción C: Híbrida - Sidebar usa componentes, /copilot usa iframe

**Estrategia**:
- Sidebar embebido: Usa componentes compartidos ligeros
- Página /copilot completa: Usa iframe a apps/copilot con todas las features

**Ventajas**:
- ✅ Experiencia rápida en sidebar
- ✅ Funcionalidades completas en /copilot
- ✅ Balance entre complejidad y funcionalidad

**Desventajas**:
- ❌ Código duplicado parcialmente
- ❌ Dos implementaciones del chat

---

## 🎯 Recomendación

### Corto Plazo (AHORA)
1. **Fix inmediato**: Arreglar problema de autenticación en /copilot
2. **Verificar**: Que la navegación interna funcione sin popups

### Largo Plazo (Arquitectura)
1. **Clarificar con equipo**: ¿Realmente necesitamos abandonar iframes?
2. **Si SÍ**: Implementar Opción A (paquete @bodasdehoy/chat compartido)
3. **Si NO**: Optimizar Opción B (mantener iframes pero mejorar)

---

## 🔧 Fix Inmediato - Problema de Autenticación

### Cambio en copilot.tsx

**Antes**:
```tsx
// Espera verificación infinita
if (!authContext || !authContext.verificationDone) {
  return <LoadingSpinner />; // Spinner blanco sobre fondo blanco
}
```

**Después**:
```tsx
// Timeout de seguridad + mejor UI
const [authTimeout, setAuthTimeout] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setAuthTimeout(true), 5000);
  return () => clearTimeout(timer);
}, []);

if ((!authContext || !authContext.verificationDone) && !authTimeout) {
  return <LoadingSpinner />; // Con mejor contraste
}

// Si timeout, continuar sin autenticación
```

---

## 📊 Impacto de Cada Opción

| Opción | Tiempo Impl. | Complejidad | Cumple Objetivo Monorepo | Funcionalidad Completa |
|--------|--------------|-------------|--------------------------|------------------------|
| A: Paquete compartido | 2-4 días | Alta | ✅ Sí | ⚠️ Parcial inicialmente |
| B: Optimizar iframes | 1-2 horas | Baja | ❌ No | ✅ Sí |
| C: Híbrida | 1-2 días | Media | ⚠️ Parcial | ✅ Sí |

---

## ❓ Preguntas para el Usuario

1. ¿Es crítico eliminar completamente los iframes y tener un solo servidor?
2. ¿Podemos aceptar infraestructura mínima (2 servidores en localhost) a cambio de funcionalidad completa?
3. ¿Cuánto tiempo tenemos para implementar la solución ideal (Opción A)?
4. ¿La prioridad es "funcione ya" o "arquitectura perfecta"?

---

**Próximo paso**:
- [ ] Arreglar auth timeout en /copilot (15 min)
- [ ] Decidir arquitectura definitiva
- [ ] Implementar solución elegida
