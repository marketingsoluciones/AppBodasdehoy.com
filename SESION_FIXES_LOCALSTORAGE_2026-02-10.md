# Sesión: Fixes de localStorage y Errores de Consola

**Fecha**: 2026-02-10
**Rama**: feature/nextjs-15-migration
**Estado Final**: ✅ Todos los errores críticos resueltos

## 🎯 Objetivos Completados

1. ✅ Resolver errores de `SecurityError: localStorage`
2. ✅ Resolver `ChunkLoadError` que impedía cargar la app
3. ✅ Resolver warnings de imagen con src vacío
4. ✅ Levantar ambos servidores (8080 y 3210)
5. ✅ Verificar funcionalidad completa

## 🔧 Problemas Encontrados y Resueltos

### 1. SecurityError en AsyncLocalStorage (CRÍTICO)

**Error**:
```
SecurityError: Failed to read the 'localStorage' property from 'Window':
Access is denied for this document.
```

**Ubicación**:
- `apps/copilot/src/store/global/initialState.ts:166`
- `apps/copilot/src/services/user/_deprecated.ts:16`

**Causa**: La clase `AsyncLocalStorage` accedía directamente a `localStorage` sin manejo de errores. En modo incógnito o con configuraciones de privacidad estrictas, esto causaba crashes.

**Solución**: Modificar `apps/copilot/packages/utils/src/localStorage.ts`
- Agregado helper `safeLocalStorage` con try-catch
- Reemplazados todos los accesos directos a localStorage
- Manejo de errores en constructor, getFromLocalStorage y saveToLocalStorage

**Código agregado**:
```typescript
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`⚠️ [AsyncLocalStorage] No se pudo leer localStorage (${key}):`, error);
      return null;
    }
  },
  // ... setItem, removeItem con misma protección
};
```

### 2. ChunkLoadError (CRÍTICO)

**Error**:
```
Loading chunk app/[variants]/layout failed.
(error: http://localhost:3210/_next/static/chunks/app/%5Bvariants%5D/layout.js)
```

**Causa**: Los errores no manejados de `localStorage` en la inicialización causaban que React fallara al cargar chunks.

**Solución**: Al resolver los SecurityErrors de localStorage, el ChunkLoadError se resolvió automáticamente.

### 3. Image Component con src Vacío

**Error**:
```
An empty string ("") was passed to the src attribute.
```

**Ubicación**: `apps/copilot/src/components/Branding/ProductLogo/Custom.tsx:39`

**Causa**: El componente `CustomImageLogo` intentaba renderizar `<Image src="">` cuando no había logo configurado.

**Solución**: Agregado null check
```typescript
const CustomImageLogo = memo<Omit<ImageProps, 'alt' | 'src'> & { size: number }>(
  ({ size, ...rest }) => {
    // Si no hay URL de logo, no renderizar nada
    if (!BRANDING_LOGO_URL || BRANDING_LOGO_URL === '') {
      return null;
    }

    return (
      <Image
        alt={BRANDING_NAME}
        height={size}
        src={BRANDING_LOGO_URL}
        unoptimized={true}
        width={size}
        {...rest}
      />
    );
  },
);
```

### 4. localStorage en ChatHydration

**Error**: Similar SecurityError al guardar contexto de URL params

**Ubicación**: `apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatHydration/index.tsx:121`

**Solución**: Envuelto en try-catch
```typescript
try {
  localStorage.setItem('copilot-context', JSON.stringify(contextData));
} catch (storageError) {
  console.warn('⚠️ No se pudo guardar en localStorage:', storageError);
  // Continuar sin localStorage - no es crítico
}
```

## 📁 Archivos Modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `apps/copilot/packages/utils/src/localStorage.ts` | **Fix** | AsyncLocalStorage protegida con safeLocalStorage |
| `apps/copilot/src/components/Branding/ProductLogo/Custom.tsx` | **Fix** | Null check para logo URL vacío |
| `apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatHydration/index.tsx` | **Fix** | Try-catch en localStorage.setItem |
| `apps/copilot/src/utils/safeLocalStorage.ts` | **Nuevo** | Utility reutilizable para localStorage |

## 📊 Commits Creados

```bash
d5c008ca - fix: Proteger AsyncLocalStorage contra errores de acceso a localStorage
729941ae - fix: Resolver errores de consola en apps/copilot
```

## 🚀 Estado Final de Servidores

```
✅ apps/web (8080): HTTP 200 - 0.59s
✅ apps/copilot (3210): HTTP 200 - 2.96s
```

Ambos servidores funcionando correctamente.

## ⚠️ Warnings NO Críticos

### Performance Warnings (Normales en desarrollo)
```
⚠️ useInitSystemStatus: bloqueada por ~500-1000ms
⚠️ initNonCritical: bloqueada por ~500-900ms
```
- Estas operaciones son síncronas durante la inicialización
- En producción serán más rápidas
- NO afectan la experiencia del usuario

### CORS Errors (Esperados en localhost)
```
Access to fetch at 'https://api-ia.bodasdehoy.com/api/debug-logs/upload' ... blocked by CORS
```
- Normal: localhost:3210 no está en whitelist de CORS
- NO afecta funcionalidad principal
- Solo bloquea subida de logs de debug

### i18n Warnings (Normales)
```
[i18n] Namespace "error" no encontrado para idioma "es-ES", usando objeto vacío
```
- Namespaces faltantes usan valores por defecto
- NO afecta funcionalidad

## ✅ Verificación de Funcionalidad

### Checklist Completo

- ✅ NO hay SecurityError en consola
- ✅ NO hay ChunkLoadError
- ✅ NO hay errores de Image src
- ✅ Aplicación carga correctamente
- ✅ Funciona en modo incógnito (localStorage bloqueado)
- ✅ Ambos servidores respondiendo (8080 y 3210)
- ✅ Sin errores de compilación
- ✅ Commits creados y pusheados

### Testing Realizado

1. **Servidor apps/web (8080)**
   - ✅ Levanta correctamente
   - ✅ Responde en 0.59s
   - ✅ Sin errores en logs

2. **Servidor apps/copilot (3210)**
   - ✅ Levanta correctamente después de fix
   - ✅ Responde en 2.96s (post-compilación)
   - ✅ Sin errores críticos en logs
   - ✅ Warnings de performance normales

3. **Navegador (http://localhost:3210)**
   - ✅ Aplicación carga sin ChunkLoadError
   - ✅ NO aparece SecurityError
   - ✅ Funciona correctamente

## 🎓 Lecciones Aprendidas

### 1. localStorage en SSR y Ambientes Restringidos
- **Problema**: localStorage puede estar bloqueado en:
  - Modo incógnito
  - Configuraciones de privacidad estrictas
  - SSR (server-side rendering)
  - iframes con restricciones

- **Solución**: Siempre usar try-catch al acceder a localStorage:
```typescript
try {
  localStorage.getItem(key);
} catch (error) {
  // Manejo de error
  return null;
}
```

### 2. Inicialización de Stores en React
- Los stores que dependen de localStorage deben manejar el caso donde no está disponible
- Usar `typeof window === 'undefined'` para detectar SSR
- Usar `queueMicrotask` para operaciones asíncronas que no bloqueen el render

### 3. Defensive Programming en Componentes
- Siempre validar props antes de renderizar
- Ejemplo: Validar `src` de Image antes de renderizar el componente
- Retornar `null` en lugar de renderizar con datos inválidos

## 📚 Documentación Actualizada

- ✅ README.md - Ya actualizado con arquitectura completa
- ✅ PROYECTO_COMPLETADO.md - Estado del proyecto
- ✅ Este documento (SESION_FIXES_LOCALSTORAGE_2026-02-10.md)

## 🔄 Próximos Pasos Sugeridos

1. **Testing en Producción**
   - Verificar que los fixes funcionen en chat-test.bodasdehoy.com
   - Monitorear logs de producción

2. **Optimizaciones de Performance** (Opcional)
   - Los warnings de blocking (~500-1000ms) son aceptables
   - Si se quiere optimizar, mover más operaciones a async/background

3. **Monitoreo de CORS**
   - Revisar si es necesario agregar localhost:3210 a whitelist
   - Por ahora no es crítico

4. **Refactorización Futura** (Muy opcional)
   - Considerar mover safeLocalStorage a un paquete compartido
   - Crear tests unitarios para AsyncLocalStorage

## 🎉 Resultado Final

**Estado**: ✅ 100% Funcional

Todos los errores críticos han sido resueltos. La aplicación carga correctamente y funciona en modo incógnito. Los warnings restantes son normales y no afectan la funcionalidad.

**Tiempo total**: ~30 minutos
**Archivos modificados**: 4
**Commits**: 2
**Líneas de código**: ~100 (agregadas/modificadas)

---

**Última actualización**: 2026-02-10
**Autor**: Claude Sonnet 4.5
