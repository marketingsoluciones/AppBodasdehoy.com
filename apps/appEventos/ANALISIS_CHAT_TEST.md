# 🔍 Análisis Completo: chat-test.bodasdehoy.com

## 📋 Configuración Actual

### Variables de Entorno
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

### Ubicaciones en el Código

#### 1. `CopilotIframe.tsx` (Línea 69)
```typescript
const fallback = 'https://chat-test.bodasdehoy.com';
const base = (envUrl || fallback).replace(/\/$/, '');
```
**Función**: Fallback si `NEXT_PUBLIC_CHAT` no está definido

#### 2. `next.config.js` (Línea 70)
```javascript
const copilotProdBase = (process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com').replace(/\/$/, '');
```
**Función**: Base URL para rewrites/proxy del Copilot

#### 3. `verifyUrls.ts` (Línea 97)
```typescript
urlsToCheck.push('https://chat-test.bodasdehoy.com');
```
**Función**: Verificación automática de URLs

---

## 🔄 Flujo de Uso

### 1. Detección del Entorno
```typescript
// CopilotIframe.tsx
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

if (isLocal) return 'http://127.0.0.1:3210'; // Local
// Si no es local, usa NEXT_PUBLIC_CHAT o fallback a chat-test
```

### 2. Construcción de URL
```typescript
const envUrl = process.env.NEXT_PUBLIC_CHAT; // https://chat-test.bodasdehoy.com
const fallback = 'https://chat-test.bodasdehoy.com';
const base = (envUrl || fallback).replace(/\/$/, '');
```

### 3. Carga en Iframe
- Se carga como iframe embebido
- Parámetros: `?embed=1&userId=...&development=...`
- Timeout: 15 segundos

---

## ⚠️ Problemas Detectados

### 1. Error 502 Bad Gateway
**Síntoma**: El iframe no carga, muestra error 502

**Causas Posibles**:
- ❌ Cloudflare no puede conectar con servidor de origen
- ❌ Servidor de origen caído/no responde
- ❌ Configuración DNS incorrecta
- ❌ Firewall bloqueando conexiones
- ❌ VPN causando problemas de ruteo

**Manejo Actual**:
```typescript
setError(`No se pudo cargar: ${iframeSrc}. Error 502 - Verifica que el servidor este corriendo.`);
```

### 2. Error DNS (Could not resolve host)
**Síntoma**: No se puede resolver el dominio

**Causas**:
- ❌ Registro DNS no existe en Cloudflare
- ❌ DNS no propagado
- ❌ Problema de red/VPN

### 3. Timeout
**Síntoma**: El iframe tarda más de 15 segundos

**Manejo**:
```typescript
setTimeout(() => {
  setError('El Copilot está tardando demasiado en cargar. Verifica que el servicio del chat esté levantado (local: http://127.0.0.1:3210) y recarga.');
}, 15000);
```

---

## 🔍 Verificación del Estado

### Desde el Código
El código verifica automáticamente en `verifyUrls.ts`:
```typescript
if (hostname.includes('bodasdehoy.com')) {
  urlsToCheck.push('https://chat-test.bodasdehoy.com');
}
```

### Desde Terminal
```bash
# Verificar DNS
dig chat-test.bodasdehoy.com +short

# Verificar HTTP
curl -I https://chat-test.bodasdehoy.com

# Verificar con timeout
curl --max-time 5 https://chat-test.bodasdehoy.com
```

---

## 🛠️ Configuración en Cloudflare

### Requisitos
1. **Registro DNS**:
   - Tipo: CNAME o A
   - Nombre: `chat-test`
   - Target: IP del servidor o CNAME
   - Proxy: ✅ Proxied (nube naranja)

2. **SSL/TLS**:
   - Modo: Full o Full (strict)
   - Certificado válido

3. **WAF**:
   - Sin reglas que bloqueen el subdominio
   - Verificar logs de WAF

4. **Origin Rules**:
   - Timeout configurado (default: 100s)
   - Headers correctos

---

## 🔄 Flujo de Fallback

### Orden de Prioridad
1. **Local**: `http://127.0.0.1:3210` (si hostname es localhost/127.0.0.1)
2. **Variable de entorno**: `process.env.NEXT_PUBLIC_CHAT`
3. **Fallback hardcoded**: `https://chat-test.bodasdehoy.com`

### Si chat-test Falla
- El iframe muestra error
- Usuario ve mensaje: "Error 502 - Verifica que el servidor este corriendo"
- No hay fallback automático a otro dominio

---

## 📊 Análisis de Problemas

### Problema 1: 502 Bad Gateway
**Frecuencia**: Constante cuando se accede
**Impacto**: Chat no funciona
**Causa Principal**: Servidor de origen no responde

**Solución**:
1. Verificar que el servidor de origen esté corriendo
2. Verificar configuración en Cloudflare
3. Revisar firewall del servidor
4. Verificar logs del servidor

### Problema 2: DNS No Resuelve
**Frecuencia**: Desde algunos entornos
**Impacto**: No se puede acceder
**Causa Principal**: Registro DNS no existe o no propagado

**Solución**:
1. Crear registro en Cloudflare
2. Esperar propagación DNS (5 minutos)
3. Verificar desde diferentes DNS (8.8.8.8, 1.1.1.1)

### Problema 3: VPN Interfiere
**Frecuencia**: Cuando VPN está activa
**Impacto**: 502 o timeout
**Causa Principal**: Ruteo diferente en Cloudflare

**Solución**:
1. Desactivar VPN temporalmente
2. Verificar reglas WAF en Cloudflare
3. Revisar Rate Limiting

---

## ✅ Recomendaciones

### 1. Mejorar Manejo de Errores
```typescript
// Agregar más información en el error
if (error.status === 502) {
  setError(`Error 502: Cloudflare no puede conectar con el servidor. Verifica:
    - Que el servidor de origen esté corriendo
    - Configuración en Cloudflare
    - Si usas VPN, prueba desactivarla`);
}
```

### 2. Agregar Fallback a Producción
```typescript
// Si chat-test falla, intentar chat producción
const fallbackUrls = [
  'https://chat-test.bodasdehoy.com',
  'https://chat.bodasdehoy.com' // Fallback
];
```

### 3. Mejorar Verificación
```typescript
// Verificar antes de cargar el iframe
const checkChatAvailability = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
```

### 4. Logging Mejorado
```typescript
console.log('[CopilotIframe] Intentando cargar:', iframeSrc);
console.log('[CopilotIframe] Entorno:', {
  isLocal,
  envUrl: process.env.NEXT_PUBLIC_CHAT,
  fallback: 'https://chat-test.bodasdehoy.com'
});
```

---

## 🔗 Archivos Relacionados

- `components/Copilot/CopilotIframe.tsx` - Componente principal
- `next.config.js` - Configuración de rewrites
- `.env.production` - Variable de entorno
- `utils/verifyUrls.ts` - Verificación automática

---

## 📝 Checklist de Verificación

- [ ] Registro DNS existe en Cloudflare
- [ ] Proxy activado (nube naranja)
- [ ] SSL/TLS configurado
- [ ] Servidor de origen corriendo
- [ ] Firewall permite conexiones de Cloudflare
- [ ] WAF no bloquea el subdominio
- [ ] Variable `NEXT_PUBLIC_CHAT` configurada
- [ ] Fallback hardcoded correcto

---

## 🚀 Próximos Pasos

1. **Verificar en Cloudflare Dashboard**:
   - Confirmar que existe registro DNS
   - Verificar proxy activado
   - Revisar logs de errores

2. **Verificar Servidor de Origen**:
   - Proceso corriendo
   - Puerto escuchando
   - Logs sin errores

3. **Probar desde Navegador**:
   - Abrir `https://chat-test.bodasdehoy.com` directamente
   - Verificar si carga o da 502
   - Revisar consola del navegador (F12)

4. **Si Persiste el 502**:
   - Revisar configuración en Cloudflare
   - Verificar servidor de origen
   - Contactar soporte de infraestructura
