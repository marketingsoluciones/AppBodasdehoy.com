# 🎨 Visualización y Resolución del TestSuite UI

**Fecha**: 2026-01-25  
**Objetivo**: Visualizar y resolver problemas visuales/interfaz del TestSuite

---

## 🔍 Capacidades de Visualización Disponibles

### 1. Scripts de Navegador Disponibles

**`scripts/browser-control.ts`** - Control completo del navegador con Playwright:
- ✅ Abrir URLs
- ✅ Tomar screenshots
- ✅ Leer contenido del DOM
- ✅ Interactuar con elementos (click, type, scroll)
- ✅ Evaluar JavaScript en la página
- ✅ Leer console logs

**`scripts/screenshot-now.mjs`** - Screenshot rápido:
- ✅ Conecta a navegador existente o crea uno nuevo
- ✅ Toma screenshot del estado actual
- ✅ Lee contenido de iframes

### 2. TestSuite UI - Estructura Visual

**Componente Principal**: `apps/copilot/src/features/DevPanel/TestSuite/index.tsx`

**Elementos Visuales Identificados**:

1. **Tabla de Tests**:
   - Checkbox para selección múltiple
   - Columna: Question
   - Columna: Category
   - Columna: Difficulty
   - Columna: Status (con colores: verde=passed, rojo=failed, azul=running)
   - Columna: Score
   - Columna: Time

2. **Filtros**:
   - Por categoría
   - Por dificultad
   - Búsqueda por texto

3. **Botones de Acción**:
   - ▶️ Run Tests (ejecutar tests seleccionados)
   - 🔄 Reset (resetear resultados)
   - ⏹️ Stop (detener ejecución)

4. **Estadísticas**:
   - Total de tests
   - Passed/Failed/Pending
   - Promedio de score
   - Promedio de tiempo
   - Estadísticas por categoría

5. **Comparación de Modelos**:
   - Selector de modelos
   - Comparación lado a lado
   - Sistema de votación

---

## 🎯 Problemas Visuales Potenciales a Resolver

### 1. Layout y Espaciado
- ✅ Tabla responsive
- ✅ Scroll horizontal si es necesario
- ✅ Padding adecuado en celdas

### 2. Colores y Estados
- ✅ Colores de status claros (verde/rojo/azul)
- ✅ Estados hover en botones
- ✅ Indicadores visuales de carga

### 3. Responsive Design
- ✅ Adaptación a diferentes tamaños de pantalla
- ✅ Tabla scrollable en móviles
- ✅ Botones accesibles

### 4. Accesibilidad
- ✅ Contraste adecuado
- ✅ Labels descriptivos
- ✅ Navegación por teclado

---

## 🛠️ Cómo Visualizar el TestSuite

### Opción 1: Usar Script de Browser Control

```bash
# Abrir TestSuite en navegador
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/admin/test-suite

# Tomar screenshot
npx ts-node scripts/browser-control.ts screenshot testsuite.png

# Leer información de la página
npx ts-node scripts/browser-control.ts info
```

### Opción 2: Screenshot Rápido

```bash
# Tomar screenshot del estado actual
node scripts/screenshot-now.mjs
```

### Opción 3: Acceso Directo

1. Abrir navegador manualmente
2. Ir a: `https://chat-test.bodasdehoy.com/admin/test-suite`
3. Verificar visualmente la interfaz

---

## 🔧 Problemas Comunes y Soluciones

### Problema 1: Tabla No Se Ve Completa
**Síntoma**: La tabla se corta o no muestra todas las columnas

**Solución**:
```typescript
// Agregar scroll horizontal
<div style={{ overflowX: 'auto', width: '100%' }}>
  <table style={{ minWidth: '1000px' }}>
    {/* tabla */}
  </table>
</div>
```

### Problema 2: Colores de Status No Son Claros
**Síntoma**: Difícil distinguir entre passed/failed/pending

**Solución**:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed': return 'text-green-600 bg-green-50 border-green-200';
    case 'failed': return 'text-red-600 bg-red-50 border-red-200';
    case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
```

### Problema 3: Botones No Son Accesibles
**Síntoma**: Botones pequeños o difíciles de hacer click

**Solución**:
```typescript
<button
  style={{
    minHeight: '44px', // Tamaño mínimo táctil
    minWidth: '120px',
    padding: '8px 16px',
    cursor: 'pointer',
  }}
>
  Run Tests
</button>
```

---

## 📊 Estructura Visual del TestSuite

```
┌─────────────────────────────────────────────────────────┐
│ Test Suite                                    [+ Add]    │
├─────────────────────────────────────────────────────────┤
│ Filters: [Category ▼] [Difficulty ▼] [Search...]       │
├─────────────────────────────────────────────────────────┤
│ Stats: Total: 1000 | Passed: 850 | Failed: 150         │
├─────────────────────────────────────────────────────────┤
│ [☑] Question          │ Category │ Diff │ Status │ Score│
├─────────────────────────────────────────────────────────┤
│ [☑] "¿Cuánto cuesta?" │ general  │ easy │ passed │ 95% │
│ [☑] "¿Dónde está?"     │ location │ med  │ failed │ 60% │
│ [☑] "¿Cuándo es?"     │ date     │ easy │ running│ -   │
│ ...                                                    │
├─────────────────────────────────────────────────────────┤
│ [▶ Run Tests] [🔄 Reset] [⏹ Stop]                     │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Verificación Visual

- [ ] Tabla se muestra correctamente
- [ ] Todas las columnas son visibles
- [ ] Colores de status son claros
- [ ] Botones son accesibles
- [ ] Filtros funcionan visualmente
- [ ] Estadísticas se muestran correctamente
- [ ] Responsive en diferentes tamaños
- [ ] Scroll funciona si hay muchos tests
- [ ] Indicadores de carga visibles
- [ ] Modales se muestran correctamente

---

## 🚀 Próximos Pasos

1. **Visualizar TestSuite**:
   - Ejecutar script de browser control
   - Tomar screenshot
   - Verificar layout

2. **Identificar Problemas**:
   - Comparar con diseño esperado
   - Verificar accesibilidad
   - Probar en diferentes tamaños

3. **Resolver Problemas**:
   - Ajustar CSS/styling
   - Mejorar layout
   - Optimizar responsive

---

**Estado**: ✅ Capacidades identificadas, listo para visualizar y resolver problemas visuales
