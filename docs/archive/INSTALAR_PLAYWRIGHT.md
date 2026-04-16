# 📦 Instalar Playwright para Testing del Frontend

**Fecha**: 2026-01-25  
**Objetivo**: Instalar Playwright para poder usar los scripts de visualización del TestSuite

---

## 🚀 Instalación Rápida

### Opción 1: Solo Chromium (Recomendado)

```bash
npx playwright install chromium
```

**Tiempo estimado**: 2-5 minutos  
**Tamaño**: ~200 MB

---

### Opción 2: Todos los Navegadores

```bash
npx playwright install
```

**Tiempo estimado**: 5-10 minutos  
**Tamaño**: ~1 GB

---

## ✅ Verificar Instalación

Después de instalar, verifica que funciona:

```bash
node scripts/abrir-testsuite-playwright.mjs
```

Si funciona correctamente, deberías ver:
- ✅ Chromium se abre
- ✅ Navega al TestSuite
- ✅ Toma screenshot automáticamente

---

## 🔄 Alternativa: Usar Navegador del Sistema

Mientras Playwright se instala, puedes usar el script alternativo:

```bash
node scripts/abrir-testsuite-sistema.mjs
```

Este script:
- ✅ Abre el TestSuite en tu navegador predeterminado
- ✅ No requiere instalación adicional
- ✅ Funciona inmediatamente
- ⚠️ No toma screenshots automáticos (usa el navegador manualmente)

---

## 📋 Scripts Disponibles

### Con Playwright (Requiere instalación)

1. **`scripts/abrir-testsuite-playwright.mjs`**
   - Abre Chromium visible
   - Toma screenshots automáticos
   - Analiza contenido del DOM
   - Intercepta requests/responses

2. **`scripts/ver-testsuite-cursor.mjs`**
   - Modo headless (rápido)
   - Extrae información
   - Toma screenshot
   - Muestra información en terminal

### Sin Playwright (Funciona inmediatamente)

3. **`scripts/abrir-testsuite-sistema.mjs`** ⭐ NUEVO
   - Abre en navegador del sistema
   - No requiere instalación
   - Funciona inmediatamente

4. **`scripts/abrir-testsuite-url-correcta.sh`**
   - Script bash simple
   - Abre en navegador del sistema
   - Verifica conectividad

---

## 🐛 Troubleshooting

### Error: "Executable doesn't exist"

**Solución**:
```bash
npx playwright install chromium
```

---

### Error: "Timeout installing browsers"

**Solución**:
1. Verificar conexión a internet
2. Intentar de nuevo:
   ```bash
   npx playwright install chromium
   ```
3. Si sigue fallando, usar alternativa:
   ```bash
   node scripts/abrir-testsuite-sistema.mjs
   ```

---

### Playwright se instala muy lento

**Solución**:
- Usar alternativa mientras tanto:
  ```bash
  node scripts/abrir-testsuite-sistema.mjs
  ```
- O instalar solo Chromium (más rápido):
  ```bash
  npx playwright install chromium
  ```

---

## ✅ Checklist

- [ ] Instalar Playwright: `npx playwright install chromium`
- [ ] Verificar instalación: `node scripts/abrir-testsuite-playwright.mjs`
- [ ] O usar alternativa: `node scripts/abrir-testsuite-sistema.mjs`

---

**Estado**: ✅ Script alternativo creado - Puedes usar el navegador del sistema mientras Playwright se instala
