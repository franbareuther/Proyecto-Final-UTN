# Trabajo colaborativo

`main` es la rama estable. No hacer commits de funcionalidad ni merges automáticos sobre ella. Toda implementación se propone mediante Pull Request y se revisa por otro integrante.

## Preparar el entorno

```powershell
git clone https://github.com/franbareuther/Proyecto-Final-UTN.git
cd Proyecto-Final-UTN
composer install
npm ci
Copy-Item .env.example .env
```

Configurar MySQL de XAMPP y seguir [instalación](docs/06-instalacion.md). Luego ejecutar key:generate, migrate, storage:link y, si corresponde, DemoSeeder. Nunca usar datos demo en producción ni compartir .env. Consultar [arquitectura](docs/05-arquitectura.md) y [modelo de datos](docs/04-base-de-datos.md).

## Ramas y commits

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/catalogo-animales
# Implementar y comprobar cambios
git add resources/js/Pages/Public/Catalog.tsx
git diff --cached
git commit -m "feat: agregar filtro de tamaño al catálogo"
git push -u origin feature/catalogo-animales
```

Ramas sugeridas: `feature/autenticacion`, `feature/catalogo-animales`, `feature/solicitudes`, `feature/panel-administrativo`, `feature/modulo-veterinario`, `feature/dashboard`. Coordinar responsabilidades para no editar simultáneamente migraciones o componentes compartidos. Mantener commits por cambio lógico.

## Pull Requests

En GitHub elegir **Compare & pull request**, base `main`, rama de la funcionalidad. Describir problema, cambio de comportamiento, migraciones y validación. Adjuntar capturas si cambia la interfaz. Solicitar revisión a otro integrante. Esperar CI y resolver comentarios antes de integrar. No publicar credenciales, .env, vendor, node_modules ni archivos de base de datos.

## Actualizar una rama y resolver conflictos

```powershell
git fetch origin
git switch feature/catalogo-animales
git merge origin/main
```

Si hay conflictos, abrir los archivos marcados con `git status`, comparar ambas versiones y conservar la solución coherente. Retirar marcadores, probar y hacer `git add` de los archivos resueltos; completar con `git commit`. Para cancelar un merge en curso: `git merge --abort`. No usar reset destructivo ni push forzado sobre ramas compartidas. Resolver lockfiles con el gestor correspondiente y revisar sus diferencias.

## Migraciones y pruebas

Al actualizar una rama: `composer install`, `npm ci` y `php artisan migrate`. No modificar migraciones que el grupo ya aplicó; crear una nueva con `php artisan make:migration`. No ejecutar migrate:fresh en bases con datos importantes.

Antes del PR:

```powershell
vendor\bin\pint
php artisan test
npm run build
```

En Windows también se puede ejecutar `php vendor/laravel/pint/builds/pint`. La suite por defecto usa SQLite en memoria y no toca MySQL de la aplicación. Para probar MySQL, usar **exclusivamente** `refugio_animales_testing` siguiendo la guía. CI crea su propio MySQL efímero, ejecuta pruebas y build, sin despliegues automáticos.

Toda operación de adopción debe pasar por `AdoptionService`, que bloquea primero el animal. No duplicar transiciones en controllers o componentes React. La interfaz puede ocultar acciones, pero siempre deben existir permisos y validación de servidor.
