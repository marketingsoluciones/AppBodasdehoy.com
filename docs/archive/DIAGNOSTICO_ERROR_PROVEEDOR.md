# 🔍 Diagnóstico: Error de Proveedor y chat-test/app-test

**Fecha**: 2026-01-25  
**Problema**: Error genérico mostrando `error.title` y `error.desc` (i18n no resuelto)

---

## 📊 Análisis del Error

### Error Visualizado

**Componente**: `apps/copilot/src/components/Error/index.tsx`

**Mensajes mostrados**:
- `error.title` (marcador de i18n no resuelto)
- `error.desc` (marcador de i18n no resuelto)
- `error.retry` (botón)
- `error.backHome` (botón)

**Notificación**: "8 Issues" (8 problemas detectados)

---

## 🔍 Causas Posibles

### 1. Problema de i18n (Traducciones)

**Síntoma**: Los marcadores `error.title` y `error.desc` no se resuelven

**Causas**:
- ❌ Archivo de traducciones no cargado
- ❌ Namespace 'error' no disponible
- ❌ Idioma no configurado correctamente
- ❌ Error en la carga de recursos i18n

**Archivos relevantes**:
- `apps/copilot/src/locales/default/error.ts` (fuente)
- `apps/copilot/locales/es-ES/error.json` (traducción ES)
- `apps/copilot/locales/en-US/error.json` (traducción EN)

---

### 2. Error de Proveedor (Backend IA)

**Síntoma**: Error genérico cuando debería mostrar error específico de proveedor

**Causas**:
- ❌ Backend IA (`api-ia.bodasdehoy.com`) no responde
- ❌ Error en la comunicación con proveedores (OpenAI, Anthropic, etc.)
- ❌ Timeout o error de red
- ❌ Credenciales de proveedor inválidas

**Verificación**:
```bash
curl -I https://api-ia.bodasdehoy.com
```

---

### 3. Problema con chat-test/app-test

**Usuario menciona**: "chat-test app-test esta funcionando y arriba"

**Verificación necesaria**:
- ✅ chat-test: `https://chat-test.bodasdehoy.com`
- ✅ app-test: `https://app-test.bodasdehoy.com`
- ✅ Backend IA: `https://api-ia.bodasdehoy.com`

**Nota**: Desde terminal con VPN puede mostrar DNS no resuelto, pero el navegador puede resolverlo.

---

## 🔧 Soluciones

### Solución 1: Verificar Traducciones i18n

**Archivo**: `apps/copilot/src/locales/default/error.ts`

**Verificar que contiene**:
```typescript
export default {
  error: {
    title: '...',
    desc: '...',
    retry: '...',
    backHome: '...',
  },
};
```

**Si falta**: Agregar las traducciones necesarias

---

### Solución 2: Verificar Backend IA

**Problema**: Si el backend IA no responde, puede causar errores genéricos

**Verificar**:
```bash
# Desde navegador (no terminal con VPN)
curl -I https://api-ia.bodasdehoy.com

# Verificar logs del backend
# Verificar configuración de proveedores
```

**Si el backend falla**:
- Verificar que el servidor esté corriendo
- Verificar logs de errores
- Verificar configuración de proveedores (API keys)

---

### Solución 3: Verificar Configuración de URLs

**Archivo**: `apps/web/.env.production`

**Verificar**:
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com
```

**Si chat-test/app-test están funcionando**:
- ✅ El problema puede ser específico del backend IA
- ✅ O problema de traducciones i18n

---

## 📋 Checklist de Diagnóstico

### 1. Verificar Traducciones

- [ ] Archivo `error.ts` existe y tiene contenido
- [ ] Archivo `error.json` (ES) existe y tiene contenido
- [ ] i18n está configurado correctamente
- [ ] Idioma está seleccionado correctamente

### 2. Verificar Backend IA

- [ ] Backend IA responde (`https://api-ia.bodasdehoy.com`)
- [ ] Logs del backend no muestran errores
- [ ] Proveedores configurados correctamente
- [ ] API keys válidas

### 3. Verificar URLs

- [ ] chat-test funciona (desde navegador)
- [ ] app-test funciona (desde navegador)
- [ ] Backend IA funciona (desde navegador)

---

## 🚀 Próximos Pasos

1. **Verificar traducciones i18n**
   - Leer `apps/copilot/src/locales/default/error.ts`
   - Verificar que las traducciones estén cargadas

2. **Verificar backend IA**
   - Probar `https://api-ia.bodasdehoy.com` desde navegador
   - Revisar logs del backend
   - Verificar configuración de proveedores

3. **Verificar configuración**
   - Revisar `.env.production`
   - Verificar URLs configuradas
   - Verificar que chat-test/app-test estén funcionando

---

**Estado**: ⏳ Diagnóstico en progreso - Verificando traducciones y backend IA
