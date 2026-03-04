# ⚠️ Database Models Deprecados (EN USO - NO ELIMINAR)

**Estado**: 🔴 **EN USO ACTIVO**
**Fecha documentación**: 2026-02-10

---

## 🚨 IMPORTANTE: NO ELIMINAR

Estos modelos de base de datos **_deprecated** siguen siendo usados activamente por los services deprecados.
**NO PUEDEN SER ELIMINADOS** sin migrar completamente a la arquitectura V2.

---

## 📊 Modelos en Esta Carpeta

### Models

1. **`models/session.ts`**
   - Usado por: `src/services/session/_deprecated`
   - Propósito: Gestión de sesiones de usuario

2. **`models/message.ts`**
   - Usado por: `src/services/message/_deprecated`
   - Propósito: Mensajes de chat

3. **`models/topic.ts`**
   - Usado por: `src/services/topic/_deprecated`
   - Propósito: Topics/conversaciones

4. **`models/file.ts`**
   - Usado por: `src/services/file/_deprecated`
   - Propósito: Archivos adjuntos

5. **`models/plugin.ts`**
   - Usado por: `src/services/plugin/_deprecated`
   - Propósito: Plugins del sistema

6. **`models/user.ts`**
   - Usado por: `src/services/user/_deprecated`
   - Propósito: Datos de usuario

7. **`models/sessionGroup.ts`**
   - Usado por: `src/services/session/_deprecated`
   - Propósito: Agrupación de sesiones

### Schemas

Múltiples archivos de schemas usados por los modelos deprecados.

---

## 🔗 Dependencias

Estos modelos son usados por:
- ✅ `src/services/session/_deprecated`
- ✅ `src/services/message/_deprecated`
- ✅ `src/services/topic/_deprecated`
- ✅ `src/services/file/_deprecated`
- ✅ `src/services/plugin/_deprecated`
- ✅ `src/services/user/_deprecated`

Ver: [`src/services/_deprecated/README.md`](../services/_deprecated/README.md)

---

## 🎯 Plan de Migración

### V1 → V2

**V1 (Actual - Deprecado)**:
- Database: IndexedDB local
- Models: Estos archivos
- Schema: En esta carpeta

**V2 (Nueva Arquitectura)**:
- Database: Server-side (api-ia + API2)
- Models: `src/database/models/` (nuevo)
- Schema: Schema moderno

### Pasos de Migración

1. ✅ Implementar nuevos modelos V2 en `src/database/models/`
2. ✅ Crear script de migración de datos
3. ✅ Migrar services a usar V2
4. ✅ Testing exhaustivo
5. ✅ Eliminar `_deprecated/` (cuando todo V2 esté completo)

**Estimado**: 40-80 horas

---

## ⚠️ Advertencias

### NO Hacer

- ❌ **NO ELIMINAR** sin migrar services primero
- ❌ **NO MODIFICAR** schemas sin testing
- ❌ **NO ASUMIR** que no se usan

### Sí Hacer

- ✅ **Verificar** uso con grep antes de cualquier cambio
- ✅ **Documentar** cambios
- ✅ **Testing** exhaustivo

---

## 📚 Referencias

- [src/services/_deprecated/README.md](../services/_deprecated/README.md)
- [ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md](../../../../../../ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md)

---

**⚠️ RECORDATORIO**: NO ELIMINAR sin completar migración V2.
