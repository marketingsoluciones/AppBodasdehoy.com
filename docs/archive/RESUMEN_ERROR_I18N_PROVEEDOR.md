# 🔍 Resumen: Error i18n y Proveedor

**Fecha**: 2026-01-25  
**Problema**: Marcadores `error.title` y `error.desc` no se resuelven (i18n)

---

## ✅ Diagnóstico Completo

### 1. Traducciones Existen ✅

**Archivo fuente**: `apps/copilot/src/locales/default/error.ts`
```typescript
error: {
  backHome: '返回首页',
  desc: '待会来试试，或者回到已知的世界',
  retry: '重新加载',
  title: '页面遇到一点问题..',
}
```

**Traducción ES**: `apps/copilot/locales/es-ES/error.json`
```json
"error": {
  "backHome": "Volver a la página de inicio",
  "desc": "Inténtalo de nuevo más tarde, o regresa al mundo conocido",
  "retry": "Reintentar",
  "title": "Se ha producido un problema en la página.."
}
```

**Estado**: ✅ Las traducciones existen y están correctas

---

### 2. Problema: i18n No Resuelve Marcadores ❌

**Síntoma**: Se muestran `error.title` y `error.desc` literalmente en lugar de los textos traducidos

**Causas Posibles**:
1. ❌ Namespace 'error' no está cargado
2. ❌ Idioma no está configurado correctamente
3. ❌ Error en la inicialización de i18n
4. ❌ Error en el componente antes de que i18n se inicialice

---

### 3. Estado de Servicios

**Usuario confirma**: 
- ✅ chat-test funcionando y arriba
- ✅ app-test funcionando y arriba

**Verificación necesaria**:
- ⏳ Backend IA (`api-ia.bodasdehoy.com`)
- ⏳ Configuración de proveedores

---

## 🔧 Soluciones

### Solución 1: Verificar Configuración de i18n

**Archivo**: `apps/copilot/src/locales/resources.ts` o similar

**Verificar**:
- ✅ Namespace 'error' está exportado
- ✅ Idioma 'es-ES' está configurado
- ✅ i18n se inicializa correctamente

**Acción**: Revisar configuración de i18n en el proyecto

---

### Solución 2: Verificar Error Real (No Solo i18n)

**El componente ErrorCapture se muestra cuando hay un error real**

**Verificar**:
1. ¿Qué error está causando que se muestre ErrorCapture?
2. ¿Es un error de proveedor?
3. ¿Es un error de red?
4. ¿Es un error de inicialización?

**Cómo verificar**:
- Abrir DevTools → Console
- Buscar errores antes de que se muestre ErrorCapture
- Verificar logs del servidor

---

### Solución 3: Verificar Backend IA y Proveedores

**Si el error es de proveedor**:

**Verificar**:
```bash
# Desde navegador (no terminal con VPN)
curl -I https://api-ia.bodasdehoy.com
```

**Si el backend falla**:
- Verificar que el servidor esté corriendo
- Verificar logs del backend
- Verificar configuración de proveedores (API keys)

---

## 📋 Checklist de Acción

### Inmediato

- [ ] Abrir DevTools → Console y ver qué error real está ocurriendo
- [ ] Verificar logs del servidor (si hay acceso)
- [ ] Verificar que i18n esté configurado correctamente
- [ ] Verificar backend IA desde navegador

### Corto Plazo

- [ ] Si es error de proveedor: Verificar API keys y configuración
- [ ] Si es error de i18n: Verificar configuración de idioma
- [ ] Si es error de red: Verificar conectividad

---

## 🎯 Próximos Pasos Recomendados

1. **Abrir DevTools y ver el error real**
   - F12 → Console
   - Buscar errores en rojo
   - Ver qué está causando el ErrorCapture

2. **Verificar backend IA**
   - Probar `https://api-ia.bodasdehoy.com` desde navegador
   - Verificar logs del backend

3. **Verificar configuración de i18n**
   - Revisar `apps/copilot/src/locales/resources.ts`
   - Verificar que 'error' namespace esté cargado
   - Verificar que idioma 'es-ES' esté configurado

---

## 📊 Estado Actual

| Aspecto | Estado | Nota |
|---------|--------|------|
| Traducciones | ✅ Existen | error.ts y error.json correctos |
| i18n resolución | ❌ No funciona | Marcadores no se resuelven |
| chat-test | ✅ Funcionando | Usuario confirma |
| app-test | ✅ Funcionando | Usuario confirma |
| Backend IA | ⏳ Verificar | Necesita verificación |
| Error real | ⏳ Desconocido | Verificar en DevTools |

---

**Estado**: ⏳ Diagnóstico completo - Necesita verificar error real en DevTools y backend IA
