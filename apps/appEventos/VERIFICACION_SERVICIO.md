# Verificación del Servicio

## Estado del Build

✅ **Build completado exitosamente** - Todos los errores de TypeScript y linting fueron corregidos.

## Problemas Detectados al Levantar el Servicio

### Error: `EPERM: operation not permitted`

El servidor está intentando escuchar en `0.0.0.0` (todas las interfaces de red) y el sistema está bloqueando esto por permisos.

**Posibles causas:**
1. Restricciones de firewall del sistema
2. Permisos del usuario para bindear puertos
3. Configuración de seguridad de macOS

## Soluciones Recomendadas

### Opción 1: Usar localhost específicamente
El script `dev` ya fue actualizado para usar `-H localhost`:
```bash
npm run dev
```

### Opción 2: Verificar si hay procesos usando los puertos
```bash
lsof -i :3001
lsof -i :4001
lsof -i :4002
```

### Opción 3: Usar un puerto alto (> 1024)
Los puertos altos no requieren permisos especiales:
```bash
PORT=8080 npm run dev
```

### Opción 4: Ejecutar con sudo (no recomendado para desarrollo)
```bash
sudo npm run dev
```

## Verificación de URLs y Dominios

Se crearon utilidades para verificar URLs:

1. **API Endpoint**: `GET /api/verify-urls`
   - Verifica todas las URLs configuradas
   - Retorna información del dominio actual

2. **Verificación automática en desarrollo**:
   - Se ejecuta al cargar la app en desarrollo
   - Muestra resultados en la consola del navegador

3. **Utilidades disponibles**:
   - `checkUrl(url)` - Verifica una URL específica
   - `verifyAllUrls()` - Verifica todas las URLs configuradas
   - `verifyDomain()` - Analiza el dominio actual

## URLs Configuradas

- `NEXT_PUBLIC_BASE_URL`: https://apiapp.bodasdehoy.com
- `NEXT_PUBLIC_BASE_API_BODAS`: https://api.bodasdehoy.com
- `NEXT_PUBLIC_DIRECTORY`: https://bodasdehoy.com
- `NEXT_PUBLIC_CMS`: https://cms.bodasdehoy.com
- `NEXT_PUBLIC_CHAT`: https://chat.bodasdehoy.com
- `NEXT_PUBLIC_EVENTSAPP`: https://organizador.bodasdehoy.com

## Próximos Pasos

1. Resolver el problema de permisos del puerto
2. Una vez levantado, verificar que las URLs respondan correctamente
3. Probar la conexión con el backend
4. Verificar que no haya errores 502
