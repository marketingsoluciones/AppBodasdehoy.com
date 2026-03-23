# Estado servidor backend-ia-v2 (consulta)

**Última consulta:** 2026-03-09 (solo lectura, sin modificar código).

## Servidor

- **Host:** `ubuntu-s-2vcpu-4gb-amd-sfo3-01--api-chat`
- **Usuario:** root
- **Uptime:** ~55 días

## Servicios escuchando

| Puerto | Proceso        | Nota              |
|--------|----------------|-------------------|
| 22     | sshd           | SSH               |
| 53     | systemd-resolve| DNS local         |
| 6379   | redis-server   | Redis             |
| 8030   | python         | Backend api-ia    |

## No encontrado en este servidor

- **cloudflared:** no hay proceso cloudflared/tunnel en este host.
- **8080 / 3210:** no escuchan aquí (la web 8080 y el copilot 3210 corren en otro sitio, p. ej. tu Mac o el host donde está el túnel).

## Conclusión

Este host es el **backend api-ia** (puerto 8030). El túnel de Cloudflare para app-test y chat-test no está en esta máquina; está en el equipo donde corre cloudflared y las apps en 8080/3210.

---

## Estado en esta máquina (local, 2026-03-09)

- **api-ia público:** `https://api-ia.bodasdehoy.com` → **200** (responde).
- **8080 y 3210:** en uso por `node` (web + copilot corriendo en local).
- **cloudflared:** **no** está corriendo en esta máquina.

Para que **app-test** y **chat-test** respondan desde fuera, en esta máquina hay que arrancar el túnel (p. ej. `./scripts/iniciar-tunnel.sh`). Ver [REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md](./REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md).

---

## Prueba tras arrancar túnel (2026-03-10)

Se ejecutó `./scripts/iniciar-tunnel.sh`; el túnel se registró (4 conexiones en `cloudflared.log`). Luego `./scripts/probar-urls-tunnel.sh`:

| URL | Resultado |
|-----|-----------|
| https://app-test.bodasdehoy.com/ | **200** |
| https://app-test.bodasdehoy.com/login?d=app | **200** |
| https://chat-test.bodasdehoy.com/ | **200** (tras comprobar de nuevo) |
| https://api-ia.bodasdehoy.com/health | **200** |
| https://backend-chat-test.bodasdehoy.com/ | **200** |
| https://crm-leads.eventosorganizador.com/ | **200** |

**Conclusión:** app-test y chat-test responden 200 cuando el túnel y los servicios están activos.
