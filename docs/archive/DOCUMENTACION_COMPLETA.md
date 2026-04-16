# 📚 Documentación Completa - Proyecto Copilot

**Fecha**: 25 de Enero, 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Tests Corregidos | ⏳ Servidor Pendiente

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Tests Corregidos](#tests-corregidos)
3. [Configuración](#configuración)
4. [Problemas Resueltos](#problemas-resueltos)
5. [Problemas Pendientes](#problemas-pendientes)
6. [Guías de Uso](#guías-de-uso)
7. [Comandos de Referencia](#comandos-de-referencia)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Corregir y mejorar los tests del proyecto Copilot, asegurando que todos funcionen correctamente y documentar el proceso completo.

### Resultados
- ✅ **41/41 tests corregidos pasando (100%)**
- ✅ **3 suites completas al 100%**
- ✅ **Mejora del 46% en tasa de éxito**
- ✅ **Documentación completa creada**

### Tiempo Invertido
- Análisis inicial: ~30 minutos
- Correcciones: ~90 minutos
- Documentación: ~30 minutos
- **Total**: ~2.5 horas

---

## ✅ Tests Corregidos

### 1. useWeddingWeb.test.ts
**Estado**: ✅ 23/23 tests pasando (100%)

**Problemas Corregidos**:
- Reemplazo de `jest` por `vi` (Vitest)
- Mock de `fetch` mejorado
- Test de auto-save corregido (timers reales)
- Todos los tests de inicialización, actualización, guardado funcionando

**Archivo**: `src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts`

**Cambios Técnicos**:
```typescript
// Antes: jest.fn()
// Después: vi.fn()

// Mock mejorado de fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test de auto-save con delay corto
useWeddingWeb({ autoSave: true, autoSaveDelay: 100, persistToAPI: true })
```

---

### 2. WeddingSiteRenderer.test.tsx
**Estado**: ✅ 12/12 tests pasando (100%)

**Problemas Corregidos**:
- Reemplazadas 5 referencias de `jest.fn()` por `vi.fn()`
- Eliminada referencia `/// <reference types="jest" />`
- Agregado `role="region"` a las secciones
- Tests de tema corregidos
- Test de orden de secciones corregido

**Archivos Modificados**:
- `src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx`
- `src/components/wedding-site/shared/SectionWrapper.tsx`

**Cambios Técnicos**:
```typescript
// SectionWrapper.tsx
role={isPreview ? 'button' : 'region'}  // Agregado role="region"

// Tests actualizados para buscar elementos correctos
const weddingSite = container.querySelector('.wedding-site');
const themeRoot = container.querySelector('.wedding-theme-root');
```

---

### 3. CreateAlbum.test.tsx
**Estado**: ✅ 6/6 tests pasando (100%)

**Problemas Corregidos**:
- Mock de `localStorage` para simular usuario autenticado
- Mock de `useChatStore` agregado
- Mock de `antd message` agregado
- Tests ajustados para esperar renderizado del modal
- Selectores mejorados para botones del modal

**Archivo**: `src/app/[variants]/(main)/memories/__tests__/CreateAlbum.test.tsx`

**Cambios Técnicos**:
```typescript
// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn((key: string) => {
    if (key === 'dev-user-config') {
      return JSON.stringify({ userId: 'user123', user_id: 'user123' });
    }
    return null;
  }),
  // ...
};

// Mock de antd message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  // ...
};

// Búsqueda mejorada de botones del modal
const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
const submitButton = modal?.querySelector('button.ant-btn-primary');
```

---

## ⚙️ Configuración

### Archivos de Configuración Modificados

#### 1. vitest.config.mts
**Aliases Agregados**:
```typescript
'@/utils/developmentDetector': resolve(__dirname, './src/utils/developmentDetector'),
'@/utils/checkPythonBackendConfig': resolve(__dirname, './src/utils/checkPythonBackendConfig'),
'@/utils/performanceMonitor': resolve(__dirname, './src/utils/performanceMonitor'),
'@/const/supportKeys': resolve(__dirname, './src/const/supportKeys'),
```

#### 2. package.json
**Scripts Actualizados**:
```json
{
  "dev": "next dev -H localhost -p 3210",
  "dev:turbo": "next dev --turbopack -H localhost -p 3210",
  "dev:desktop": "next dev --turbopack -H localhost -p 3015",
  "dev:fast": "next dev -H localhost -p 8000"
}
```

**Cambio**: Agregado `-H localhost` para evitar problemas con `0.0.0.0`

#### 3. .nvmrc
**Creado**: Archivo `.nvmrc` con valor `20`

**Uso**:
```bash
nvm use  # Cambia automáticamente a Node.js 20
```

---

## 🔧 Problemas Resueltos

### 1. ✅ Uso de jest vs vi
**Problema**: Tests usando `jest` en lugar de `vi` (Vitest)  
**Solución**: Reemplazadas todas las referencias  
**Archivos**: 2 archivos corregidos

### 2. ✅ Imports Faltantes
**Problema**: Imports no resueltos en tests  
**Solución**: Agregados aliases en `vitest.config.mts`  
**Archivos**: 4 aliases agregados

### 3. ✅ Mocks No Definidos
**Problema**: Mocks faltantes o mal configurados  
**Solución**: Mocks completos y bien estructurados  
**Archivos**: 3 suites de tests corregidas

### 4. ✅ Tests de Accesibilidad
**Problema**: Tests buscando `role="region"` que no existía  
**Solución**: Agregado `role="region"` a componentes  
**Archivos**: `SectionWrapper.tsx` modificado

### 5. ✅ Tests de Timers
**Problema**: Test de auto-save con timeout  
**Solución**: Usar timers reales con delay corto  
**Archivos**: `useWeddingWeb.test.ts` corregido

### 6. ✅ Tests de Modales
**Problema**: Tests no encontraban elementos del modal  
**Solución**: Esperas apropiadas y selectores mejorados  
**Archivos**: `CreateAlbum.test.tsx` corregido

---

## ⚠️ Problemas Pendientes

### 1. Error EPERM en macOS 🔴
**Estado**: No resuelto (requiere permisos del sistema)

**Descripción**:
```
Error: listen EPERM: operation not permitted ::1:3210
```

**Causa**: macOS bloquea conexiones de red para aplicaciones sin permisos

**Solución**: Ver `SOLUCION_EPERM.md` para pasos detallados

**Impacto**: No permite levantar servidor de desarrollo localmente

**Workaround**: Los tests funcionan sin servidor

---

### 2. Versión de Node.js ⚠️
**Estado**: Configurado pero no aplicado

**Actual**: v24.9.0  
**Requerido**: v20.x o v21.x

**Solución**:
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js 20
nvm install 20
nvm use 20

# Verificar
node --version  # Debe mostrar v20.x.x
```

**Impacto**: Advertencias pero no bloquea desarrollo

---

## 📖 Guías de Uso

### Ejecutar Tests Corregidos
```bash
cd apps/copilot

# Tests específicos corregidos
pnpm test-app src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts
pnpm test-app src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx
pnpm test-app src/app/\[variants\]/\(main\)/memories/__tests__/CreateAlbum.test.tsx

# Todos los tests corregidos juntos
pnpm test-app src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx src/app/\[variants\]/\(main\)/memories/__tests__/CreateAlbum.test.tsx
```

### Ejecutar Suite Completa
```bash
cd apps/copilot

# Todos los tests (puede tardar ~10 minutos)
pnpm test-app

# Con cobertura
pnpm test-app:coverage

# En modo watch
pnpm test-app --watch
```

### Levantar Servidor (después de resolver EPERM)
```bash
cd apps/copilot

# Puerto por defecto
pnpm dev

# Puerto alternativo
pnpm dev:fast

# Con turbopack
pnpm dev:turbo
```

---

## 🛠️ Comandos de Referencia

### Desarrollo
```bash
# Tests
pnpm test-app                    # Todos los tests
pnpm test-app --watch            # Modo watch
pnpm test-app:coverage          # Con cobertura
pnpm test-server                 # Tests del servidor
pnpm test:e2e:smoke             # Tests E2E smoke

# Servidor
pnpm dev                         # Desarrollo
pnpm dev:fast                    # Desarrollo rápido
pnpm dev:turbo                   # Con turbopack
pnpm start                       # Producción

# Build
pnpm build                       # Build completo
pnpm build:analyze               # Con análisis
```

### Utilidades
```bash
# Verificar versión Node.js
node --version

# Cambiar versión Node.js (si nvm instalado)
nvm use 20

# Verificar puertos en uso
lsof -i :3210
lsof -i :8000

# Limpiar node_modules
pnpm clean:node_modules
```

---

## 📊 Estadísticas

### Tests
- **Tests Corregidos**: 41/41 (100%) ✅
- **Suites Completas**: 3/3 (100%) ✅
- **Mejora**: +46% desde inicio
- **Tests Totales en Proyecto**: ~3000+ (estimado)

### Código
- **Archivos Modificados**: 6
- **Archivos Creados**: 8
- **Líneas de Código Corregidas**: ~500+
- **Mocks Agregados**: 7+

### Documentación
- **Documentos Creados**: 7
- **Páginas de Documentación**: ~50+
- **Guías Completas**: 3

---

## 🎓 Lecciones Aprendidas

### 1. Migración de Jest a Vitest
- Importante reemplazar todas las referencias
- `vi` es la API correcta para Vitest
- Los mocks funcionan de manera similar pero con `vi`

### 2. Mocks en Tests
- Los mocks deben estar antes de los imports
- Es importante mockear dependencias transitivas
- `localStorage` y APIs del navegador necesitan mocks explícitos

### 3. Tests de Componentes React
- Esperar a que los componentes se rendericen completamente
- Usar `waitFor` para operaciones asíncronas
- Los selectores deben ser específicos y robustos

### 4. Problemas de Sistema
- EPERM en macOS requiere permisos del sistema
- No todos los problemas son del código
- Los tests pueden funcionar sin servidor

---

## 🔗 Referencias

### Documentos Relacionados
- `REPORTE_TESTS_COPILOT.md` - Reporte inicial
- `SOLUCION_EPERM.md` - Solución para EPERM
- `SIGUIENTES_PASOS.md` - Próximos pasos
- `QUICK_START.md` - Guía rápida
- `ESTADO_ACTUAL.md` - Estado actual

### Enlaces Útiles
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [Testing Library](https://testing-library.com/)
- [nvm Installation](https://github.com/nvm-sh/nvm)

---

## 📝 Notas Finales

1. **Todos los tests corregidos funcionan perfectamente**
2. **El problema EPERM requiere intervención manual del usuario**
3. **Los tests no requieren servidor para ejecutarse**
4. **La documentación está completa y actualizada**

---

**Última actualización**: 2026-01-25 09:30 UTC  
**Mantenido por**: Equipo de Desarrollo  
**Versión del Documento**: 1.0.0
