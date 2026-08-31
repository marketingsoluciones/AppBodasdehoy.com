# chat-dev · matriz y handoff técnico

Fecha: 2026-07-24  
Hora de cierre: 16:21  
Entorno: `chat-dev.bodasdehoy.com`

## Resumen

- `Asistente`: OK. La IA respondió correctamente a un prompt real de redacción.
- `Bandeja Web`: muestra `Responder`, `Nota interna`, caja de texto y envío.
- `Bandeja WhatsApp`: muestra el mismo patrón que Web.
- `Status Broadcast / newsletter`: también muestra el mismo patrón de respuesta libre.
- `Pendientes para ti`: `/pendientes` rebota a `/asistente`.
- `Archivos`: `/files` cae a vista de visitante o sesión inconsistente.

## Matriz rápida

| Superficie | Ruta | Composer visible | Restricción visible | Estado observado | Riesgo |
|---|---:|---:|---:|---|---|
| Asistente | `/asistente` | Sí | No aplica | OK | Bajo |
| Bandeja Web | `/bandeja/web/...` | Sí | No | Composer de respuesta libre | Alto |
| Bandeja WhatsApp | `/bandeja/wa/...` | Sí | No | Composer de respuesta libre | Alto |
| Status / Broadcast | `/bandeja/wa/...` | Sí | No | Composer de respuesta libre | Muy alto |
| Pendientes | `/pendientes` | No estable | No | Rebota a Asistente | Alto |
| Archivos | `/files` | No estable | No | Vista visitante / sesión rota | Alto |

## Hallazgos

### HD-01
La UI no diferencia visualmente entre `respuesta libre`, `solo plantilla`, `solo nota interna` o `sin escritura`.

### HD-02
`/pendientes` existe como navegación pero no abre su propia vista.

### HD-03
`/files` no mantiene un estado autenticado coherente.

### HD-04
Se observaron señales cruzadas entre shell autenticado y UI de visitante.

### HD-05
La consola registró errores compatibles con problemas de sesión e hidratación.

## Consola observada

```text
FirebaseError: auth/requests-to-this-api-securetoken.googleapis.com-method-google.identity.securetoken.v1.securetoken.granttoken-are-blocked
⚠️ Sesión Firebase perdida tras 3 intentos. Limpiando tokens y avisando UI.
net::ERR_ABORTED /api/messages/stream?development=bodasdehoy
[topic/apiIa] updateTopic ... → 404 (silenciado)
Minified React error #418
```

## Recomendaciones

1. Introducir `composerMode` explícito por conversación.
2. Mostrar un chip o banda de estado: `Respuesta libre`, `Solo plantilla`, `Solo nota`, `Bloqueado`.
3. Desactivar textarea y envío cuando el canal no permita respuesta externa.
4. Entregar desde backend flags de capacidad por conversación.
5. Revisar guards y refresh de sesión en `/pendientes` y `/files`.
