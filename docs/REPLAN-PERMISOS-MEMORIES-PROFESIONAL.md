# Replan: Permisos de Memories — Sistema de Colaboradores Existente

**Fecha:** 2026-03-17
**Estado:** Propuesta de replanteamiento

---

## El problema que queríamos resolver

Proteger las fotos de un profesional (fotógrafo, etc.) para que:
- Los clientes vean las fotos con marca de agua
- Solo el profesional pueda imprimir sin marca de agua

## Lo que hicimos mal

Creamos un concepto nuevo: `ProfessionalProfile` con su propia colección MongoDB, sus propios permisos (`printPermission`), su propia página de portfolio. **Ignoramos el sistema de permisos que ya existe.**

---

## El sistema de permisos que ya tenemos

### Nivel 1 — Evento (api2 / appEventos)

```
Evento
  ├── usuario_id              → Propietario (acceso total)
  └── detalles_compartidos_array[]
        └── { uid, email, permissions: [
              { title: "itinerario", value: "edit" | "view" | "none" },
              { title: "servicios",  value: "edit" | "view" | "none" },
              { title: "presupuesto", value: "edit" | "view" | "none" },
              ...
            ]}
```

**Módulos controlados hoy:** resumen, invitados, mesas, regalos, presupuesto, invitaciones, itinerario, servicios.

**El hook `useAllowed.tsx` ya gestiona todo:**
- Propietario → acceso total
- Colaborador con `"edit"` → puede editar
- Colaborador con `"view"` → solo ver
- Colaborador con `"none"` → sin acceso, redirige

### Nivel 2 — Álbum (Memories / api-ia)

```
Album
  └── AlbumMember[]
        └── { userId, role: "owner" | "admin" | "editor" | "viewer" }
```

**Ya existe un sistema de roles dentro del álbum.**

---

## La solución correcta (simple)

### El "profesional" ya existe — es el `owner` del álbum

No necesitamos un nuevo tipo de usuario. El fotógrafo crea el álbum → es `owner`. Sus clientes son `viewer`. Sus colaboradores pueden ser `editor` o `admin`.

### La protección de fotos usa los roles existentes

| Rol en el álbum | Marca de agua | Puede imprimir |
|---|---|---|
| `owner` / `admin` | No | Sí |
| `editor` | Sí | No |
| `viewer` / anónimo | Sí | No |

**Implementación:** En el visor de fotos (`/album/[shareToken]`), si el `userId` del visitante tiene rol `owner` o `admin` en ese álbum → sin watermark. Si no → watermark.

### El módulo "memories" se añade al sistema de permisos del evento

En lugar de crear un sistema paralelo, añadir `"memories"` como módulo más en el sistema de colaboradores del evento:

```
{ title: "memories", value: "edit" | "view" | "none" }
```

- El fotógrafo invitado como colaborador con `memories: "edit"` → puede subir, ver sin watermark
- El cliente invitado con `memories: "view"` → ve con watermark, no puede subir

---

## Qué hay que deshacer

1. **`packages/memories`** — Eliminar `ProfessionalProfile`, `ProfessionalSpecialty`, acciones de perfil del store
2. **`memories-web/pages/app/profile/`** — Eliminar página de editor de perfil
3. **`memories-web/pages/pro/[slug].tsx`** — Eliminar portfolio público
4. **Backend api-ia** — Eliminar endpoints `/professionals/*` y colección `professional_profiles`
5. **Nav del dashboard** — Quitar link "Mi perfil"

## Qué hay que añadir (sobre lo que ya existe)

1. En `memories_endpoints.py`: el endpoint que sirve las fotos **verifica el rol del visitante** en el álbum antes de devolver la URL (o añade el parámetro `?watermark=true` para que R2 sirva la versión con marca de agua)
2. En `memories-web/pages/album/[shareToken].tsx`: el visor de fotos aplica watermark CSS si el visitante no es `owner`/`admin`
3. En `appEventos`: añadir `"memories"` como módulo en el selector de permisos de colaboradores

---

## Coordinación con api2 y appEventos

- **api2**: No requiere cambios — el sistema de `compartido_array` + `permissions[]` ya soporta cualquier módulo
- **appEventos**: Solo añadir `"memories"` al listado de módulos en el componente de gestión de colaboradores
- **api-ia / Memories**: Solo usar el `AlbumMember.role` existente para decidir watermark

---

## Diagrama simplificado

```
Fotógrafo crea álbum (role: owner)
    ↓
Comparte enlace con cliente
    ↓
Cliente abre álbum (no está en AlbumMember → viewer anónimo)
    → Ve fotos con marca de agua
    → No puede imprimir sin marca de agua

Propietario abre álbum (role: owner)
    → Ve fotos SIN marca de agua
    → Puede imprimir sin marca de agua
```

**Sin nueva colección. Sin nuevo tipo de usuario. Usando lo que ya tenemos.**
