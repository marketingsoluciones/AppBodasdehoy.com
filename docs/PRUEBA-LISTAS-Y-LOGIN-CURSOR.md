# Prueba: listas y login en Cursor (Chrome MCP)

**Fecha:** 2026-02-12  
**Navegador:** Chrome controlado por chrome-devtools MCP  
**Base URL:** http://localhost:8080

---

## 1. Carga inicial

- Se recargó **http://localhost:8080/** y se esperó a que apareciera "Organiza tus eventos".
- **Resultado:** La página cargó correctamente.

---

## 2. Listas (rutas) que abren

| Ruta | Navegación | Resultado |
|------|------------|-----------|
| **/eventos** | OK | Carga; como invitado sin evento, la app redirige a **/** (home con "Pendientes", "Archivados", "Realizados"). |
| **/invitados** | Timeout 10s en respuesta MCP | La URL llegó a /invitados; después la app redirige a **/**. |
| **/mesas** | OK | Carga; redirige a **/** (sin evento seleccionado). |
| **/presupuesto** | Timeout 15s en respuesta MCP | Página **/presupuesto** quedó seleccionada (list_pages lo confirmó). |
| **/invitaciones** | OK | Carga; redirige a **/**. |

**Conclusión:** Todas las listas **abren** (las rutas responden). Como usuario invitado y sin evento, la app redirige a home desde invitados, mesas, invitaciones; eventos y presupuesto cargan o redirigen según el flujo actual.

---

## 3. Login

- Navegación a **http://localhost:8080/login**: OK.
- La app redirige a **/** (home): con sesión invitado activa, no se muestra el formulario de login en la misma pestaña.

**Para probar el login:**

1. Cerrar sesión si hay opción "Cerrar sesión" (como invitado a veces no aparece), o  
2. Abrir **http://localhost:8080/login** en una ventana de incógnito / otra sesión, o  
3. Borrar cookies de localhost:8080 y volver a ir a /login.

Cuando el formulario de login esté visible, se puede comprobar que carga (email, contraseña, botón de envío).

---

## 4. Resumen

- **Carga inicial:** OK.
- **Listas (eventos, invitados, mesas, presupuesto, invitaciones):** Todas las rutas abren; el comportamiento con invitado sin evento es redirigir a home donde aplica.
- **Login:** La ruta /login abre pero, con sesión invitado activa, la app redirige a home; para ver el formulario de login hace falta incógnito o sin sesión.
