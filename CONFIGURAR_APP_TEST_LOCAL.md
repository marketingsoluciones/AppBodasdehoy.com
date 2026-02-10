# ⚡ Configurar app-test y chat-test para Desarrollo Local

**Objetivo**: Hacer que app-test.bodasdehoy.com y chat-test.bodasdehoy.com apunten a tu localhost

---

## ✅ Estado Actual

- **Servidor local**: ✅ Corriendo en http://localhost:3210
- **Optimizaciones**: ✅ Fix de 6.4s aplicado
- **app-test/chat-test**: ❌ Aún apuntan a Cloudflare (no a tu localhost)

---

## 🔧 Paso 1: Agregar Dominios a /etc/hosts

**Ejecuta estos comandos en tu terminal**:

```bash
# Agregar app-test
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts

# Agregar chat-test
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

Te pedirá tu contraseña de Mac. Ingrésala.

---

## ✅ Paso 2: Verificar que se Agregaron

```bash
grep -E "app-test|chat-test" /etc/hosts
```

Deberías ver:
```
127.0.0.1 app-test.bodasdehoy.com
127.0.0.1 chat-test.bodasdehoy.com
```

---

## 🚀 Paso 3: Probar Acceso

```bash
# Test app-test
curl -I http://app-test.bodasdehoy.com:3210

# Test chat-test
curl -I http://chat-test.bodasdehoy.com:3210
```

Ambos deberían devolver: `HTTP/1.1 200 OK`

---

## 🌐 Paso 4: Abrir en Navegador

**Abre cualquiera de estas URLs**:

- **http://app-test.bodasdehoy.com:3210** ⭐ (Recomendado)
- http://chat-test.bodasdehoy.com:3210

**Ventajas**:
- ✅ Firebase Auth funciona (dominio bodasdehoy.com compartido)
- ✅ Login automático si ya estás logueado
- ✅ Testing en condiciones reales

---

## 🎯 Resultado Esperado

Después de estos pasos:

1. **app-test.bodasdehoy.com:3210** abre tu copilot local
2. **Firebase login funciona** (sesión compartida)
3. **Optimizaciones aplicadas** (sin bloqueos de 6s)
4. **Desarrollo local real** con dominios reales

---

## 📊 Comparación

| Antes | Después |
|-------|---------|
| localhost:3210 (sin Firebase) | app-test.bodasdehoy.com:3210 (con Firebase) |
| No comparte sesión | ✅ Comparte sesión con bodasdehoy.com |
| Testing básico | ✅ Testing realista |

---

## 🐛 Troubleshooting

### Error: "No se puede resolver app-test.bodasdehoy.com"
```bash
# Verificar que está en /etc/hosts
grep app-test /etc/hosts

# Si no está, agregarlo:
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

### Error: "Conexión rechazada"
```bash
# Verificar que el servidor esté corriendo
lsof -i:3210

# Si no está, iniciarlo:
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
pnpm dev
```

---

## ⚡ Comando Todo-en-Uno

Copia y ejecuta esto en tu terminal:

```bash
# Agregar dominios a /etc/hosts
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts

# Verificar
echo ""
echo "✅ Verificando configuración:"
grep -E "app-test|chat-test" /etc/hosts

# Test
echo ""
echo "✅ Testeando conexión:"
curl -I http://app-test.bodasdehoy.com:3210 2>&1 | head -1

# Abrir en navegador
echo ""
echo "🌐 Abriendo en navegador..."
open http://app-test.bodasdehoy.com:3210
```

---

**Ejecuta el "Comando Todo-en-Uno" y en 30 segundos tendrás app-test funcionando** ⚡
