# 🚀 Abrir TestSuite y Ejecutar Tests

**Fecha**: 2026-01-25

---

## ✅ URL del TestSuite

```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

---

## 🎯 Pasos para Ejecutar Tests

### 1. Abrir el TestSuite

**Opción A: Desde Cursor**
- Copia la URL y pégala en tu navegador
- O usa Cmd+Click en la URL para abrirla

**Opción B: Desde Terminal**
```bash
# Intentar con Python
python3 -m webbrowser "https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests"

# O copiar URL manualmente
echo "https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests" | pbcopy
```

### 2. Verificar que Cargó

Deberías ver:
- ✅ Título: "Test Suite"
- ✅ Tabla con tests
- ✅ Botones: "Run Tests" y "Reset"
- ✅ Indicador de carga si está cargando

### 3. Seleccionar Tests

- Marca los checkboxes de los tests que quieres ejecutar
- Puedes seleccionar todos con el checkbox del header

### 4. Ejecutar Tests

- Haz click en **"Run Tests"**
- Verás:
  - 🚀 Banner azul: "Ejecutando tests..."
  - 📊 Progreso: "Progreso: X / Y"
  - ⏳ Spinner animado

### 5. Ver Resultados

Los resultados aparecerán en:
- La tabla (columna "Status" y "Score")
- Las estadísticas en la parte superior
- El banner de progreso

---

## 📊 Indicadores Visuales

### Al Cargar
- 🔄 Spinner grande
- "Cargando tests..."
- "Conectando con el backend..."

### Al Ejecutar
- 🚀 Banner azul destacado
- "Ejecutando tests..."
- "Progreso: X / Y"

### Resultados
- 🟢 Verde = passed
- 🔴 Rojo = failed  
- 🔵 Azul = running
- ⚪ Gris = pending

---

## 🔍 Consola del Navegador (F12)

Para ver logs detallados:
```
[TestSuite] 🔄 Cargando tests desde: ...
[TestSuite] ✅ Tests cargados: 1000
```

---

## ✅ Checklist

- [ ] TestSuite abierto en navegador
- [ ] Tests visibles en la tabla
- [ ] Tests seleccionados
- [ ] Botón "Run Tests" presionado
- [ ] Banner de progreso visible
- [ ] Resultados mostrados

---

**Estado**: ✅ Listo para ejecutar tests manualmente
