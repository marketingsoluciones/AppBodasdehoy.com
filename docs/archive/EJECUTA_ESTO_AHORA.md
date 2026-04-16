# ⚡ EJECUTA ESTO AHORA

**Para configurar app-test y chat-test**

---

## 📋 Comando a Ejecutar

**Copia y pega esto en tu terminal (te pedirá contraseña)**:

```bash
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts && \
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts && \
echo "✅ Configurado!" && \
grep -E "app-test|chat-test" /etc/hosts && \
open http://app-test.bodasdehoy.com:3210
```

---

## ✅ Qué hace este comando:

1. Agrega `app-test.bodasdehoy.com` a /etc/hosts → localhost
2. Agrega `chat-test.bodasdehoy.com` a /etc/hosts → localhost
3. Muestra confirmación
4. Abre app-test.bodasdehoy.com:3210 en el navegador

---

## 🚀 Mientras Tanto

Ya abrí **http://localhost:3210** en tu navegador.

**Puedes usar localhost:3210 por ahora**, pero:
- ❌ No comparte sesión de Firebase
- ❌ Login no funcionará igual que en producción

**Por eso necesitas app-test** (con el comando de arriba)

---

## ✅ Después de Ejecutar el Comando

**app-test.bodasdehoy.com:3210** abrirá tu copilot local con:
- ✅ Firebase Auth funcionando
- ✅ Sesión compartida con bodasdehoy.com
- ✅ Sin bloqueos de 6 segundos (fix aplicado)
- ✅ Testing realista

---

**Ejecuta el comando arriba ↑ y app-test funcionará en 10 segundos** ⚡
