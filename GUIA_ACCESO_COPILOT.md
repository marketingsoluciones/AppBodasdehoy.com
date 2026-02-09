# 🚀 Guía Rápida: Cómo Acceder al Copilot

El Copilot está **integrado como un sidebar** en la aplicación principal de Bodasdehoy.com.

---

## 📍 ¿Dónde está el Copilot?

El Copilot **NO** es una página independiente en `/copilot`.

El Copilot está **embebido como un panel lateral** que aparece en estas páginas:
- `/eventos` - Lista de eventos
- `/invitados` - Gestión de invitados
- `/presupuesto` - Control de presupuesto
- `/mesas` - Organización de mesas
- Y otras páginas de la app (excepto login, registro, copilot standalone)

---

## 🔑 Paso 1: Hacer Login

1. Abre tu navegador
2. Ve a: **http://localhost:8080/login**
3. Ingresa tus credenciales
4. Haz click en "Iniciar sesión"

---

## 📱 Paso 2: Acceder a una Página con el Copilot

Una vez logueado, ve a cualquiera de estas páginas:

### Opción A: Ir a Eventos
```
http://localhost:8080/eventos
```

### Opción B: Ir a Invitados
```
http://localhost:8080/invitados
```

### Opción C: Ir a Presupuesto
```
http://localhost:8080/presupuesto
```

---

## 💬 Paso 3: Abrir el Copilot Sidebar

Una vez en cualquiera de esas páginas:

### En Desktop (pantallas grandes)
El sidebar del Copilot estará **visible automáticamente** en el lado izquierdo ocupando un 20% del ancho.

### En Mobile o pantallas pequeñas
1. Busca el **botón del Copilot** (ícono de chat)
2. Haz click para abrir el panel flotante

---

## ✍️ Paso 4: Probar el Chat

Una vez que veas el sidebar del Copilot:

1. **Busca el input de chat** en la parte inferior del sidebar
2. **Escribe un mensaje**, por ejemplo:
   ```
   Hola, ¿cómo estás?
   ```
3. **Presiona Enter**
4. **Espera la respuesta** (aparecerá un loading indicator)
5. **Lee la respuesta del Copilot** (con markdown renderizado)

---

## 🧪 Mensajes de Prueba Sugeridos

### 1. Saludo Básico
```
Hola, ¿en qué puedes ayudarme?
```
**Esperado**: Respuesta amigable del Copilot presentándose

### 2. Consulta de Funcionalidades
```
¿Qué puedes hacer con los invitados?
```
**Esperado**: Lista de funcionalidades relacionadas con invitados

### 3. Navegación
```
Quiero ver mis invitados
```
**Esperado**: Link clickeable a `/invitados`

### 4. Acción
```
Agrega a Juan Pérez como invitado
```
**Esperado**: Confirmación o solicitud de más datos

---

## 🖼️ Cómo Se Ve el Copilot

```
┌────────────────────────────────────────────────────┐
│  [Bodasdehoy Header]                               │
├──────────┬─────────────────────────────────────────┤
│          │                                          │
│ COPILOT  │   Contenido Principal                   │
│ SIDEBAR  │   (Eventos, Invitados, etc.)            │
│          │                                          │
│  💬      │                                          │
│  ¡Hola!  │                                          │
│          │                                          │
│  [Chat]  │                                          │
│  [Input] │                                          │
│          │                                          │
└──────────┴─────────────────────────────────────────┘
   20%              80%
```

---

## 🔍 Troubleshooting

### Problema: "No veo el sidebar del Copilot"

**Posibles causas**:

1. **No estás logueado**
   - Solución: Ve a `/login` e inicia sesión

2. **Estás en una página excluida**
   - Las páginas `/copilot`, `/login`, `/registro` no muestran el sidebar
   - Solución: Ve a `/eventos` o `/invitados`

3. **Pantalla muy pequeña**
   - El sidebar puede estar oculto
   - Solución: Busca el botón flotante del chat

### Problema: "El chat no envía mensajes"

**Verificar**:

1. **Servidor corriendo**
   ```bash
   curl http://localhost:8080/api/copilot/chat
   ```

2. **Abrir consola del navegador** (F12)
   - Ver si hay errores en rojo

3. **Ver logs del servidor**
   ```bash
   tail -f /tmp/dev-chat-functional.log
   ```

---

## 📸 Script para Abrir Automáticamente

He creado un script que te ayudará:

```bash
# Ejecutar este comando:
node abrir-copilot-sidebar.mjs
```

Esto:
1. Abrirá el navegador
2. Te llevará a la página de eventos (donde está el sidebar)
3. Si no estás logueado, te mostrará el login
4. Dejará el navegador abierto para que pruebes

---

## ✅ Checklist Rápido

- [ ] Servidor corriendo en puerto 8080
- [ ] Navegador abierto en http://localhost:8080
- [ ] Login completado con credenciales válidas
- [ ] Navegaste a `/eventos`, `/invitados` u otra página con sidebar
- [ ] Ves el panel del Copilot en el lado izquierdo (o botón flotante)
- [ ] Escribiste "Hola" en el input del chat
- [ ] Presionaste Enter
- [ ] Viste el loading indicator (3 puntos)
- [ ] Recibiste la respuesta del Copilot
- [ ] La respuesta tiene formato markdown (links, negritas, etc.)

---

## 🎯 Resumen

**El Copilot NO es una página `/copilot` independiente.**

**El Copilot ES un sidebar integrado** que aparece en las páginas principales de la app después de hacer login.

**Para verlo**:
1. Login → http://localhost:8080/login
2. Eventos → http://localhost:8080/eventos
3. Ver sidebar izquierdo con el chat
4. Probar enviar "Hola"

---

**Última actualización**: 2026-02-08
**Archivo**: GUIA_ACCESO_COPILOT.md
