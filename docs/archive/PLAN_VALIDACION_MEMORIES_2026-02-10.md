# ✅ Plan de Validación: Memories API

**Fecha**: 2026-02-10
**Backend Status**: ✅ COMPLETADO (13ms, 24 endpoints)
**Frontend Status**: ⏳ PENDIENTE VALIDACIÓN

---

## 🎯 Objetivo

Validar que el frontend de PLANNER AI se integra correctamente con Memories API implementada por el backend.

**Tiempo estimado**: 2-3 horas

---

## 📋 Fase 1: Verificación de Configuración (30 min)

### 1.1 Environment Variables

Verificar en `apps/copilot/.env`:

```bash
# Verificar estas variables existen
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_API_URL=https://api-ia.bodasdehoy.com
```

**Acción**:
```bash
cd apps/copilot
grep "PYTHON_BACKEND_URL" .env
grep "NEXT_PUBLIC_API_URL" .env
```

---

### 1.2 API Client Configuration

Verificar `apps/copilot/src/services/memories/api.ts`:

**Verificar**:
- ✅ Base URL apunta a api-ia
- ✅ Headers incluyen Authorization
- ✅ Headers incluyen X-Development: bodasdehoy
- ✅ Timeout configurado (30s)

**Ubicación**: [apps/copilot/src/services/memories/api.ts](apps/copilot/src/services/memories/api.ts)

---

## 📋 Fase 2: Testing de Endpoints Críticos (1 hora)

### 2.1 Listar Álbums (P0)

**Endpoint**: `GET /api/memories/albums`

**Testing**:
```typescript
// En consola del navegador o en test
const response = await fetch('https://api-ia.bodasdehoy.com/api/memories/albums', {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy'
  }
});
const data = await response.json();
console.log('Albums:', data);
```

**Verificar**:
- [ ] Status 200
- [ ] Response en <500ms (objetivo: 13ms)
- [ ] Lista de álbums retornada
- [ ] Paginación funciona

---

### 2.2 Ver Detalle de Álbum (P0)

**Endpoint**: `GET /api/memories/albums/{albumId}`

**Testing**:
```typescript
const albumId = 'xxx'; // Usar ID real del paso anterior
const response = await fetch(`https://api-ia.bodasdehoy.com/api/memories/albums/${albumId}`, {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy'
  }
});
const album = await response.json();
console.log('Album detail:', album);
```

**Verificar**:
- [ ] Status 200
- [ ] Response en <300ms
- [ ] Detalle completo del álbum
- [ ] Campos esperados presentes

---

### 2.3 Ver Fotos del Álbum (P0)

**Endpoint**: `GET /api/memories/albums/{albumId}/media`

**Testing**:
```typescript
const response = await fetch(`https://api-ia.bodasdehoy.com/api/memories/albums/${albumId}/media`, {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy'
  }
});
const media = await response.json();
console.log('Album media:', media);
```

**Verificar**:
- [ ] Status 200
- [ ] Response en <500ms
- [ ] Lista de fotos retornada
- [ ] URLs de imágenes accesibles

---

### 2.4 Ver Miembros del Álbum (P0)

**Endpoint**: `GET /api/memories/albums/{albumId}/members`

**Testing**:
```typescript
const response = await fetch(`https://api-ia.bodasdehoy.com/api/memories/albums/${albumId}/members`, {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy'
  }
});
const members = await response.json();
console.log('Album members:', members);
```

**Verificar**:
- [ ] Status 200
- [ ] Response rápida
- [ ] Lista de miembros retornada

---

## 📋 Fase 3: Testing de Funcionalidades Altas (1 hora)

### 3.1 Crear Álbum (P1)

**Endpoint**: `POST /api/memories/albums`

**Testing**:
```typescript
const response = await fetch('https://api-ia.bodasdehoy.com/api/memories/albums', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test Album - Validación',
    description: 'Album de prueba para validar integración',
    eventType: 'wedding',
    eventDate: '2026-06-15'
  })
});
const newAlbum = await response.json();
console.log('Created album:', newAlbum);
```

**Verificar**:
- [ ] Status 201
- [ ] Response en <500ms
- [ ] Álbum creado exitosamente
- [ ] ID retornado

---

### 3.2 Subir Foto (P1)

**Endpoint**: `POST /api/memories/albums/{albumId}/media`

**Testing**:
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('caption', 'Foto de prueba');

const response = await fetch(`https://api-ia.bodasdehoy.com/api/memories/albums/${albumId}/media`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy'
  },
  body: formData
});
const media = await response.json();
console.log('Uploaded media:', media);
```

**Verificar**:
- [ ] Status 201
- [ ] Upload exitoso
- [ ] URL de imagen retornada
- [ ] Imagen visible

---

### 3.3 Invitar Miembro (P1)

**Endpoint**: `POST /api/memories/albums/{albumId}/members`

**Testing**:
```typescript
const response = await fetch(`https://api-ia.bodasdehoy.com/api/memories/albums/${albumId}/members`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'X-Development': 'bodasdehoy',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    role: 'viewer'
  })
});
const member = await response.json();
console.log('Invited member:', member);
```

**Verificar**:
- [ ] Status 201
- [ ] Invitación enviada
- [ ] Miembro agregado a lista

---

## 📋 Fase 4: Testing de UI (30 min)

### 4.1 Página de Memories

**Ubicación**: `apps/copilot/src/app/[variants]/(main)/memories/page.tsx`

**Verificar manualmente**:
1. [ ] Navegar a `/memories`
2. [ ] Lista de álbums se carga
3. [ ] Loading state funciona
4. [ ] No hay errores en consola
5. [ ] Performance es buena (<1s total)

---

### 4.2 Crear Álbum desde UI

**Verificar**:
1. [ ] Click en "Crear Álbum"
2. [ ] Modal se abre
3. [ ] Llenar formulario
4. [ ] Submit funciona
5. [ ] Álbum aparece en lista inmediatamente

---

### 4.3 Ver Álbum

**Verificar**:
1. [ ] Click en álbum
2. [ ] Detalle se carga rápido
3. [ ] Fotos se muestran correctamente
4. [ ] Miembros se listan
5. [ ] Acciones disponibles (editar, eliminar)

---

### 4.4 Subir Foto desde UI

**Verificar**:
1. [ ] Click en "Subir Foto"
2. [ ] Selector de archivo funciona
3. [ ] Preview se muestra
4. [ ] Upload completa exitosamente
5. [ ] Foto aparece en álbum inmediatamente

---

## 📋 Fase 5: Performance Testing (30 min)

### 5.1 Verificar Tiempos de Respuesta

**Con Chrome DevTools Network**:

| Endpoint | Tiempo esperado | Tiempo real | Status |
|----------|-----------------|-------------|--------|
| GET /albums | <50ms | ___ ms | ___ |
| GET /albums/{id} | <300ms | ___ ms | ___ |
| GET /albums/{id}/media | <500ms | ___ ms | ___ |
| POST /albums | <500ms | ___ ms | ___ |

**Objetivo**: Todos <500ms

---

### 5.2 Verificar Caché

**Testing**:
1. Hacer request a `/albums`
2. Medir tiempo (primera vez)
3. Repetir mismo request inmediatamente
4. Medir tiempo (segunda vez - debe ser más rápido por caché)

**Resultado esperado**: Segunda llamada 5-10x más rápida

---

## 📋 Fase 6: Error Handling (30 min)

### 6.1 Errores de Red

**Simular**:
- [ ] Desconectar internet
- [ ] Verificar mensaje de error amigable
- [ ] Verificar retry logic funciona

---

### 6.2 Errores de Autenticación

**Simular**:
- [ ] Token inválido
- [ ] Verificar redirect a login
- [ ] Verificar mensaje de error

---

### 6.3 Errores de Servidor

**Simular**:
- [ ] Request a endpoint inexistente
- [ ] Verificar error 404 manejado
- [ ] Verificar mensaje de error claro

---

## ✅ Checklist Final

### Configuración
- [ ] Environment variables correctas
- [ ] API client configurado
- [ ] Headers correctos

### Endpoints Críticos (P0)
- [ ] GET /albums - Lista álbums (<50ms)
- [ ] GET /albums/{id} - Detalle (<300ms)
- [ ] GET /albums/{id}/media - Fotos (<500ms)
- [ ] GET /albums/{id}/members - Miembros (<500ms)

### Endpoints Altos (P1)
- [ ] POST /albums - Crear álbum
- [ ] POST /albums/{id}/media - Subir foto
- [ ] POST /albums/{id}/members - Invitar miembro

### UI
- [ ] Página /memories funciona
- [ ] Crear álbum desde UI
- [ ] Ver álbum funciona
- [ ] Subir foto desde UI

### Performance
- [ ] Todos los endpoints <500ms
- [ ] Caché funciona correctamente
- [ ] UI responde rápido

### Error Handling
- [ ] Errores de red manejados
- [ ] Errores de auth manejados
- [ ] Errores de servidor manejados

---

## 📊 Reporte de Resultados

### Template de Reporte

```markdown
# Reporte de Validación Memories API

**Fecha**: 2026-02-10
**Validador**: [Tu nombre]

## Resultados

### Endpoints (24 totales)
- ✅ Funcionando: X/24
- ❌ Con errores: Y/24
- ⏳ No probados: Z/24

### Performance
- Promedio general: ___ ms
- Más rápido: ___ ms (endpoint: ___)
- Más lento: ___ ms (endpoint: ___)

### Issues Encontrados
1. [Descripción del issue 1]
2. [Descripción del issue 2]

### Recomendaciones
1. [Recomendación 1]
2. [Recomendación 2]

## Conclusión

[✅ Sistema listo para producción] o [⚠️ Requiere ajustes]
```

---

## 🚀 Próximos Pasos

### Si validación exitosa ✅
1. Responder a backend confirmando integración
2. Habilitar Memories en producción
3. Comunicar a usuarios/stakeholders
4. Monitorear primeros días de uso

### Si hay issues ⚠️
1. Documentar issues encontrados
2. Reportar a backend con detalles
3. Coordinar fixes necesarios
4. Re-validar después de fixes

---

**Preparado por**: Claude Code
**Fecha**: 2026-02-10
**Estado**: ⏳ **LISTO PARA EJECUTAR**
