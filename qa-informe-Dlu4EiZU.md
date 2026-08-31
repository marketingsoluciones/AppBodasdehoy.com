# Re-QA front chat-dev - build Dlu4EiZU-ngeTqojpn6aT

## Cabecera

- Fecha: 2026-08-21
- URL base: https://chat-dev.bodasdehoy.com
- Build validado: `Dlu4EiZU-ngeTqojpn6aT`
- Footer git esperado: `e0a0adc2`
- Navegador: MCP `integrated_browser`
- Guardarrail: `qa-evidencias/build-guardrail-Dlu4EiZU.txt`

## Resumen

- Estado general del front pedido en este re-QA: `OK con 2 pendientes de certificacion`
- Nuevos puntos funcionales validados: `G2`, `G1`, `Autopiloto`
- Regresiones visuales validadas: `B3`, `B4`, `H3`
- Pendientes no concluyentes: `24h`, `H4`
- Backend excluido por instruccion: `B2`, `B12`, `B16`

## Resultado por punto

| Punto | Resultado | Evidencia | Notas |
|---|---|---|---|
| Guardarraíl | ✅ | `qa-evidencias/build-guardrail-Dlu4EiZU.txt` | `curl ... | grep -c Dlu4EiZU-ngeTqojpn6aT -> 1` |
| G2 Resumen global en Soporte | ✅ | `qa-evidencias/G2-soporte-global-Dlu4EiZU.png` | En `/bandeja` con scope `Soporte` aparece la tarjeta `🌐 Todas tus bodas · 💍 50 bodas · 💬 8 sin leer · 🔔 19 notificaciones`. |
| G2 desaparece al seleccionar evento | ✅ | `qa-evidencias/G2-event-selected-Dlu4EiZU.png` | Al cambiar a `Boda de Pedro y Pedra`, la tarjeta global desaparece. |
| G2 no aparece en `?view=esperan` | ✅ | `qa-evidencias/G2-no-global-in-esperan-Dlu4EiZU.png` | En `/bandeja?view=esperan` no se renderiza la tarjeta global. |
| G2 no aparece en `?agent=` | ✅ | `qa-evidencias/G2-no-global-in-agent-filter-Dlu4EiZU.png` | En `/bandeja?agent=6a7236503c8bbc1957cea534` no se renderiza la tarjeta global. |
| G1 chip WA | ✅ | `qa-evidencias/G1-wa-chip-qr-Dlu4EiZU.png` | En una ruta `wa-...` se ve chip `QR`; por DOM existe un punto de salud verde (`span` 6x6 con `background: rgb(34, 197, 94)`). |
| G1 no-WA sin chip | ✅ | `qa-evidencias/G1-non-wa-no-chip-Dlu4EiZU.png` | En una conversación `web-...` no aparece chip `QR` ni `Meta API`. |
| 24h banner ámbar | ⚠️ No concluyente | - | No encontré un hilo WA normal con ventana abierta `<6h` y compositor estándar. Los hilos WA accesibles en esta sesión caen en modo informativo/solo nota interna o no expusieron el caso. No marco bug. |
| Autopiloto persistente | ✅ | `qa-evidencias/G4-autopiloto-persist-copiloto-Dlu4EiZU.png` | El picker abrió `Manual/Copiloto/Autopiloto`, cambié a `Copiloto`, se observó `POST /api/messages/workspace/bodasdehoy/ia-config` y tras recargar la ruta siguió en `Copiloto`. |
| B3 nombres únicos | ✅ | `qa-evidencias/B3-agentes-unique-Dlu4EiZU.png` | En `/agentes` los nombres visibles son distinguibles (`Agente f4fca2`, `Agente c2e41f`, `verif turn`, `prueba integración`, etc.). |
| B4 bandeja única | ✅ | `qa-evidencias/G2-soporte-global-Dlu4EiZU.png` | La bandeja observada es única, sin rail duplicado ni shell alterno. |
| H3 sin rail duplicado | ✅ | `qa-evidencias/G2-soporte-global-Dlu4EiZU.png` | No vi duplicación del rail lateral/superior en las rutas probadas. |
| H4 invitado con muro | ⚠️ No concluyente | - | La sesión del navegador MCP estaba autenticada y no tuve un contexto limpio aislado sin cookies/localStorage para certificar muro de invitado en esta build sin contaminar la prueba. |

## Evidencia técnica adicional

- Confirmación de `Copiloto` tras recarga por DOM:
  - `hasCopiloto: true`
  - `hasAutopiloto: false`
- Confirmación de persistencia por red:
  - `POST https://chat-dev.bodasdehoy.com/api/messages/workspace/bodasdehoy/ia-config`
- Confirmación del punto de salud del chip WA por DOM:
  - elemento `span.inline-block.h-1.5.w-1.5.rounded-full`
  - `backgroundColor = rgb(34, 197, 94)`

## Veredicto

- `PASS` para los cambios front pedidos en `G2`, `G1`, `Autopiloto`, `B3`, `B4` y `H3`.
- `Pendiente de certificacion controlada` para `24h` y `H4` por falta de caso/dataset o contexto invitado limpio en esta sesión.
