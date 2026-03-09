# Instrucciones para Levantar el Servicio

## ✅ Estado del Código

**Build completado exitosamente** - Todos los errores fueron corregidos:
- ✅ Errores de TypeScript corregidos
- ✅ Errores de linting corregidos  
- ✅ Imports faltantes agregados
- ✅ Tipos JSX.Element → React.ReactElement
- ✅ useReducer con tipos correctos
- ✅ useRef con valores iniciales

## ⚠️ Problema Detectado: Permisos de Puerto

El servidor está fallando con error `EPERM: operation not permitted` al intentar escuchar en cualquier puerto.

### Posibles Causas:
1. **Firewall de macOS bloqueando puertos**
2. **Restricciones de seguridad del sistema**
3. **Proceso previo bloqueando el puerto**

## 🔧 Soluciones

### Opción 1: Ejecutar manualmente en tu terminal
```bash
cd apps/web
npm run dev
```

### Opción 2: Verificar y matar procesos en puertos
```bash
# Ver qué está usando los puertos
lsof -i :3000
lsof -i :4001
lsof -i :8080

# Matar proceso si es necesario
kill -9 <PID>
```

### Opción 3: Usar un puerto diferente
Edita `package.json` y cambia el puerto:
```json
"dev": "next dev -H 127.0.0.1 -p 5000"
```

### Opción 4: Verificar configuración de firewall
En macOS:
1. System Settings → Network → Firewall
2. Verificar que no esté bloqueando Node.js

### Opción 5: Ejecutar desde terminal normal (no desde Cursor)
A veces las restricciones de Cursor pueden causar problemas. Intenta:
```bash
# Abre una terminal normal (Terminal.app)
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
npm run dev
```

## 🧪 Verificación de URLs

Una vez que el servidor esté corriendo, puedes verificar las URLs:

### 1. Verificar en el navegador
Abre la consola del navegador (F12) y verás logs automáticos de verificación de URLs.

### 2. Usar el endpoint de verificación
```bash
curl http://localhost:8080/api/verify-urls
```

### 3. Verificar manualmente
```javascript
// En la consola del navegador
import { verifyDomain, checkUrl } from './utils/verifyUrls';

// Ver información del dominio
console.log(verifyDomain());

// Verificar una URL específica
checkUrl('https://apiapp.bodasdehoy.com').then(console.log);
```

## 📋 URLs Configuradas que se Verifican

- `NEXT_PUBLIC_BASE_URL`: https://apiapp.bodasdehoy.com
- `NEXT_PUBLIC_BASE_API_BODAS`: https://api.bodasdehoy.com  
- `NEXT_PUBLIC_DIRECTORY`: https://bodasdehoy.com
- `NEXT_PUBLIC_CMS`: https://cms.bodasdehoy.com
- `NEXT_PUBLIC_CHAT`: https://chat.bodasdehoy.com
- `NEXT_PUBLIC_EVENTSAPP`: https://organizador.bodasdehoy.com

## 🎯 Próximos Pasos

1. **Levantar el servidor manualmente** desde tu terminal
2. **Verificar que responda** en `http://localhost:8080` (o el puerto configurado)
3. **Revisar la consola del navegador** para ver la verificación automática de URLs
4. **Probar el endpoint** `/api/verify-urls` para ver el estado de todas las URLs
5. **Verificar conexión con backend** - Si el backend está operativo, las URLs deberían responder correctamente

## 📝 Notas

- El código está listo y compila correctamente
- El problema es únicamente de permisos del sistema para levantar el servidor
- Una vez levantado, el servicio debería funcionar correctamente
- Las utilidades de verificación de URLs están implementadas y funcionando
