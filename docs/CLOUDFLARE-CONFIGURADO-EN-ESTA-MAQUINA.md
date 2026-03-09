# Cloudflare configurado en esta máquina

**Cloudflare está configurado en esta máquina** mediante **Cloudflare Tunnel (cloudflared)**. El túnel corre en local y conecta Cloudflare con tu equipo para que app-test y chat-test apunten a los puertos de la web y del Copilot.

---

## 1. Dónde está la configuración

| Qué | Dónde |
|-----|--------|
| **Config del tunnel** | **`~/.cloudflared/config.yml`** (en tu home, **fuera del repo**) |
| **Proceso** | `cloudflared tunnel run` (o `cloudflared tunnel --config ~/.cloudflared/config.yml run`) |

El archivo `config.yml` **no está en el repositorio**; está en tu carpeta de usuario. Para verlo o editarlo:

```bash
cat ~/.cloudflared/config.yml
# o editarlo:
nano ~/.cloudflared/config.yml
```

---

## 2. Qué debe tener el config para app-test y chat-test

En **`~/.cloudflared/config.yml`** debe haber una sección **ingress** que envíe cada hostname al puerto correcto de **esta máquina**:

| Hostname | Puerto en esta máquina | App |
|----------|------------------------|-----|
| **app-test.bodasdehoy.com** | **3000** (prod) o **8080** (dev) | Web (`apps/web`) |
| **chat-test.bodasdehoy.com** | **3210** | Copilot (`apps/copilot`) |

Ejemplo de **ingress** (el resto del archivo depende de cómo creaste el tunnel: `tunnel`, `credentials-file`, etc.):

```yaml
ingress:
  - hostname: app-test.bodasdehoy.com
    service: http://localhost:3000
  - hostname: chat-test.bodasdehoy.com
    service: http://localhost:3210
  - hostname: chat-test.eventosorganizador.com
    service: http://localhost:3210
  # Regla por defecto (obligatoria): captura el resto y devuelve 404
  - service: http_status:404
```

Si en **desarrollo** usas la web en 8080, cambia app-test a `http://localhost:8080`.

**Importante:** En el pasado chat-test fallaba (502) porque estaba apuntando a **3001** en vez de **3210**. Hay que asegurarse de que **chat-test** use siempre **3210**.

---

## 3. Comprobar si el tunnel está corriendo (en esta máquina)

```bash
ps aux | grep cloudflared
```

Deberías ver uno o más procesos de `cloudflared tunnel run` (o con `--config ~/.cloudflared/config.yml`). Si no hay ninguno, el tunnel no está activo y app-test/chat-test no llegarán a esta máquina.

---

## 4. Reiniciar el tunnel tras cambiar el config

Si editas `~/.cloudflared/config.yml` (por ejemplo para corregir un puerto), hay que reiniciar cloudflared:

```bash
# Matar procesos cloudflared actuales (sustituir PIDs por los que salgan de ps aux | grep cloudflared)
kill <PID_cloudflared>

# Arrancar de nuevo (sustituir <nombre-del-tunnel> si usas tunnel con nombre)
nohup cloudflared tunnel --config ~/.cloudflared/config.yml run &
# o, si tienes un tunnel nombrado:
# nohup cloudflared tunnel run <nombre-del-tunnel> &
```

---

## 5. Resumen

| Pregunta | Respuesta |
|----------|-----------|
| **¿Dónde está configurado Cloudflare para esta máquina?** | En **~/.cloudflared/config.yml** y en el proceso **cloudflared** que corre en local. |
| **¿Qué hace?** | El tunnel conecta Cloudflare con esta máquina; el **ingress** en `config.yml` indica a qué puerto local va cada hostname (app-test → 3000/8080, chat-test → 3210). |
| **¿El archivo está en el repo?** | No. Está en tu home (`~/.cloudflared/config.yml`). |
| **Si chat-test no carga** | Revisar en `config.yml` que **chat-test.bodasdehoy.com** apunte a **http://localhost:3210** y que el proceso Copilot esté escuchando en 3210; luego reiniciar el tunnel. |

Ver también: **[CHAT-TEST-NO-CARGA-REVISAR.md](./CHAT-TEST-NO-CARGA-REVISAR.md)** (puerto 3210 y derivación).

**Estado actual de los túneles en este equipo:** **[ESTADO-TUNELES-ESTE-EQUIPO.md](./ESTADO-TUNELES-ESTE-EQUIPO.md)** — qué tunnel está corriendo, ingress y puertos comprobados.
