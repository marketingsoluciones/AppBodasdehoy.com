# Listado de iconos en el chat (chat-ia) y guía para crear unos más adecuados

Este documento recopila **dónde se muestran iconos** en la interfaz del chat y **cómo cambiarlos o añadir nuevos** (Lucide, Ant Design Icons, SVGs custom y `@lobehub/icons`).

---

## 1. Barra lateral (Sidebar) – navegación principal

**Archivo:** `src/app/[variants]/(main)/_layout/Desktop/SideBar/TopActions.tsx`

| Ruta / función      | Icono (Lucide) | Variable / uso |
|---------------------|----------------|----------------|
| Chat                | `MessageSquare` | Tab Chat |
| Base de conocimiento | `FolderClosed` | Tab Knowledge |
| Imagen IA           | `Palette`      | Tab Image |
| Recuerdos (Memories)| `Images`       | Tab Memories |
| Bandeja de mensajes | `Inbox`        | Tab Messages |
| Creador de bodas    | `Heart`        | Tab Wedding Creator |
| Descubrir (Discover)| `Compass`      | Tab Discover |

**Cómo cambiar:** Editar el `icon={...}` del `ActionIcon` correspondiente. Hay un comentario `// TODO Change icons` en el componente.

```tsx
import { MessageSquare, FolderClosed, Palette, Images, Inbox, Heart, Compass } from 'lucide-react';
// Sustituir por otro icono de lucide-react, por ejemplo:
import { MessageCircle, BookOpen, Brush, ImageIcon, Mail, Heart, Compass } from 'lucide-react';
```

---

## 2. Barra de acciones del input de chat (ActionBar)

Cada acción es un componente en `src/features/ChatInput/ActionBar/`. Iconos usados:

| Acción        | Archivo              | Icono (Lucide u otro) | Notas |
|---------------|----------------------|------------------------|-------|
| Modelo        | `Model/index.tsx`    | `Infinity` (modo auto), `ModelIcon` (@lobehub/icons) | Selector de modelo |
| Base conocimiento | `Knowledge/index.tsx` | `LibraryBig` | |
| Búsqueda      | `Search/index.tsx`   | `Globe` / `GlobeOffIcon` | Según si búsqueda está activa |
| Subir archivo | `Upload/ClientMode.tsx`, `Upload/ServerMode.tsx` | `FileUp`, `LucideImage`, `ImageUp`, `FolderUp`, `Paperclip` | |
| STT (voz)     | `STT/common.tsx`     | `Mic` / `MicOff` | |
| Mención       | `Mention/index.tsx`  | `AtSign` | |
| Parámetros    | `Params/index.tsx`   | `SlidersHorizontal` | |
| Herramientas  | `Tools/index.tsx`, `Tools/useControls.tsx` | `Blocks`, `Store`, `ToyBrick`, `ArrowRight` | |
| Guardar tema | `SaveTopic/index.tsx`| `LucideGalleryVerticalEnd` / `LucideMessageSquarePlus` | Según si hay tema |
| Borrar        | `Clear/index.tsx`   | `Eraser` | |
| Historial     | `History/index.tsx`  | `Timer` / `TimerOff` | |
| Tipografía    | `Typo/index.tsx`     | `TypeIcon` | Abre TypoBar |

**Config de acciones:** `src/features/ChatInput/ActionBar/config.ts` (orden y qué acciones se muestran).

---

## 3. Menú de envío (Enter / Cmd+Enter / Añadir mensaje IA o usuario)

**Archivo:** `src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/useSendMenuItems.tsx`

| Opción              | Icono (Lucide)     |
|---------------------|--------------------|
| Enviar con Enter    | `LucideCheck`      |
| Enviar con Cmd+Enter| `LucideCheck`      |
| Añadir mensaje IA   | `BotMessageSquare` |
| Añadir mensaje usuario | `MessageSquarePlus` |

---

## 4. Barra de formato (TypoBar) – negrita, listas, código, etc.

**Archivo:** `src/features/ChatInput/TypoBar/index.tsx`

| Función     | Icono (Lucide) |
|-------------|----------------|
| Negrita     | `BoldIcon` |
| Cursiva     | `ItalicIcon` |
| Subrayado   | `UnderlineIcon` |
| Tachado     | `StrikethroughIcon` |
| Lista viñetas | `ListIcon` |
| Lista numerada | `ListOrderedIcon` |
| Lista de tareas | `ListTodoIcon` |
| Cita        | `MessageSquareQuote` |
| Fórmula     | `SigmaIcon` |
| Código inline | `CodeXmlIcon` |
| Bloque código | `SquareDashedBottomCodeIcon` |

---

## 5. Comandos slash del editor (/, h1, tabla, etc.)

**Archivo:** `src/features/ChatInput/InputEditor/useSlashItems.tsx`

| Comando | Icono (Lucide)   |
|---------|------------------|
| H1      | `Heading1Icon`   |
| H2      | `Heading2Icon`   |
| H3      | `Heading3Icon`   |
| Línea horizontal | `MinusIcon` |
| Tabla   | `Table2Icon`     |
| Fórmula (TeX) | `SigmaIcon` |

---

## 6. Selector de modelo y etiquetas de capacidades

**Archivo:** `src/components/ModelSelect/index.tsx`

- **Modo auto:** `Infinity`
- **Modelo concreto:** `ModelIcon` de `@lobehub/icons` (por modelo).
- **Proveedor:** `ProviderIcon` de `@lobehub/icons`.

Etiquetas de capacidades del modelo (tags):

| Capacidad        | Icono (Lucide)  |
|------------------|-----------------|
| Archivos         | `LucidePaperclip` |
| Salida imagen    | `LucideImage`   |
| Visión           | `LucideEye`     |
| Video            | `Video`         |
| Function call    | `ToyBrick`      |
| Razonamiento     | `AtomIcon`      |
| Búsqueda         | `LucideGlobe`   |
| Ventana contexto| `Infinity` (si es ∞) |

**Archivo tipos de modelo (Discover):** `src/app/[variants]/(main)/discover/(list)/model/features/List/ModelTypeIcon.tsx`

| Tipo modelo | Icono (Lucide)        |
|-------------|------------------------|
| chat        | `MessageSquareTextIcon` |
| embedding   | `BoltIcon`            |
| image       | `ImageIcon`           |
| realtime    | `PhoneIcon`           |
| stt         | `MicIcon`             |
| text2music  | `MusicIcon`           |
| text2video  | `VideoIcon`           |
| tts         | `AudioLines`          |

---

## 7. Configuración del agente (tabs)

**Archivo:** `src/features/AgentSetting/AgentCategory/useCategory.tsx`

| Pestaña   | Icono (Lucide)   |
|-----------|-------------------|
| Meta      | `UserCircle`      |
| Prompt    | `Bot`             |
| Apertura  | `Handshake`       |
| Chat      | `MessagesSquare`  |
| Modal     | `BrainCog`        |
| TTS       | `Mic2`            |
| Plugin    | `Blocks`          |

---

## 8. Canales y mensajes externos

**ChannelIcon (SVG inline):** `src/app/[variants]/(main)/chat/@session/features/SessionListContent/ConversationHistory/ChannelIcon.tsx`

- WhatsApp, Instagram, Facebook, Telegram: SVGs propios en el `switch (canal)`.
- Por defecto: icono de “globo” (web).

**ChannelBadge (emojis):** `src/app/[variants]/(main)/messages/components/ChannelBadge.tsx`

- email: 📧  
- instagram: 📷  
- telegram: ✈️  
- whatsapp: 📱  

Para “unos más adecuados” puedes sustituir estos emojis por componentes `Icon` con Lucide (por ejemplo `Mail`, `Camera`, `Send`, `MessageCircle`) o SVGs.

---

## 9. Otros iconos repartidos por la app

- **GuestWelcomeMessage:** `UserAddOutlined`, `PhoneOutlined` (Ant Design Icons).
- **Login:** `CloseOutlined`, `FacebookOutlined`, `GoogleOutlined`, `LockOutlined`, `MailOutlined` (Ant Design).
- **Colapso de grupos de sesión:** `MoreVertical`, `PencilLine`, `Plus`, `Settings2`, `Trash`, `UsersRound` (Lucide).
- **Thinking/Orchestrator:** `StopCircle` (Lucide).
- **Header chat móvil:** `ChevronDown`, `MessageSquarePlus`, etc.

---

## 10. Cómo crear o cambiar iconos

### Opción A: Usar otro icono de Lucide

1. Buscar en [lucide.dev](https://lucide.dev/icons/) el nombre del icono (ej. `MessageCircle`).
2. Importar en el archivo correspondiente:
   ```tsx
   import { MessageCircle } from 'lucide-react';
   ```
3. Sustituir en el componente:
   ```tsx
   icon={MessageCircle}
   ```
   o `<Icon icon={MessageCircle} size={20} />` según el patrón del componente.

### Opción B: Iconos de Ant Design

```tsx
import { MessageOutlined } from '@ant-design/icons';
// Uso típico: <MessageOutlined /> o icon={<MessageOutlined />}
```

### Opción C: Iconos de proveedor/modelo (LobeHub)

- `ModelIcon`, `ProviderIcon`, `ProviderCombine` de `@lobehub/icons`.
- Se usan por `id` de modelo o proveedor; no se “crean” a mano, pero puedes añadir proveedores custom con logo/avatar en la config.

### Opción D: SVG o componente custom

- Crear un componente que devuelva `<svg>...</svg>` (como en `ChannelIcon.tsx`).
- Usarlo donde ahora se usa `icon={...}` o dentro de un `Avatar`/`Icon` si el API lo permite.

### Opción E: Cambios masivos (ej. “más adecuados” para bodas)

1. **Sidebar:** En `TopActions.tsx` sustituir `MessageSquare`, `Heart`, `Images`, etc. por iconos que encajen con tu marca (por ejemplo `Heart` para bodas ya está; puedes cambiar Chat a algo como `MessageCircle` o `Bot`).
2. **ActionBar:** En cada `ActionBar/<Accion>/index.tsx` (o el archivo que use el icono) cambiar el import y la prop `icon`.
3. **Emojis de canal:** En `ChannelBadge.tsx` reemplazar los emojis por `<Icon icon={...} />` con Lucide o por un SVG/componente propio.
4. **Consistencia:** Usar el mismo estilo (solo Lucide, o solo Ant Design, o SVGs) en una misma zona para que se vea coherente.

---

## 11. Resumen de archivos clave

| Área              | Archivo(s) principal(es) |
|-------------------|---------------------------|
| Sidebar           | `_layout/Desktop/SideBar/TopActions.tsx` |
| ActionBar chat    | `features/ChatInput/ActionBar/*.tsx` y `config.ts` |
| Menú enviar       | `chat/.../ChatInput/Desktop/useSendMenuItems.tsx` |
| TypoBar           | `features/ChatInput/TypoBar/index.tsx` |
| Slash commands    | `features/ChatInput/InputEditor/useSlashItems.tsx` |
| Modelo / tags     | `components/ModelSelect/index.tsx` |
| Tipo de modelo    | `discover/(list)/model/features/List/ModelTypeIcon.tsx` |
| Tabs del agente   | `features/AgentSetting/AgentCategory/useCategory.tsx` |
| Canales (SVG)     | `.../ConversationHistory/ChannelIcon.tsx` |
| Badge canal (emojis) | `messages/components/ChannelBadge.tsx` |

Con este listado puedes localizar cualquier icono que se muestra en el chat y, a partir de aquí, crear unos más adecuados cambiando imports y props en los archivos indicados.
