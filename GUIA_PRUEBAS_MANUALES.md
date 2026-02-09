# 🧪 Guía de Pruebas Manuales - 2026-02-07

**Estado**: ✅ Servidor corriendo en http://localhost:8080
**PID**: 45387
**Navegador**: Chrome abierto

---

## 📋 Checklist de Pruebas

### ✅ Paso 1: Login
**Acción**: Hacer login con Firebase

1. En Chrome, buscar el botón de "Iniciar Sesión" o el icono de usuario
2. Click para abrir el formulario de login
3. Ingresar credenciales:
   - **Email**: bodasdehoy.com@gmail.com
   - **Password**: lorca2012M*+
4. Click en "Iniciar Sesión"
5. Esperar confirmación

**Resultado esperado**:
- ✅ Login exitoso
- ✅ Usuario autenticado visible en la interfaz
- ✅ Redirección a home o dashboard

**Problemas conocidos a ignorar**:
- ⚠️ Puede redirigir automáticamente - esto es normal
- ⚠️ El formulario puede cerrarse después del login - esto es normal

---

### ✅ Paso 2: Verificar Menú de Usuario
**Acción**: Abrir el dropdown del menú de usuario

1. Localizar el icono de usuario en la esquina superior derecha
2. Click en el icono de usuario
3. Verificar que el menú desplegable se abre

**Resultado esperado**:
- ✅ Menú se abre correctamente
- ✅ Opciones visibles (Mi perfil, Cerrar sesión, etc.)
- ✅ z-index correcto (menú está encima de todo)

**Fix aplicado**:
- Aumentado z-index de z-40 a z-[60] en [Profile.tsx:266](apps/web/components/DefaultLayout/Profile.tsx#L266)

---

### ✅ Paso 3: Seleccionar Evento
**Acción**: Seleccionar un evento de la lista

1. Navegar a la sección de eventos (si no estás ahí ya)
2. Verificar que hay eventos en la lista
3. Click en un evento para seleccionarlo

**Resultado esperado**:
- ✅ Lista de eventos visible
- ✅ Evento seleccionable
- ✅ Navegación correcta al evento

---

### ✅ Paso 4: Abrir Copilot
**Acción**: Abrir el Copilot y verificar el editor

1. Con un evento seleccionado, buscar el botón del Copilot
2. Click para abrir el Copilot
3. Verificar que el editor es visible

**Resultado esperado**:
- ✅ Panel del Copilot se abre
- ✅ Editor del Copilot visible
- ✅ **4 botones de acción visibles**:
  - 😊 Selector de emojis
  - 📎 Adjuntar archivos
  - </> Insertar código markdown
  - • Insertar lista markdown

---

### ✅ Paso 5: Probar Funcionalidades del Editor
**Acción**: Verificar que los botones funcionan

#### 5.1: Botón de Emojis (😊)
1. Click en el botón 😊
2. Verificar que se abre el selector de emojis
3. Click en un emoji
4. Verificar que se inserta en el textarea

**Resultado esperado**:
- ✅ Selector de emojis se abre
- ✅ 16 emojis disponibles
- ✅ Emoji se inserta correctamente

#### 5.2: Botón de Código (</>)
1. Click en el botón </>
2. Verificar que se insertan las backticks de markdown para código

**Resultado esperado**:
- ✅ Se inserta: ```\n\n```
- ✅ Cursor queda en posición correcta

#### 5.3: Botón de Lista (•)
1. Click en el botón •
2. Verificar que se inserta el símbolo de lista markdown

**Resultado esperado**:
- ✅ Se inserta: -
- ✅ Cursor queda después del guion

#### 5.4: Auto-resize del Textarea
1. Escribir varias líneas de texto
2. Verificar que el textarea crece automáticamente
3. Verificar que no crece más allá de 200px

**Resultado esperado**:
- ✅ Textarea crece con el contenido
- ✅ Máximo de 200px de altura
- ✅ Scroll vertical aparece cuando se excede

#### 5.5: Atajos de Teclado
1. Escribir texto en el editor
2. Presionar **Enter** (sin Shift)
3. Verificar comportamiento (¿envía mensaje o nueva línea?)
4. Presionar **Shift + Enter**
5. Verificar que inserta nueva línea

**Resultado esperado**:
- ✅ Enter envía mensaje (si está configurado así)
- ✅ Shift + Enter inserta nueva línea
- ✅ Atajos funcionan correctamente

---

## 🐛 Bugs Conocidos Resueltos

### 1. Overlay Bloqueando Clicks ✅
**Archivo**: [Loading.js:9-12](apps/web/components/DefaultLayout/Loading.js#L9-L12)
**Fix**: `pointer-events: none` en el overlay de loading
**Estado**: ✅ Resuelto en commit 55c80d7

### 2. Login Auto-Cierre ✅
**Archivo**: [login.js:63-95](apps/web/pages/login.js#L63-L95)
**Fix**: Auto-redirect comentado
**Estado**: ✅ Resuelto en commit ffa242a

### 3. Menú de Usuario No Responde ✅
**Archivo**: [Profile.tsx:266](apps/web/components/DefaultLayout/Profile.tsx#L266)
**Fix**: z-index aumentado de z-40 a z-[60]
**Estado**: ✅ Resuelto en commit ffa242a

### 4. Servidor HTTP 500 ✅
**Causa**: Archivos de build corruptos
**Fix**: Rebuild completo (`rm -rf .next && npm run build`)
**Estado**: ✅ Resuelto en commit 8a29346

---

## 📸 Screenshots a Tomar

Para documentar las pruebas, tomar screenshots de:

1. **Login exitoso**
   - Nombre: `screenshot-1-login-exitoso.png`
   - Qué mostrar: Usuario logueado, nombre visible

2. **Menú de usuario abierto**
   - Nombre: `screenshot-2-menu-usuario.png`
   - Qué mostrar: Dropdown abierto con opciones visibles

3. **Editor del Copilot**
   - Nombre: `screenshot-3-copilot-editor.png`
   - Qué mostrar: Los 4 botones claramente visibles

4. **Selector de emojis**
   - Nombre: `screenshot-4-selector-emojis.png`
   - Qué mostrar: Selector de emojis abierto

5. **Texto con emoji insertado**
   - Nombre: `screenshot-5-emoji-insertado.png`
   - Qué mostrar: Emoji correctamente insertado en el textarea

---

## 📊 Resultados

### Login
- [ ] Login exitoso
- [ ] Usuario autenticado visible
- [ ] Redirección correcta

### Menú de Usuario
- [ ] Menú se abre al hacer click
- [ ] Opciones visibles
- [ ] z-index correcto

### Copilot - Editor
- [ ] Panel del Copilot se abre
- [ ] Editor visible
- [ ] 4 botones visibles

### Copilot - Funcionalidades
- [ ] Botón 😊 funciona
- [ ] Botón 📎 visible (UI preparada)
- [ ] Botón </> funciona
- [ ] Botón • funciona
- [ ] Auto-resize funciona
- [ ] Atajos de teclado funcionan

---

## 🎯 Siguiente Paso Después de las Pruebas

Dependiendo de los resultados:

### Si TODO funciona ✅
1. Tomar screenshots
2. Documentar éxito
3. Crear commit final
4. Preparar Pull Request

### Si HAY problemas ❌
1. Documentar qué no funciona
2. Tomar screenshots del problema
3. Analizar logs de consola
4. Implementar fix
5. Re-probar

---

## 🔗 Links Útiles

- **Home**: http://localhost:8080/
- **Login**: http://localhost:8080/login
- **Debug Front**: http://localhost:8080/debug-front
- **Servidor Status**: `ps aux | grep "next dev" | grep -v grep`

---

## 📝 Notas

- El servidor está corriendo en localhost:8080
- Firebase Auth está configurado
- Todas las funcionalidades del editor están implementadas
- Tests automatizados creados (23/29 pasando)
- Documentación completa (~4,000 líneas)

---

**Fecha**: 2026-02-07
**Hora de inicio**: ~14:30
**Estado**: ✅ Listo para pruebas manuales
