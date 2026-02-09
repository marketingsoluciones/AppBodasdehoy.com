# Documentación de Testing y Automatización

Esta carpeta contiene toda la documentación relacionada con testing y automatización del proyecto, especialmente enfocada en el sistema de login compartido multi-marca.

## 📚 Índice de Documentación

### 1. [Automatización de Login con Google](./automated-login.md)
**Documentación principal completa** sobre cómo automatizar el proceso de login con Google usando las herramientas MCP del navegador de Cursor.

**Contenido:**
- ✅ Sistema Multi-Marca (Whitelabel) completo
- ✅ Sistema de Login Compartido - Reglas Fundamentales
  - Login compartido obligatorio entre subdominios
  - Registro compartido entre subdominios
  - Casos específicos entre diferentes dominios/marcas
- ✅ Subdominios Funcionales vs Técnicos
- ✅ Sistema de Bypass de Desarrollo
- ✅ Guía de uso del script de automatización
- ✅ Limitaciones y consideraciones

**Cuándo usar:** Cuando necesites entender cómo funciona el sistema de login compartido o automatizar el proceso de login.

---

### 2. [Análisis de Diferencias: Subdominios](./analisis-diferencias-subdominios.md)
**Análisis profundo** comparando la propuesta inicial de documentación con el sistema real de AppBodas.

**Contenido:**
- ✅ Comparación detallada entre propuesta y sistema real
- ✅ Identificación de diferencias críticas
- ✅ Recomendaciones de actualización
- ✅ Estado de implementación completada

**Cuándo usar:** Para entender las diferencias entre la propuesta inicial y el sistema implementado, o para referencia histórica.

---

### 3. [Ejemplos Prácticos de Automatización](../scripts/example-google-login-automation.mdc)
**Ejemplos paso a paso** de cómo usar el script de automatización en diferentes escenarios.

**Contenido:**
- ✅ Ejemplo completo de login con Google OAuth
- ✅ Ejemplo simplificado para uso rápido
- ✅ Ejemplo de uso de bypass para testing
- ✅ Ejemplo de login en subdominio funcional
- ✅ Ejemplo de verificación de sesión compartida
- ✅ Ejemplo de casos entre diferentes dominios/marcas

**Cuándo usar:** Cuando necesites ejemplos prácticos listos para copiar y usar.

---

## 🚀 Inicio Rápido

### Para Automatizar Login

1. **Lee la documentación principal:**
   ```bash
   # Abre: apps/copilot/docs/testing/automated-login.md
   ```

2. **Revisa los ejemplos prácticos:**
   ```bash
   # Abre: apps/copilot/scripts/example-google-login-automation.mdc
   ```

3. **Usa el script de automatización:**
   ```typescript
   import { automateGoogleLoginHelper } from './scripts/automate-google-login';
   
   await automateGoogleLoginHelper('https://www.bodasdehoy.com');
   ```

### Para Entender el Sistema de Login Compartido

1. **Lee la sección "Sistema de Login Compartido"** en `automated-login.md`
2. **Revisa la tabla de marcas y cookies** en `automated-login.md`
3. **Entiende los subdominios funcionales** en `automated-login.md`

---

## 📋 Conceptos Clave

### Sistema Multi-Marca
El proyecto soporta múltiples marcas (bodasdehoy, eventosorganizador, etc.) que comparten la misma aplicación pero con diferentes dominios.

### Login Compartido Obligatorio
Los subdominios del mismo dominio base **DEBEN** compartir un único login. Es un requisito del sistema, no opcional.

### Registro Compartido
Si te registras en un subdominio, automáticamente estás registrado en todos los subdominios del mismo dominio base.

### Subdominios Funcionales
Subdominios como `ticket`, `invitado`, `dev` que tienen routing especial y pueden redirigir automáticamente.

### Sistema de Bypass
Sistema de desarrollo que permite login rápido en entornos de test sin pasar por Google OAuth completo.

---

## 🔧 Scripts Disponibles

### `automate-google-login.ts`
Script principal de automatización con funciones para:
- Navegar a URLs
- Abrir modal de login
- Hacer clic en botón de Google
- Verificar sesión compartida
- Usar bypass de desarrollo

**Ubicación:** `apps/copilot/scripts/automate-google-login.ts`

---

## 📝 Notas Importantes

### Limitaciones Conocidas

1. **Popup de Google OAuth**: Requiere interacción manual para seleccionar cuenta y autorizar
2. **Seguridad**: Google puede detectar automatización y requerir verificación adicional
3. **Cookies/Sesiones**: El navegador MCP puede no mantener cookies entre sesiones

### Mejoras Implementadas

- ✅ Atributos `data-testid` agregados al modal y botones
- ✅ Función global `window.openLoginModal()` expuesta para testing
- ✅ Script de automatización con múltiples estrategias de selección
- ✅ Soporte para bypass de desarrollo
- ✅ Detección automática de subdominios funcionales
- ✅ Verificación de sesión compartida entre múltiples subdominios

---

## 🎯 Próximos Pasos Sugeridos

1. **Probar la automatización:**
   - Ejecutar el script en un entorno de desarrollo
   - Verificar que funciona correctamente con bypass
   - Probar login completo con Google OAuth

2. **Validar sesión compartida:**
   - Hacer login en un subdominio
   - Verificar que la sesión se comparte con otros subdominios
   - Probar navegación entre subdominios sin re-login

3. **Documentar casos específicos:**
   - Agregar ejemplos de casos específicos entre diferentes dominios/marcas
   - Documentar cualquier comportamiento especial encontrado

4. **Mejorar el script:**
   - Agregar más opciones de configuración si es necesario
   - Mejorar el manejo de errores
   - Agregar más validaciones

---

## 📞 Soporte

Si tienes preguntas o encuentras problemas:
1. Revisa la documentación principal (`automated-login.md`)
2. Consulta los ejemplos prácticos (`example-google-login-automation.mdc`)
3. Revisa el análisis de diferencias si necesitas entender cambios históricos

---

**Última actualización:** Diciembre 2024
**Estado:** ✅ Documentación completa e implementada
