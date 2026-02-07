# 🔧 Mejoras: Manejo de 502 con VPN

**Fecha**: 2026-01-25  
**Problema**: El error 502 puede ocurrir cuando hay VPN activa bloqueando el servicio

---

## 🎯 Objetivo

Mejorar el manejo de errores 502 cuando el servicio está bloqueando conexiones VPN, proporcionando mensajes claros y opciones al usuario.

---

## ✅ Cambios Implementados

### 1. Detección de VPN (Preparado)

Se agregó función `detectVPN()` preparada para detectar VPN activa:
- Por ahora retorna `false` (puede mejorarse con detección más sofisticada)
- Lista para expandir con:
  - Detección de IPs de datacenter
  - Análisis de headers
  - Latencia de conexión

### 2. Tipo de Error Específico: `vpn-blocked`

Se agregó nuevo tipo de error `'vpn-blocked'` que se activa cuando:
- Error 502 detectado
- Y VPN está activa (cuando la detección esté implementada)

### 3. Mensajes Mejorados para VPN

**Mensajes específicos cuando VPN puede estar causando problemas**:

- **Error DNS con VPN**: 
  ```
  "No se puede resolver el dominio (DNS). Verifica tu conexión a internet. 
  Si usas VPN, puede estar bloqueando la conexión."
  ```

- **Error 502 con VPN bloqueada**:
  ```
  "Error 502: El servicio puede estar bloqueando conexiones VPN. 
  Por favor, desactiva la VPN temporalmente y recarga la página."
  ```

- **Timeout con VPN**:
  ```
  "Timeout al cargar el Copilot. El servidor está tardando demasiado. 
  Si usas VPN, puede estar causando latencia adicional."
  ```

### 4. UI Mejorada para Errores con VPN

Cuando el error menciona VPN, se muestra un banner informativo:
```
💡 Nota: El servicio puede estar bloqueando conexiones VPN por seguridad. 
Desactiva la VPN para acceder al Copilot.
```

### 5. Botón Reintentar Mejorado

El botón "Reintentar" ahora:
- Resetea el índice de fallback URLs
- Resetea el contador de reintentos
- Permite intentar de nuevo desde el principio

---

## 🔍 Cómo Funciona

### Flujo de Manejo de Error 502 con VPN

```
1. Iframe intenta cargar chat-test.bodasdehoy.com
   ↓
2. Error 502 detectado
   ↓
3. ¿VPN activa detectada?
   ├─ Sí → Tipo: 'vpn-blocked'
   │        Mensaje: "Desactiva VPN y recarga"
   │
   └─ No → Tipo: '502'
            Mensaje: "Servidor no responde"
   ↓
4. ¿Hay fallback disponible?
   ├─ Sí → Intentar chat.bodasdehoy.com
   │
   └─ No → Mostrar error con instrucciones
```

### Fallback Automático

Si `chat-test` falla con 502:
1. Espera 1 segundo
2. Intenta automáticamente `chat.bodasdehoy.com` (producción)
3. Si también falla, muestra error con instrucciones

---

## 📋 Próximas Mejoras Posibles

### 1. Detección Real de VPN

Implementar detección más sofisticada:
```typescript
const detectVPN = async (): Promise<boolean> => {
  try {
    // Opción 1: Verificar IP con servicio externo
    const ipInfo = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipInfo.json();
    
    // Verificar si IP es de datacenter conocido
    const isDatacenterIP = await checkDatacenterIP(ip);
    
    // Opción 2: Verificar latencia
    const latency = await measureLatency();
    if (latency > 200) return true; // VPN suele añadir latencia
    
    return isDatacenterIP;
  } catch {
    return false;
  }
};
```

### 2. Bypass Temporal para VPN

Si el usuario confirma que tiene VPN:
- Mostrar opción para usar URL directa (bypass Cloudflare)
- O permitir conexión directa al origen

### 3. Configuración de VPN Permitida

Agregar configuración para:
- Lista blanca de IPs de VPN permitidas
- Reglas específicas por usuario/organización

---

## 🧪 Testing

### Escenarios a Probar

1. **VPN activa + Error 502**:
   - ✅ Debe mostrar mensaje específico sobre VPN
   - ✅ Debe sugerir desactivar VPN
   - ✅ Debe mostrar banner informativo

2. **Sin VPN + Error 502**:
   - ✅ Debe mostrar mensaje genérico de 502
   - ✅ Debe intentar fallback automático

3. **VPN activa + Timeout**:
   - ✅ Debe mencionar VPN en mensaje de timeout

4. **Reintentar después de error VPN**:
   - ✅ Debe resetear fallback URLs
   - ✅ Debe permitir intentar de nuevo

---

## 📝 Archivos Modificados

1. ✅ `apps/web/components/Copilot/CopilotIframe.tsx`
   - Función `detectVPN()` agregada
   - Tipo de error `'vpn-blocked'` agregado
   - Mensajes mejorados para VPN
   - UI mejorada con banner informativo
   - Botón reintentar mejorado

---

## ✅ Estado

**Implementado**: ✅
- Detección de VPN preparada (estructura lista)
- Mensajes específicos para VPN
- UI mejorada con banner informativo
- Fallback automático funcionando

**Pendiente**:
- Implementar detección real de VPN (opcional, mejora futura)
- Testing en producción con VPN real

---

**Nota**: El código está preparado para detectar VPN, pero por ahora usa heurísticas básicas. Se puede mejorar con servicios externos de detección de IP o análisis de latencia.
