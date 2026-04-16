# E2E Copilot — flujo estandarizado

Flujo único para pruebas de Copilot: **hacemos los tests juntos**. El agente levanta servicios, escribe la pregunta en el Copilot y deja el resultado; tú solo respondes en el chat si está correcto o qué hay que mejorar (respuesta de la IA o funcionalidad). No hace falta que ejecutes tú en la terminal.

**Principio:** La inteligencia debe estar en el **modelo/LLM** (razonar sobre la página, la pregunta, el contexto), no en acumular código ni selectores.

**Comportamiento esperado del Copilot:** Por defecto, pantalla de eventos (home). Cuando el usuario escribe y el Copilot detecta que habla de algo concreto (invitados, mesa, itinerario), el Copilot navega a esa pantalla y aplica el filtro si lo pide. Ver `docs/COPILOT-COMPORTAMIENTO-ESPERADO.md`.

---

## Comportamiento estándar

1. **Un solo navegador** (prohibido abrir varios).
2. **Orden:** login en app-test → (si hay evento, ir a módulo p. ej. /invitados) → **primero abrir Copilot y comprobar que se puede escribir** → luego enviar cada pregunta → el sitio muestra el resultado a la derecha y la pantalla del filtro → pausa para que el usuario confirme.
3. **Sin eventos:** no se exige tener eventos; si no hay, se sigue desde la página actual y se intenta abrir Copilot igual.
4. **Usuario:** solo confirma cuando ya está hecha la pregunta, mostrado el resultado y cambiada la pantalla al filtro (panel derecho). **Editar preguntas, archivos o código es cosa del agente;** tú no tienes que tocar nada.
5. **Quién escribe la pregunta:** el **sistema** (test E2E) escribe la pregunta en el Copilot; las frases están en el spec o en archivo/env. Tú no escribes, solo ves y confirmas. En la terminal verás `[E2E] Pregunta 2/5: ...` y `[E2E] Confirmar en el chat: Pregunta 2/5` para saber a cuál te refieres al confirmar.
6. **En Cursor:** tras cada pregunta el agente pregunta: "¿Confirmas si está todo ok, qué ha fallado o qué mejorar?" y espera tu confirmación.

---

## Comando estándar

Desde la raíz del repo (**AppBodasdehoy.com**):

```bash
pnpm e2e:copilot:autonomo
```

El script:
- **[1/2]** Comprueba app-test y chat-test; si fallan, levanta servicios y túnel y vuelve a comprobar.
- **[2/2]** Abre **un solo** navegador (WebKit), hace login, abre Copilot (comprueba que se puede escribir), envía cada pregunta, muestra resultado a la derecha y hace pausa para que confirmes.

**Pregunta personalizada:** tú me dices en el chat la frase, yo (o tú) ejecutamos el flujo con esa sola pregunta:

```bash
E2E_COPILOT_QUESTION="Tu pregunta exacta aquí" pnpm e2e:copilot:autonomo
```

Ejemplo — invitados cuyos nombres empiecen por M o R de la boda de Isabel:

```bash
E2E_COPILOT_QUESTION="Que invitados hay y muéstrame los invitados cuyos nombres empiecen por M o R de la boda de Isabel" pnpm e2e:copilot:autonomo
```

**Batería desde archivo** (varias preguntas, una por línea; pausa para confirmar cada una):

```bash
E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt pnpm e2e:copilot:autonomo
```

El archivo puede tener comentarios con `#`. Ver `e2e-app/copilot-questions-ejemplo.txt`.

**Recuperar última conversación (no borrar sesión):** para que el Copilot muestre la conversación anterior en lugar de crear una nueva, ejecuta sin limpiar sesión:

```bash
E2E_SKIP_CLEAR_SESSION=1 E2E_COPILOT_QUESTION="Tu pregunta" pnpm e2e:copilot:autonomo
```

---

## Dónde está definido

| Qué | Dónde |
|-----|--------|
| Script autónomo | `scripts/e2e-copilot-autonomo.sh` |
| Test (preguntas, pausas, filtro) | `e2e-app/flujo-copilot-confirmacion-visual.spec.ts` |
| Helpers (login, Copilot, esperas) | `e2e-app/helpers.ts` |
| Credenciales | `e2e-app/fixtures.ts` |
| Regla agente | `.cursor/rules/app-test-chat-test.mdc` |

---

## Limitación

Cuando el agente ejecuta el test desde su entorno, WebKit puede fallar (Abort trap: 6). **Para validar el flujo:** ejecuta tú en tu terminal:

```bash
pnpm e2e:copilot:autonomo
```

Solo se usa WebKit; Chromium está prohibido en este proyecto.

**Ver la pregunta mientras se escribe:** con `E2E_WAIT_FOR_VISUAL_CONFIRMATION=1` (por defecto en el script) el test hace una pausa de ~3,5 s antes de escribir y escribe más lento (~220 ms por tecla), y 2 s después de terminar antes de pulsar Enter. Así ves la frase en pantalla antes de enviarse. Opcional: `E2E_SLOW_TYPE=1` para el mismo efecto.

---

## Siguiente paso (tras este flujo)

- **Ejecutar y ver:** en tu máquina, `pnpm e2e:copilot:autonomo`; confirmar en el chat si cada pregunta y filtro se ven bien.
- **Modelo razonador:** el proxy ya envía `X-Prefer-Reasoning-Model` y `prefer_reasoning_model` a api-ia; en el backend Python hay que leerlos y enrutar al modelo más razonador (ver `docs/API-IA-MODELO-RAZONADOR.md`).
