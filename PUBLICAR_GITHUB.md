# Instrucciones para Publicar en GitHub

## Paso 1: Crear el Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `aircall-ivr`
3. Descripción: "Sistema de enrutamiento de llamadas Aircall basado en contactos de HubSpot"
4. Elige si será público o privado
5. **NO marques** las opciones de inicializar con README, .gitignore o licencia
6. Haz clic en "Create repository"

## Paso 2: Conectar y Publicar

Una vez creado el repositorio, GitHub te mostrará comandos. Ejecuta estos comandos en tu terminal:

```bash
# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/aircall-ivr.git
git branch -M main
git push -u origin main
```

## Alternativa: Si ya tienes un repositorio existente

Si quieres usar un repositorio diferente, simplemente actualiza la URL:

```bash
git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPOSITORIO.git
git push -u origin main
```

## Verificar

Después del push, puedes verificar que todo esté correcto visitando:
`https://github.com/TU_USUARIO/aircall-ivr`

