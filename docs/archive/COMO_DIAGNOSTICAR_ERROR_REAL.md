# 🔍 Cómo Diagnosticar el Error Real

**Problema**: Se muestra ErrorCapture con `error.title` y `error.desc` sin resolver

---

## 🎯 Paso 1: Ver Error Real en DevTools

### Abrir DevTools

1. **Presionar F12** (o Cmd+Option+I en Mac)
2. **Ir a la pestaña "Console"**
3. **Buscar errores en rojo**

### Qué Buscar

**Errores comunes**:
- `Error: ...` (errores de JavaScript)
- `Failed to fetch` (errores de red)
- `Provider error` (errores de proveedor)
- `i18n error` (errores de traducción)

**Ejemplo**:
```
Error: Failed to fetch https://api-ia.bodasdehoy.com/chat
ProviderBizError: Request OpenAI service error
```

---

## 🎯 Paso 2: Verificar Network Tab

### Abrir Network Tab

1. **En DevTools, ir a "Network"**
2. **Recargar la página** (F5)
3. **Buscar requests fallidos** (en rojo)

### Qué Buscar

**Requests importantes**:
- `api-ia.bodasdehoy.com` (backend IA)
- `chat-test.bodasdehoy.com` (chat)
- Requests de i18n (traducciones)

**Verificar**:
- Status code (200, 502, 503, etc.)
- Response (qué devuelve el servidor)
- Headers (configuración)

---

## 🎯 Paso 3: Verificar Backend IA

### Desde Navegador

**Abrir en nueva pestaña**:
```
https://api-ia.bodasdehoy.com
```

**O hacer request manual**:
```javascript
// En Console de DevTools
fetch('https://api-ia.bodasdehoy.com')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e));
```

---

## 🎯 Paso 4: Verificar Configuración de Proveedores

### Si el Error es de Proveedor

**Verificar**:
1. ¿Hay API keys configuradas?
2. ¿Las API keys son válidas?
3. ¿El proveedor está disponible?

**Cómo verificar**:
- Settings → LLM → Verificar proveedores configurados
- Verificar logs del backend IA

---

## 🎯 Paso 5: Verificar i18n

### Si el Problema es Solo i18n

**Verificar en Console**:
```javascript
// En Console de DevTools
console.log(window.i18n);
// O
console.log(document.documentElement.lang);
```

**Verificar configuración**:
- Ver `apps/copilot/src/locales/resources.ts`
- Verificar que 'error' namespace esté cargado
- Verificar que idioma esté configurado

---

## 📋 Resumen de Verificaciones

### 1. DevTools Console
- [ ] Abrir Console
- [ ] Buscar errores en rojo
- [ ] Copiar mensaje de error completo

### 2. Network Tab
- [ ] Abrir Network
- [ ] Recargar página
- [ ] Verificar requests fallidos

### 3. Backend IA
- [ ] Probar `https://api-ia.bodasdehoy.com` desde navegador
- [ ] Verificar respuesta

### 4. Configuración
- [ ] Verificar API keys de proveedores
- [ ] Verificar configuración de i18n

---

**Siguiente paso**: Compartir el error real encontrado en DevTools para diagnóstico específico
