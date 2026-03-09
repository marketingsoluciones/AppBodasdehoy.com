# Probar URLs desde terminal (zsh)

## 1. Errores que viste y por qué

### "zsh: no matches found: https://app-test.bodasdehoy.com/login?d=app"

En **zsh** los caracteres `?` y `&` son especiales (comodines). La URL tiene que ir **entre comillas**:

```bash
curl -I "https://app-test.bodasdehoy.com/login?d=app"
```

### "Failed to connect to chat-test.bodasdehoy.com port 443"

Tienes en **/etc/hosts**:
- `127.0.0.1 app-test.bodasdehoy.com`
- `127.0.0.1 chat-test.bodasdehoy.com`

Eso hace que el nombre resuelva a **localhost**. Pero en esta máquina **nadie escucha en el puerto 443** (HTTPS). La web está en **8080** y el Copilot en **3210**. Por eso:

- **https://chat-test.bodasdehoy.com** → va a 127.0.0.1:**443** → falla.
- Para probar **en local** (usando /etc/hosts) hay que usar **http** y el **puerto**:
  - **http://app-test.bodasdehoy.com:8080**
  - **http://chat-test.bodasdehoy.com:3210**

---

## 2. Comandos para copiar y pegar (copia cada bloque completo)

### Probar por tunnel (HTTPS, sin puerto – cuando DNS apunte al tunnel en Cloudflare)

```bash
curl -I "https://app-test.bodasdehoy.com/login?d=app"
curl -I "https://chat-test.bodasdehoy.com/"
```

(Siempre URL entre comillas por el `?`.)

### Probar en local (con /etc/hosts: 127.0.0.1 app-test y chat-test)

```bash
curl -I "http://app-test.bodasdehoy.com:8080/"
curl -I "http://app-test.bodasdehoy.com:8080/login?d=app"
curl -I "http://chat-test.bodasdehoy.com:3210/"
```

### Script que prueba todas las URLs del tunnel

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
./scripts/probar-urls-tunnel.sh
```

(Ese script usa HTTPS; si DNS aún no apunta al tunnel, fallarán. Para comprobar solo que los servicios locales responden, usa los curls de “Probar en local” de arriba.)

---

## 3. Resumen

| Dónde probás        | URL ejemplo                                      | Comillas |
|---------------------|---------------------------------------------------|----------|
| **Local** (/etc/hosts) | `http://app-test.bodasdehoy.com:8080/login?d=app` | Sí: `"..."` |
| **Local**           | `http://chat-test.bodasdehoy.com:3210/`           | Sí       |
| **Por tunnel** (HTTPS) | `https://app-test.bodasdehoy.com/login?d=app`  | Sí       |

- **zsh:** pon siempre la URL entre **comillas** si tiene `?` o `&`.
- **/etc/hosts a 127.0.0.1:** usá **http** y puerto **8080** (web) o **3210** (Copilot), no https ni 443.

---

## 4. "zsh: command not found: #" al pegar bloques

Si pegas un bloque que tiene **líneas que empiezan por `#`** (comentarios), a veces zsh muestra `command not found: #`. Puedes **ignorar** ese mensaje (los `echo` y `grep` se ejecutaron bien) o copiar **solo las líneas de comandos** sin las que son solo comentarios.

---

## 5. Abrir en el navegador (local, con /etc/hosts)

Puertos correctos:
- **app-test** = **web** → puerto **8080**
- **chat-test** = **Copilot** → puerto **3210**

Comandos correctos (copia cada línea si quieres):

```bash
open "http://app-test.bodasdehoy.com:8080/"
open "http://app-test.bodasdehoy.com:8080/login?d=app"
open "http://chat-test.bodasdehoy.com:3210/"
```

No uses `app-test.bodasdehoy.com:3210` para la web; 3210 es solo para chat-test (Copilot).
