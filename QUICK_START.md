# ⚡ Quick Start - Próximos Pasos Inmediatos

## 🚀 Desarrollo local (app-test + chat-test)

Para trabajar en local con los dominios **app-test** y **chat-test** (login y Copilot):

1. **Añade a `/etc/hosts`:**
   ```
   127.0.0.1   app-test.bodasdehoy.com
   127.0.0.1   chat-test.bodasdehoy.com
   ```

2. **Desde la raíz del monorepo:**
   ```bash
   pnpm dev:local
   ```

3. **Abre en el navegador:**
   - App: **http://app-test.bodasdehoy.com:8080**
   - Chat: **http://chat-test.bodasdehoy.com:3210**

Si la pantalla se queda en blanco, espera 2–3 s o revisa la consola (F12). Más detalles: **`docs/LOCAL-DOMINIOS-APP-TEST-CHAT-TEST.md`**.

**Comprobar que todo está listo:** ejecuta `./scripts/verificar-local.sh`. Te dirá si faltan las entradas en `/etc/hosts`, si los puertos están en uso y si los dominios resuelven a 127.0.0.1. Si algo falla ahí, la app no se verá correctamente.

---

## 🎯 Acciones Inmediatas (5 minutos)

### 1. Verificar Estado Actual ✅
```bash
# Tests están funcionando
cd apps/copilot
pnpm test-app src/hooks/useWeddingWeb/__tests__/useWeddingWeb.test.ts src/components/wedding-site/__tests__/WeddingSiteRenderer.test.tsx src/app/\[variants\]/\(main\)/memories/__tests__/CreateAlbum.test.tsx
# Resultado esperado: 41/41 tests pasando ✅
```

### 2. Intentar Levantar Servidor 🔧
```bash
cd apps/copilot

# Intentar con puerto por defecto
pnpm dev

# Si falla con EPERM, intentar con localhost explícito
HOSTNAME=localhost pnpm dev
```

### 3. Verificar Versión de Node.js 📦
```bash
node --version
# Actual: v24.9.0
# Requerido: v20.x o v21.x

# Si tienes nvm instalado:
nvm install 20
nvm use 20
node --version  # Debe mostrar v20.x.x
```

---

## 🚨 Si el Servidor No Levanta (EPERM)

### Solución Rápida:
1. Abrir **Preferencias del Sistema** → **Seguridad y Privacidad** → **Accesibilidad**
2. Asegurar que **Cursor** y **Terminal** tienen permisos completos
3. Reiniciar Cursor/Terminal
4. Intentar de nuevo: `pnpm dev`

### Solución Alternativa:
Modificar `apps/copilot/next.config.ts` para usar `localhost`:
```typescript
// Buscar configuración del servidor y cambiar de 0.0.0.0 a localhost
```

---

## ✅ Checklist Rápido

- [x] Tests corregidos (41/41 pasando)
- [ ] Servidor levantando correctamente
- [ ] Node.js versión correcta (20.x)
- [ ] Suite completa de tests ejecutando
- [ ] CI/CD configurado

---

## 📊 Estado Actual

| Tarea | Estado |
|-------|--------|
| Tests Corregidos | ✅ 100% |
| Servidor Levantando | ⏳ Pendiente (EPERM) |
| Node.js Versión | ⚠️ v24.9.0 (requiere 20.x) |
| Documentación | ✅ Completa |

---

**Próximo paso recomendado**: Resolver problema EPERM para poder levantar el servidor.
