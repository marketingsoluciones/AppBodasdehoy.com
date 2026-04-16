# Análisis: Error 502 Bad Gateway y uso de VPN

## Resumen

Cuando se accede a **chat-test.bodasdehoy.com** (u otros dominios detrás de Cloudflare) **con VPN activa**, los usuarios pueden ver **502 Bad Gateway**. Este documento analiza las causas probables y las acciones recomendadas.

---

## Flujo de la petición

```
Usuario (navegador)  →  Cloudflare (CDN/WAF)  →  Origen (servidor Next.js)
       ↑                        ↑                           ↑
   IP del usuario           Madrid / PoP              chat-test host
   (puede ser VPN)          "Working"                   "Error" → 502
```

El 502 significa: **Cloudflare no recibió una respuesta válida del servidor de origen**. El fallo está entre Cloudflare y el origen, no entre el usuario y Cloudflare.

---

## Por qué la VPN puede “desencadenar” o agravar el 502

### 1. **Ruteo y PoP distintos**

- Con VPN, la IP del usuario cambia (ubicación geográfica o tipo de red).
- Cloudflare puede enviar el tráfico a otro **Point of Presence (PoP)** o a otra configuración de **load balancer**.
- Si ese camino lleva a un origen caído, sobrecargado o mal configurado → **502**.

### 2. **Latencia y timeouts**

- VPN suele añadir latencia.
- Si el origen ya es lento, las peticiones que pasan por VPN pueden llegar a **timeouts** (ej. 100 s en CF).
- Cloudflare interpreta “sin respuesta a tiempo” como fallo del origen → **502**.

### 3. **IPs de datacenter y WAF**

- Muchas VPNs usan IPs de datacenter.
- Cloudflare puede tener reglas (WAF, Bot Fight Mode, etc.) más estrictas para esas IPs.
- Lo más común es **403** o **challenge**, pero en combinación con reglas custom o Workers, en algunos escenarios puede derivar en **502** (p. ej. si un Worker hace proxy y falla).

### 4. **TLS / interceptación VPN**

- Algunas VPNs hacen inspección TLS (MITM).
- Puede haber problemas de certificados o de negociación entre **navegador ↔ Cloudflare**.
- Menos habitual que eso se vea como 502 puro, pero en edge cases podría contribuir a fallos que se manifiestan como 502.

### 5. **Origen solo acepta IPs de Cloudflare**

- El origen a veces restringe conexiones a los **rangos de IP de Cloudflare**.
- La petición **Usuario → Cloudflare** llega con IP del usuario (VPN); **Cloudflare → Origen** usa IP de Cloudflare.
- En principio la VPN no debería afectar a esta parte. Pero si hay **rate limiting por IP de origen (Cloudflare)** o por **request headers** que cambian con VPN (p. ej. `X-Forwarded-For`), podría haber comportamientos raros y, en algunos setups, **502** en casos límite.

---

## Comprobaciones recomendadas

### En Cloudflare (Dashboard)

| Comprobación | Dónde | Notas |
|--------------|--------|--------|
| **Reglas WAF** que bloqueen o modifiquen tráfico por IP/datacenter | Security → WAF | Revisar si hay bloqueos por “known bots” o datacenter que afecten a VPNs |
| **Rate limiting** | Security → Rate limiting | Ver si las IPs de salida VPN disparan límites |
| **Timeout de origen** | Rules → Origin Rules o similar | Por defecto 100 s; bajarlo mucho puede provocar 502 por tiempo |
| **Health checks** | Traffic / Load balancing | Ver que los orígenes estén UP y que el LB no envíe tráfico a instancias caídas |

### En el servidor de origen (chat-test)

| Comprobación | Acción |
|--------------|--------|
| **Proceso Next.js** | Ver que el app esté corriendo y estable (`pm2`, systemd, etc.) |
| **Logs del servidor** | Buscar 5xx, timeouts, crashes al mismo tiempo que reportes de 502 con VPN |
| **Reverse proxy (nginx, etc.)** | Revisar `proxy_read_timeout`, `proxy_connect_timeout` y que no sean demasiado bajos |
| **Firewall** | Confirmar que permita tráfico desde [IP ranges de Cloudflare](https://www.cloudflare.com/ips/) |

### Pruebas útiles

1. **Sin VPN** desde el mismo lugar → si no hay 502, refuerza que el factor es VPN/ruteo/latencia.
2. **Con VPN en otra región** → si en alguna región sí y en otra no, apunta a PoP/ruteo o orígenes distintos.
3. **Reproducir con `curl`** desde una VPS (IP de datacenter) para simular tipo de tráfico “estilo VPN”.

---

## Cambios en el código (este repo)

- **`CopilotIframe`** y **`EventosAutoAuth`**: se actualizaron los mensajes ante **502** para mencionar la VPN y sugerir probar sin ella.
- **`docs/ANALISIS-502-VPN.md`**: este documento para referencia y troubleshooting.

---

## Mensaje sugerido al usuario cuando ve 502

Si el usuario ve **502** (sobre todo con VPN):

1. **Reintentar** en unos minutos.
2. **Probar sin VPN** (desactivar VPN y recargar).
3. Si persiste, **contactar soporte** indicando que ocurre con VPN (y, si puede, región de la VPN).

---

## Referencias

- [Cloudflare: 502 errors](https://support.cloudflare.com/hc/en-us/articles/115003011431-Troubleshooting-Cloudflare-5XX-errors#502badgateway)
- [Cloudflare IP ranges](https://www.cloudflare.com/ips/)
