# 🔑 Cómo Obtener Token de Firebase

**Tiempo**: 2 minutos
**Necesario para**: Validar endpoints que requieren autenticación

---

## 🎯 Pasos Rápidos

### 1. Abrir la Aplicación

Ir a: http://localhost:3210

---

### 2. Hacer Login

Si no estás logueado, hacer login con tu cuenta de Firebase.

---

### 3. Abrir DevTools

**Mac**: `Cmd + Option + I`
**Windows/Linux**: `F12` o `Ctrl + Shift + I`

---

### 4. Ir a la Pestaña "Console"

Clic en la pestaña **"Console"** en DevTools

---

### 5. Copiar y Pegar este Código

```javascript
// Script para obtener token de Firebase
(async () => {
  try {
    // Método 1: Usando firebase global
    if (typeof firebase !== 'undefined') {
      const user = firebase.auth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        console.log('✅ TOKEN DE FIREBASE:');
        console.log(token);
        console.log('\n📋 COPIAR EL TOKEN DE ARRIBA ↑\n');
        return;
      }
    }

    // Método 2: Buscar en localStorage/sessionStorage
    console.log('🔍 Buscando token en storage...');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('firebase')) {
        console.log('Clave:', key);
        const value = localStorage.getItem(key);
        if (value && value.length > 100) {
          console.log('Valor (primeros 50 chars):', value.substring(0, 50) + '...');
        }
      }
    }

    console.log('⚠️ No se encontró usuario de Firebase');
    console.log('Por favor asegúrate de estar logueado');

  } catch (error) {
    console.error('❌ Error al obtener token:', error);
  }
})();
```

---

### 6. Presionar Enter

El script se ejecutará y mostrará el token.

---

### 7. Copiar el Token

Verás algo como:

```
✅ TOKEN DE FIREBASE:
eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTk1M...
(muy largo, ~800-1000 caracteres)

📋 COPIAR EL TOKEN DE ARRIBA ↑
```

**Copiar todo el texto** que empieza con `eyJ...`

---

## 🚀 Usar el Token

### Opción A: Script de Node.js

```bash
FIREBASE_TOKEN="<token-copiado>" node test-memories-api.js
```

**Ejemplo**:
```bash
FIREBASE_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6..." node test-memories-api.js
```

---

### Opción B: Herramienta HTML

1. Abrir: [TEST_MEMORIES_API_2026-02-10.html](TEST_MEMORIES_API_2026-02-10.html)
2. Pegar token en el campo "Firebase Token"
3. Click "💾 Guardar Config"
4. Click "🚀 Ejecutar Todos los Tests"

---

## 🐛 Troubleshooting

### "firebase is not defined"

**Problema**: La aplicación no cargó Firebase todavía

**Solución**: Esperar unos segundos y volver a ejecutar el script

---

### "No se encontró usuario de Firebase"

**Problema**: No estás logueado

**Solución**:
1. Hacer login en http://localhost:3210
2. Volver a ejecutar el script

---

### "Token expired"

**Problema**: El token expira después de 1 hora

**Solución**: Volver a obtener un nuevo token con este mismo proceso

---

## 📱 Método Alternativo: Desde Código de la App

Si tienes acceso al código, puedes agregar temporalmente:

```typescript
// En cualquier componente después de login
useEffect(() => {
  const user = firebase.auth().currentUser;
  if (user) {
    user.getIdToken().then(token => {
      console.log('TOKEN:', token);
    });
  }
}, []);
```

---

## ⏱️ Validez del Token

- **Duración**: 1 hora
- **Renovación**: Automática por Firebase
- **Para testing**: Obtener nuevo token si expira

---

## 🎯 Próximo Paso

Una vez tengas el token, ejecutar:

```bash
FIREBASE_TOKEN="<tu-token>" node test-memories-api.js
```

Esto validará los 8 endpoints principales de Memories API.

---

**Creado**: 2026-02-10
**Tiempo estimado**: 2 minutos
**Dificultad**: ⭐ Fácil
