# Informe corregido para el equipo del portal público / web-dev

**Fecha:** 2026-09-14  
**Estado operativo:** restaurado en el Mac Mini.

## 1. Corrección de topología

web-dev se sirve desde el Mac Mini, igual que app-dev, chat-dev, editor-dev y memories-dev.

El frontend correcto es el portal público Bodasdehoy.com. No es el shell de SuitePro que escucha en 3300.

- Fuente histórica viva: /Volumes/Projects/Bodasdehoy.com.
- Rama: fix/auditoria-front-20260904.
- Commit desplegado: 7dd2459.
- Aplicación: Next.js 12.2.5, React 17.
- Puerto: 4000.
- Servicio actual: PM2 web-dev.
- Copia operativa en SSD interno: /Users/juancarlosparra/Services/Bodasdehoy.com.

El directorio /Volumes/Projects era un montaje SMB del MacBook Pro. Ejecutar Next.js directamente desde ese montaje bloqueaba la compilación por I/O. Se copió el mismo commit y configuración al SSD interno del Mac Mini.

## 2. Causa del 502

Había dos problemas simultáneos:

1. No existía un proceso local escuchando en el puerto 4000 del Mac Mini.
2. Había dos conectores Cloudflare Tunnel activos para el mismo túnel: un LaunchAgent antiguo y PM2 cloudflared.

La configuración también enviaba web-dev a 100.105.48.36:4000, el MacBook Pro. Tras cambiarla, el conector antiguo seguía usando en memoria la ruta anterior. Cloudflare distribuía tráfico entre ambos conectores, produciendo resultados incoherentes y 502.

Se desactivó el LaunchAgent duplicado y quedó una única instancia de cloudflared gestionada por PM2.

## 3. Configuración actual

~~~text
web-dev.bodasdehoy.com         -> http://127.0.0.1:4000
web-dev.eventosorganizador.com -> http://127.0.0.1:4000
web-dev.vivetuboda.com         -> http://127.0.0.1:4000
~~~

| Servicio | Puerto | Supervisor |
|---|---:|---|
| chat-dev | 3210 | PM2 |
| app-dev | 3220 | PM2 |
| editor-dev | 3230 | PM2 |
| memories-dev | 3240 | PM2 |
| suite-dev | 3300 | PM2 |
| web-dev | 4000 | PM2 |
| cloudflared | túnel | PM2 |

La configuración PM2 quedó guardada para el siguiente reinicio.

## 4. Evidencia posterior a la reparación

| URL | Resultado |
|---|---:|
| http://127.0.0.1:4000/ | 200 |
| https://web-dev.bodasdehoy.com/ | 200 |
| https://web-dev.bodasdehoy.com/empresa/el-varadero-2cb2e9 | 200 |
| https://web-dev.eventosorganizador.com/ | 200 |

Prueba de estabilidad:

- Bodas de Hoy: 12/12 peticiones HTTP 200.
- Eventos Organizador: 12/12 peticiones HTTP 200.
- Fallos observados después de retirar el conector duplicado: 0.

## 5. Limitación del build del portal

El modo DEV compila y sirve correctamente desde el SSD interno. El build de producción del portal no se puede declarar limpio porque el repositorio arrastra deuda previa:

- Tres errores ESLint por enlaces internos con etiqueta HTML a en lugar de next/link.
- package.json y package-lock.json no están sincronizados.
- El árbol instalado contiene tipos modernos de Node incompatibles con TypeScript 4.3.
- Una instalación limpia falla por dependencias peer antiguas de React 17 y react-quill.

No se cambió código del portal durante esta reparación. Para recuperar el servicio se reutilizó el árbol de dependencias que ya ejecutaba el portal y se dejó next dev bajo PM2.

## 6. Trabajo para el equipo del portal

1. Elegir como fuente canónica la rama protegida del repositorio o la copia importada en CrmPro-1/apps/bodasdehoy-portal.
2. Eliminar la duplicidad documentada en ORIGEN.md.
3. Sincronizar package.json y el lockfile con una versión de Node documentada.
4. Corregir los tres errores de enlaces internos.
5. Conseguir un build de producción reproducible.
6. Desplegar un directorio de build separado, validarlo en otro puerto y sustituir el modo DEV de PM2.
7. Mantener un solo supervisor para Cloudflare Tunnel.
8. Añadir health check de web-dev y alerta cuando el origen 4000 no responda.
9. Ejecutar las mejoras funcionales ya entregadas al equipo: enlaces a fichas, rutas 404, buscador, mapa, analítica y SEO.

## 7. Operación

~~~bash
ssh mac-mini
pm2 status
pm2 restart web-dev
pm2 restart cloudflared
pm2 save
curl -I http://127.0.0.1:4000/
curl -I https://web-dev.bodasdehoy.com/
~~~

El servicio se considera operativo mientras PM2 muestre web-dev y cloudflared online, exista un único conector del túnel y las dos marcas devuelvan HTTP 200.
