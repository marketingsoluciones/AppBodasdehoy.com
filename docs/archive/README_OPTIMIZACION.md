# 🚀 Guía de Optimización y Mantenimiento

Esta guía contiene todas las herramientas y scripts creados para optimizar y mantener el proyecto.

---

## 📊 Resumen de Optimización

### Resultados Obtenidos:
- ✅ **2GB liberados** del proyecto (de 15GB a 13GB)
- ✅ **32 extensiones eliminadas** (de 86 a 54 - 37% de reducción)
- ✅ **~114MB liberados** de extensiones
- ✅ **8 scripts de mantenimiento** creados
- ✅ **4 documentos** de análisis y resultados

---

## 🛠️ Scripts Disponibles

### 1. `scripts/ver-estado.sh`
**Ver el estado actual de optimización**
```bash
./scripts/ver-estado.sh
```
Muestra:
- Tamaño del proyecto
- Número de extensiones instaladas
- Estado de builds y cachés
- Scripts y documentación disponible

### 2. `scripts/cleanup.sh`
**Limpieza básica del proyecto**
```bash
./scripts/cleanup.sh
```
Elimina:
- Directorios `.next` (builds)
- Directorios `.vercel/output` (builds de Vercel)
- Archivos `.log` y `.tsbuildinfo`
- Directorios `.cache` y `.screenshots`

### 3. `scripts/mantenimiento-automatico.sh`
**Mantenimiento periódico (ejecutar semanalmente)**
```bash
./scripts/mantenimiento-automatico.sh
```
Similar a `cleanup.sh` pero con mejor formato y sugerencias.

### 4. `scripts/optimizacion-completa.sh`
**Optimización completa (ejecuta todo)**
```bash
./scripts/optimizacion-completa.sh
```
Ejecuta:
- Limpieza del proyecto
- Análisis de extensiones
- Búsqueda de archivos grandes
- Verificación del store de PNPM
- Resumen final

### 5. `scripts/analizar-extensiones-cursor.sh`
**Ver extensiones instaladas en Cursor**
```bash
./scripts/analizar-extensiones-cursor.sh
```
Muestra:
- Lista completa de extensiones con versiones
- Total de extensiones
- Tamaño del directorio de extensiones

### 6. `scripts/analizar-tamano-extensiones.sh`
**Ver tamaño de extensiones**
```bash
./scripts/analizar-tamano-extensiones.sh
```
Muestra:
- Tamaño total de extensiones
- Top 10 extensiones más grandes
- Extensiones mayores a 50MB

### 7. `scripts/eliminar-extensiones-no-necesarias.sh`
**Eliminar extensiones básicas no necesarias**
```bash
./scripts/eliminar-extensiones-no-necesarias.sh
```
Elimina extensiones de:
- Python
- Jupyter
- Gemini/Google
- Herramientas de sistema

### 8. `scripts/eliminar-extensiones-avanzado.sh`
**Eliminar extensiones avanzadas (con manejo de errores)**
```bash
./scripts/eliminar-extensiones-avanzado.sh
```
Elimina extensiones de:
- Python (con reintento forzado)
- MongoDB
- Docker/Containers
- Redis
- Testing (Wallaby/Quokka)
- Colaboración (Live Share)
- Duplicados

---

## 📚 Documentación Disponible

### 1. `ANALISIS_OPTIMIZACION.md`
Análisis completo del proyecto:
- Uso de espacio detallado
- Análisis de dependencias
- Recomendaciones específicas
- Plan de acción

### 2. `RESUMEN_OPTIMIZACION.md`
Resumen con recomendaciones:
- Estadísticas de extensiones
- Extensiones a eliminar
- Extensiones esenciales
- Plan de acción recomendado

### 3. `RESULTADO_FINAL_OPTIMIZACION.md`
Resultado inicial de optimización:
- Extensiones eliminadas (primera ronda)
- Estado actual
- Próximos pasos

### 4. `OPTIMIZACION_COMPLETA.md`
Resumen final completo:
- Todas las extensiones eliminadas
- Herramientas creadas
- Beneficios obtenidos
- Conclusión

---

## 🔄 Mantenimiento Periódico

### Semanal
```bash
./scripts/mantenimiento-automatico.sh
```

### Mensual
```bash
# Ver estado
./scripts/ver-estado.sh

# Optimización completa
./scripts/optimizacion-completa.sh

# Revisar extensiones
./scripts/analizar-tamano-extensiones.sh
```

### Cada 2-3 meses
- Revisar extensiones instaladas
- Eliminar extensiones no utilizadas
- Verificar espacio del proyecto

---

## 💡 Optimizaciones Adicionales

### Limpiar Store de PNPM (Opcional)
Si trabajas en múltiples proyectos, puedes limpiar el store global:
```bash
pnpm store prune
```
**⚠️ ADVERTENCIA**: Esto afecta TODOS los proyectos que usan PNPM.

### Verificar Archivos Grandes
```bash
find . -type f -size +100M -not -path "*/node_modules/*" -not -path "*/.git/*"
```

### Reinstalar Dependencias (si es necesario)
```bash
# Desde el directorio del proyecto
cd apps/copilot
npm run clean:node_modules
pnpm install
```

---

## 📊 Estado Actual

- **Tamaño del proyecto**: 13GB
- **Extensiones instaladas**: 54
- **Extensiones eliminadas**: 32 (37% de reducción)
- **Scripts disponibles**: 8
- **Documentación**: 4 archivos

---

## ✅ Checklist de Optimización

- [x] Limpieza de archivos de build y caché
- [x] Eliminación de extensiones no necesarias
- [x] Creación de scripts de mantenimiento
- [x] Configuración optimizada de Cursor
- [x] Documentación completa
- [ ] Limpieza periódica (configurar recordatorio)
- [ ] Revisión de extensiones cada 2-3 meses

---

## 🎯 Próximos Pasos

1. **Ejecutar mantenimiento semanal**: Configura un recordatorio para ejecutar `mantenimiento-automatico.sh`
2. **Revisar extensiones**: Cada 2-3 meses, ejecuta `analizar-tamano-extensiones.sh`
3. **Mantener documentación actualizada**: Si haces cambios, actualiza los documentos

---

## 🆘 Solución de Problemas

### Si un script no tiene permisos:
```bash
chmod +x scripts/nombre-del-script.sh
```

### Si Cursor no se encuentra:
```bash
# Verificar que Cursor esté en PATH
which cursor

# O usar code (VS Code) como alternativa
export CURSOR_CMD=code
```

### Si hay errores al eliminar extensiones:
1. Cierra completamente Cursor
2. Elimina manualmente desde `~/.cursor/extensions/`
3. Reinicia Cursor

---

## 📞 Comandos Rápidos

```bash
# Ver estado
./scripts/ver-estado.sh

# Limpiar proyecto
./scripts/cleanup.sh

# Ver extensiones
./scripts/analizar-extensiones-cursor.sh

# Optimización completa
./scripts/optimizacion-completa.sh
```

---

**Última actualización**: 20 de enero de 2026
