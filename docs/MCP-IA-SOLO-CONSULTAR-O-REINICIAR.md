# api2 y api-ia: solo consultar o reiniciar

Cuando te conectes a **api2** o **api-ia** (por SSH o cualquier acceso a esos servidores):

- **Sí:** consultar (leer logs, comprobar estado, revisar configuración, listar procesos, etc.) y **reiniciar** servicios cuando haga falta.
- **No:** modificar código en esos servidores. No editar archivos de aplicación, no hacer deploy de código, no cambiar fuentes.

Resumen: **solo consulta y reinicio**, nunca ofuscar ni tocar código en api2 ni api-ia.
