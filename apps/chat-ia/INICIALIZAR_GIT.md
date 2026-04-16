# Solución Recomendada para Git - Front-IA-Chat

## ✅ Solución Paso a Paso

### Paso 1: Usar Git Bash o CMD (Solución Inmediata)

**En lugar de PowerShell, usa una de estas opciones:**

**Opción A: Git Bash (Recomendado)**
1. Abre Git Bash (busca "Git Bash" en el menú de inicio)
2. Navega al proyecto: `cd /c/Users/Edo/TMK/Front-IA-Chat`
3. Ejecuta: `git status` para verificar si hay git
4. Si no hay git: `git init`

**Opción B: Símbolo del Sistema (CMD)**
1. Abre CMD (Win + R, escribe `cmd`)
2. Navega: `cd C:\Users\Edo\TMK\Front-IA-Chat`
3. Ejecuta: `git status`
4. Si no hay git: `git init`

### Paso 2: Inicializar Git en el Proyecto Front-IA-Chat

```bash
# Desde Git Bash o CMD
cd C:\Users\Edo\TMK\Front-IA-Chat

# Inicializar repositorio
git init

# Verificar estado
git status

# Agregar archivos
git add .

# Hacer primer commit
git commit -m "Initial commit"
```

### Paso 3: Configurar Git (si es la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

### Paso 4: (Opcional) Solucionar PowerShell Permanentemente

Si quieres seguir usando PowerShell en el futuro:

1. Abre PowerShell **como Administrador** (clic derecho → Ejecutar como administrador)
2. Ejecuta:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Confirma con "S" cuando te lo pida

## 🎯 ¿Por qué esta solución?

- **Git Bash/CMD**: Funciona inmediatamente sin cambiar configuraciones del sistema
- **Proyecto Front-IA-Chat**: Tu proyecto específico que quieres versionar
- **Seguro**: No requiere permisos de administrador para empezar
- **Rápido**: Puedes hacer commits en menos de 2 minutos

## 📝 Notas Importantes

- El proyecto Front-IA-Chat ya tiene un `.gitignore` configurado
- Es un proyecto grande con muchas dependencias, el primer `git add .` puede tardar un poco
- Si el proyecto ya estaba en un repositorio remoto, después de `git init` puedes agregar el remote:
  ```bash
  git remote add origin <URL_DEL_REPOSITORIO>
  ```
