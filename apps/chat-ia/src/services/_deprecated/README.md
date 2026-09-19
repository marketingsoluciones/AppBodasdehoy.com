# ⚠️ Capa Deprecada (EN USO - NO ELIMINAR)

**Estado**: 🔴 **EN USO ACTIVO**
**Fecha documentación**: 2026-02-10

---

## 🚨 IMPORTANTE: NO ELIMINAR

Esta capa **_deprecated** sigue siendo usada activamente por los services principales.
**NO PUEDE SER ELIMINADA** sin migrar completamente a la arquitectura V2.

---

## 📊 Estado Actual

### Services que Usan esta Capa

Los siguientes services **TODAVÍA** exportan y usan código de `_deprecated`:

1. **`src/services/session/index.ts`**
   - Exporta: `ClientService` desde `_deprecated`
   - Usado para: Gestión de sesiones de usuario

2. **`src/services/import/index.ts`**
   - Exporta: Servicios de importación desde `_deprecated`
   - Usado para: Importar datos de otras fuentes

3. **`src/services/export/index.ts`**
   - Usa: `deprecatedExportService` desde `_deprecated.ts`
   - Usado por: `src/services/config.ts` (múltiples funciones)
   - Comentario: "TODO remove in V2"

4. **`src/services/topic/index.ts`**
   - Exporta: Servicios de topics desde `_deprecated`
   - Usado para: Gestión de topics/conversaciones

5. **`src/services/file/index.ts`**
   - Exporta: Servicios de archivos desde `_deprecated`
   - Usado para: Gestión de archivos adjuntos

6. **`src/services/user/index.ts`**
   - Exporta: Servicios de usuario desde `_deprecated`
   - Usado para: Gestión de datos de usuario

7. **`src/services/message/index.ts`**
   - Exporta: Servicios de mensajes desde `_deprecated`
   - Usado para: CRUD de mensajes de chat

8. **`src/services/plugin/index.ts`**
   - Exporta: Servicios de plugins desde `_deprecated`
   - Usado para: Gestión de plugins

---

### Database Models en _deprecated

**`src/database/_deprecated/`** contiene modelos y schemas usados por los services deprecados:

- `models/session.ts`
- `models/message.ts`
- `models/topic.ts`
- `models/file.ts`
- `models/plugin.ts`
- `models/user.ts`
- `models/sessionGroup.ts`
- `schemas/` (varios)

Estos modelos **SIGUEN EN USO** por los services que dependen de `_deprecated`.

---

### Server y Utilidades

1. **`src/server/globalConfig/_deprecated.ts`**
   - Función: `genServerLLMConfig`
   - Usado desde: `server/globalConfig/index.ts`

2. **`src/utils/_deprecated/parseModels.ts`**
   - Usado en: Migraciones (FromV3ToV4)
   - Usado en: `server/globalConfig/_deprecated.ts`

---

### Config

**`src/services/config.ts`** tiene múltiples **TODOs de V2**:

```typescript
// TODO: remove this in V2
await deprecatedExportService.exportAgents();

// TODO: remove this in V2
await deprecatedExportService.exportSessions();

// TODO: remove this in V2
await deprecatedExportService.exportSettings();

// (7 funciones en total)
```

---

## 🎯 Plan de Migración a V2

### ¿Por Qué Existe esta Capa?

Esta capa representa la **arquitectura V1** del proyecto LobeChat/PLANNER AI.
Se mantiene para **compatibilidad retroactiva** mientras se migra progresivamente a V2.

### ¿Cuándo se Puede Eliminar?

**NO ANTES de**:
1. ✅ Todos los services migren a nueva arquitectura V2
2. ✅ Todos los database models migren a nuevo schema
3. ✅ Todos los TODOs "remove in V2" sean resueltos
4. ✅ Testing completo de migración
5. ✅ Migración de datos de usuarios existentes

**Estimado de trabajo**: **40-80 horas** de desarrollo

---

## 📋 Checklist para Migración V2

### Services

- [ ] Migrar `services/session` a V2
- [ ] Migrar `services/import` a V2
- [ ] Migrar `services/export` a V2 (7 funciones en config.ts)
- [ ] Migrar `services/topic` a V2
- [ ] Migrar `services/file` a V2
- [ ] Migrar `services/user` a V2
- [ ] Migrar `services/message` a V2
- [ ] Migrar `services/plugin` a V2

### Database

- [ ] Migrar `database/_deprecated/models` a V2
- [ ] Migrar `database/_deprecated/schemas` a V2
- [ ] Script de migración de datos
- [ ] Testing de migración

### Server

- [ ] Migrar `server/globalConfig/_deprecated` a V2
- [ ] Migrar `utils/_deprecated/parseModels` a V2

### Config

- [ ] Resolver 7 TODOs en `services/config.ts`
- [ ] Testing de export/import completo

### Validación

- [ ] Testing completo de todas las features
- [ ] Migración de datos de producción
- [ ] Rollback plan preparado
- [ ] Documentación actualizada

---

## 🔍 Cómo Verificar Uso

Para verificar si algún archivo usa código deprecado:

```bash
# Buscar importaciones de _deprecated
grep -r "from.*_deprecated" src/ --include="*.ts" --include="*.tsx"

# Buscar uso de deprecatedExportService
grep -r "deprecatedExportService" src/ --include="*.ts"

# Buscar TODOs de V2
grep -r "TODO.*V2" src/ --include="*.ts" --include="*.tsx"
```

---

## ⚠️ Advertencias

### NO Hacer

- ❌ **NO ELIMINAR** archivos de `_deprecated/` sin verificar uso
- ❌ **NO MOVER** archivos sin actualizar imports
- ❌ **NO ASUMIR** que un archivo no usado sin grep exhaustivo

### Sí Hacer

- ✅ **Documentar** cada paso de migración V2
- ✅ **Testing** exhaustivo antes de eliminar
- ✅ **Grep** para verificar que ningún archivo lo usa
- ✅ **Mantener** rollback plan

---

## 📚 Referencias

- [ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md](../../../../../../ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md) - Análisis completo
- [PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md](../../../../../../PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md) - Sección 3.1

---

## 📞 Contacto

**Mantenedor**: Equipo PLANNER AI / LobeChat
**Fecha creación**: 2026-02-10
**Estado**: EN USO - NO ELIMINAR

---

**⚠️ RECORDATORIO FINAL**: Esta capa NO puede eliminarse sin completar migración V2.
Eliminarla romperá funcionalidad crítica del proyecto.
