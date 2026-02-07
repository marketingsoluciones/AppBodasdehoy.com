# 🚀 Siguientes Pasos - Proyecto Copilot

**Fecha**: 25 de Enero, 2026  
**Estado Actual**: ✅ Tests corregidos (41/41 pasando)

---

## 📋 Checklist de Próximos Pasos

### 🔴 Prioridad Alta (Bloqueantes)

#### 1. Resolver Problema de Permisos EPERM en macOS
**Problema**: macOS bloquea conexiones de red, impidiendo levantar el servidor.

**Pasos para resolver**:
```bash
# 1. Verificar permisos de Terminal/Cursor
# Ir a: Preferencias del Sistema → Seguridad y Privacidad → Accesibilidad
# Asegurar que Terminal/Cursor tiene permisos completos

# 2. Verificar Firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 3. Si el firewall está activo, agregar excepciones
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Cursor.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# 4. Alternativa: Usar localhost en lugar de 0.0.0.0
# Modificar next.config.js para usar localhost
```

**Archivo a modificar**: `apps/copilot/next.config.js` o `apps/copilot/next.config.ts`

**Verificación**:
```bash
cd apps/copilot
pnpm dev
# Debe iniciar sin errores EPERM
```

---

#### 2. Actualizar Versión de Node.js
**Problema**: Proyecto requiere Node.js 20.x o 21.x, actualmente usando v24.9.0.

**Pasos para resolver**:
```bash
# 1. Instalar nvm si no está instalado
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. Instalar Node.js 20 LTS
nvm install 20
nvm use 20

# 3. Verificar versión
node --version  # Debe mostrar v20.x.x

# 4. Crear archivo .nvmrc en la raíz del proyecto
echo "20" > .nvmrc

# 5. Configurar uso automático (opcional)
# Agregar a ~/.zshrc o ~/.bashrc:
# autoload -U add-zsh-hook
# load-nvmrc() {
#   if [[ -f .nvmrc && -r .nvmrc ]]; then
#     nvm use
#   fi
# }
# add-zsh-hook chpwd load-nvmrc
```

**Verificación**:
```bash
node --version  # Debe ser v20.x.x
pnpm --version  # Debe funcionar correctamente
```

---

### 🟡 Prioridad Media (Importantes)

#### 3. Ejecutar Suite Completa de Tests
**Objetivo**: Verificar que todos los tests del proyecto funcionan correctamente.

**Pasos**:
```bash
cd apps/copilot

# Ejecutar todos los tests de la aplicación
pnpm test-app

# Ejecutar tests del servidor (si existen)
pnpm test-server

# Ejecutar tests E2E (requiere servidor corriendo)
pnpm test:e2e:smoke

# Generar reporte de cobertura
pnpm test-app:coverage
```

**Resultado esperado**: Todos los tests pasando sin errores.

---

#### 4. Verificar que el Servicio se Levanta Correctamente
**Objetivo**: Asegurar que el servicio de desarrollo funciona.

**Pasos**:
```bash
cd apps/copilot

# Opción 1: Puerto por defecto (3210)
pnpm dev

# Opción 2: Puerto alternativo (8000)
pnpm dev:fast

# Verificar que responde
curl http://localhost:3210
# o
curl http://localhost:8000
```

**Resultado esperado**: Servidor respondiendo con código 200.

---

#### 5. Integrar Tests en CI/CD
**Objetivo**: Automatizar ejecución de tests en cada commit/PR.

**Archivos a crear/modificar**:
- `.github/workflows/test.yml` (si no existe)
- Configurar ejecución de tests en pipeline

**Ejemplo de workflow**:
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test-app
      - run: pnpm test-server
```

---

### 🟢 Prioridad Baja (Mejoras)

#### 6. Expandir Cobertura de Tests
**Objetivo**: Aumentar cobertura de código con más tests.

**Áreas a cubrir**:
- Componentes sin tests
- Hooks sin tests
- Utilidades sin tests
- Stores sin tests completos

**Comando para verificar cobertura**:
```bash
pnpm test-app:coverage
```

---

#### 7. Optimizar Configuración de Tests
**Objetivo**: Mejorar velocidad y confiabilidad de tests.

**Mejoras posibles**:
- Paralelización de tests
- Mocking más eficiente
- Setup/teardown optimizados
- Timeouts ajustados

---

#### 8. Documentar Proceso de Testing
**Objetivo**: Crear guía para desarrolladores.

**Documentos a crear**:
- `docs/TESTING.md` - Guía de testing
- `docs/CONTRIBUTING.md` - Guía de contribución (si no existe)
- Ejemplos de tests para nuevos componentes

---

## 🔍 Verificaciones Post-Corrección

### Checklist de Verificación

- [ ] Servidor se levanta sin errores EPERM
- [ ] Node.js versión correcta (20.x o 21.x)
- [ ] Todos los tests pasan (41/41)
- [ ] Suite completa de tests ejecuta correctamente
- [ ] Cobertura de tests > 70%
- [ ] Tests integrados en CI/CD
- [ ] Documentación actualizada

---

## 📊 Métricas de Éxito

### Objetivos a Alcanzar

1. **Tests**: 100% de tests pasando ✅ (Completado)
2. **Servidor**: Levanta sin errores ⏳ (Pendiente - EPERM)
3. **Node.js**: Versión correcta ⏳ (Pendiente)
4. **CI/CD**: Tests automatizados ⏳ (Pendiente)
5. **Cobertura**: > 70% ⏳ (Pendiente)

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Levantar servicio
cd apps/copilot && pnpm dev

# Ejecutar tests específicos
pnpm test-app src/path/to/test.ts

# Ejecutar tests con watch mode
pnpm test-app --watch

# Ver cobertura
pnpm test-app:coverage
```

### Debugging
```bash
# Ver logs detallados
DEBUG=* pnpm dev

# Ejecutar tests con más información
pnpm test-app --reporter=verbose

# Verificar puertos en uso
lsof -i :3210
lsof -i :8000
```

---

## 📝 Notas Importantes

1. **Problema EPERM**: Es específico de macOS y puede requerir permisos de administrador
2. **Node.js**: Es importante usar la versión correcta para evitar incompatibilidades
3. **Tests**: Todos los tests corregidos están funcionando, pero hay más tests en el proyecto que pueden necesitar atención
4. **CI/CD**: La integración ayudará a detectar problemas temprano

---

## 🎯 Priorización Recomendada

1. **Primero**: Resolver EPERM y Node.js (bloqueantes)
2. **Segundo**: Verificar suite completa de tests
3. **Tercero**: Integrar en CI/CD
4. **Cuarto**: Expandir cobertura y optimizar

---

**Última actualización**: 2026-01-25 09:10 UTC  
**Estado**: Tests corregidos ✅ | Servidor pendiente ⏳
