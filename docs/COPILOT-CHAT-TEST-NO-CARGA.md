# Copilot y chat-test en app-test (monorepo)

**Regla actual**: En app-test (AppBodasdehoy) el Copilot usa **solo chat-test** (LobeChat). Si chat-test no carga (502 o timeout), el Copilot **no** carga y no se hace fallback a chat de producción.

- **Par del monorepo**: app-test ↔ chat-test. Los dos deben estar operativos para que el Copilot funcione en app-test.
- Detalle de arquitectura y URLs: ver **`docs/MONOREPO-APP-TEST-CHAT-TEST.md`**.

Para que el Copilot cargue en app-test hay que asegurar que **chat-test.bodasdehoy.com** responda (servidor arriba o DNS CNAME a chat si se reutiliza el mismo backend).
