# 🧪 Guía de Tests - Proyecto Copilot

**Última actualización**: 25 de Enero, 2026  
**Estado**: ✅ Tests Corregidos | ⏳ Servidor Pendiente

---

## 🎯 Resumen Rápido

- **Tests Corregidos**: 41/41 (100%) ✅
- **Total de Tests en Proyecto**: ~299 archivos de test
- **Cobertura de Stores**: ~80% (94 test files, 1263 tests)
- **Estado General**: ✅ Funcionando correctamente

---

## 🚀 Inicio Rápido

### Ejecutar Tests Corregidos
```bash
cd apps/copilot

# Tests específicos corregidos (41 tests)
pnpm test-app src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts \
              src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx \
              src/app/\[variants\]/\(main\)/memories/__tests__/CreateAlbum.test.tsx

# Resultado esperado: 41/41 tests pasando ✅
```

### Ejecutar Todos los Tests
```bash
cd apps/copilot

# Suite completa (puede tardar ~10 minutos)
pnpm test-app

# Con cobertura
pnpm test-app:coverage

# Modo watch (desarrollo)
pnpm test-app --watch
```

---

## 📋 Tests Corregidos

### ✅ useWeddingWeb.test.ts (23/23)
**Ubicación**: `src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts`

**Cubre**:
- Inicialización del hook
- Actualización de datos (pareja, fecha, paleta, hero)
- Gestión de secciones
- Estado dirty/saving
- Funcionalidad de guardado
- Auto-guardado
- Callbacks
- Aplicación de cambios de AI

**Ejecutar**:
```bash
pnpm test-app src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts
```

---

### ✅ WeddingSiteRenderer.test.tsx (12/12)
**Ubicación**: `src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx`

**Cubre**:
- Renderizado básico (nombres, subtítulos, secciones)
- Modo preview vs production
- Aplicación de temas (paletas)
- Orden de secciones
- RSVP submission
- Estados vacíos

**Ejecutar**:
```bash
pnpm test-app src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx
```

---

### ✅ CreateAlbum.test.tsx (6/6)
**Ubicación**: `src/app/[variants]/(main)/memories/__tests__/CreateAlbum.test.tsx`

**Cubre**:
- Apertura del modal
- Validación de formulario
- Creación de álbum
- Pasar development al backend
- Redirección después de crear
- Manejo de errores

**Ejecutar**:
```bash
pnpm test-app src/app/\[variants\]/\(main\)/memories/__tests__/CreateAlbum.test.tsx
```

---

## 🔧 Configuración

### Requisitos
- **Node.js**: 20.x o 21.x (recomendado)
- **pnpm**: 8.x o superior
- **Sistema**: macOS, Linux, o Windows

### Instalación
```bash
# Instalar dependencias
pnpm install

# Verificar configuración
node --version  # Debe ser 20.x o 21.x
pnpm --version
```

---

## 📊 Cobertura de Tests

### Por Categoría
- **Stores**: ~80% (94 archivos, 1263 tests)
- **Componentes**: En progreso
- **Hooks**: useWeddingWeb ✅ (100%)
- **Utils**: Varios archivos cubiertos

### Por Store
- **agent**: ✅ Bien cubierto
- **chat**: ✅ Parcialmente cubierto
- **file**: ✅ Bien cubierto
- **image**: ✅ Bien cubierto
- **session**: ✅ Bien cubierto
- **tool**: ✅ Bien cubierto
- **user**: ✅ Bien cubierto
- **global**: ✅ Bien cubierto
- **aiInfra**: ✅ Parcialmente cubierto

---

## 🐛 Problemas Conocidos

### 1. Error EPERM en macOS
**Solución**: Ver `SOLUCION_EPERM.md`

### 2. Versión de Node.js
**Solución**: Usar Node.js 20.x (ver `.nvmrc`)

### 3. Tests Lentos
**Solución**: Usar filtros para ejecutar tests específicos

---

## 📚 Documentación Relacionada

- `DOCUMENTACION_COMPLETA.md` - Documentación técnica completa
- `SOLUCION_EPERM.md` - Solución para error EPERM
- `SIGUIENTES_PASOS.md` - Próximos pasos recomendados
- `ESTADO_ACTUAL.md` - Estado actual del proyecto

---

## 🎓 Mejores Prácticas

### Escribir Nuevos Tests
1. Usar `vi` en lugar de `jest`
2. Mockear dependencias antes de imports
3. Usar `waitFor` para operaciones asíncronas
4. Envolver actualizaciones de estado con `act()`
5. Verificar tipos antes de commitear

### Ejecutar Tests
1. Ejecutar tests específicos durante desarrollo
2. Ejecutar suite completa antes de commitear
3. Verificar cobertura periódicamente
4. Usar modo watch para desarrollo activo

---

**Mantenido por**: Equipo de Desarrollo  
**Versión**: 1.0.0
