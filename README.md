> Equipo: consultar [reparto vigente y cuatro prompts](docs/equipo/00-coordinacion.md). El integrante 1 es Laureano.

> Actualización multirrefugio: consultar [implementación, roles y actualización](docs/10-multirrefugio.md). Las referencias a un refugio único y al estado previo de los PR pertenecen a la etapa inicial.

# Huella · Proyecto Final UTN

Plataforma de gestión de refugio y adopciones: Laravel 12, React 18, Inertia 2, TypeScript, Tailwind CSS 4, Vite 7 y MySQL. Identidad visual provisional y datos demo claramente identificados.

Implementa autenticación por sesión, tres roles, catálogo filtrado, perfiles con galería, solicitudes y evaluación, adopción definitiva, administración de animales y fotografías, historia clínica y dashboard con datos persistentes. La aprobación y la adopción definitiva son operaciones distintas, protegidas mediante transacciones y bloqueo del animal.

## Ejecutar localmente

Requisitos: PHP >=8.2 con extensiones Laravel/PDO MySQL/ZIP, Composer 2, Node 24 y MySQL/MariaDB. Los siguientes pasos son para una **carpeta y base nuevas**. En una instalación existente conservar `.env`, APP_KEY y Storage; respaldar y probar la actualización en una copia antes de aplicar migraciones.

```powershell
composer install
npm ci
Copy-Item .env.example .env
# Configurar en .env las credenciales y puerto reales de MySQL
php artisan key:generate
php artisan migrate
php artisan storage:link
# Opcional: definir DEMO_PASSWORD (mínimo 12 caracteres) en .env
php artisan db:seed --class=DemoSeeder
php artisan serve
```

En otra terminal ejecutar `npm run dev` y abrir http://localhost:8000. Con `npm run build` se pueden usar los recursos compilados sin mantener Vite en ejecución.

Cuentas demo: `admin@huella.test` y `adoptante@huella.test`; contraseña elegida en DEMO_PASSWORD. DemoSeeder solo funciona en local/testing y no crea superadministradores. Crear explícitamente el primer superadministrador con `php artisan shelter:create-staff`, elegir `superadmin`; luego crea refugios y sus administradores desde su panel. No hay perfil veterinario ni contraseña fija versionada.

## Verificar

```powershell
php artisan test
npm run test:frontend
npm run build
php vendor/laravel/pint/builds/pint --test
```

Por defecto los tests usan SQLite en memoria **solo para testing**. La aplicación usa MySQL. Para probar sobre MySQL usar una base exclusiva terminada en `_testing`; la guía de instalación detalla las variables. CI ejecuta la suite con MySQL 8.4.

## Documentación

- [Descripción y alcance](docs/01-descripcion-sistema.md)
- [Requerimientos y permisos](docs/02-requerimientos.md)
- [Casos de uso y flujo principal](docs/03-casos-de-uso.md)
- [Base de datos y diagrama ER](docs/04-base-de-datos.md)
- [Arquitectura y seguridad](docs/05-arquitectura.md)
- [Instalación XAMPP, Apache opcional y testing](docs/06-instalacion.md)
- [Estado de implementación y pendientes](docs/07-plan-de-desarrollo.md)
- [Distribución de cuatro integrantes y secuencia de integración](docs/08-distribucion-equipo.md)
- [Revisión funcional y matriz visual manual](docs/09-revision-plataforma.md)
- [Informe de ejecución](docs/informe-ejecucion.md)
- [Contribuir mediante ramas y PRs](CONTRIBUTING.md)
- [Créditos de fotografías demo](docs/creditos-imagenes.md)
- [Cumplimiento de dosis, auditoría y contratos de salud](docs/13-salud-agenda-entrega.md)
- [Respaldo/restauración y preparación de publicación](docs/14-operacion-y-publicacion.md)

## Política de adopciones

Nueva → En revisión → Aprobada → Adoptado. También se permite aprobar o rechazar desde Nueva; una aprobación puede rechazarse si no se concreta. Rechazada y Adoptado son terminales. Una aprobación reserva al animal sin crear adopción. Registrar Adoptado crea la adopción y cierra otras solicitudes activas con motivo visible e historial. Nunca se permiten dos aprobaciones o adopciones para un mismo animal. El archivo lógico de animales conserva los antecedentes.

## Límites de esta entrega

Es una implementación inicial funcional, pendiente de revisión visual en navegador/dispositivos y validación con el refugio. No incluye despliegue, notificaciones por email de cambios de solicitud ni cancelación/readopción. El correo de recuperación usa el log local hasta configurar SMTP. Ver el plan de desarrollo para las limitaciones detalladas.

Laravel 12 se eligió por compatibilidad con PHP 8.2 de XAMPP; consultar las [versiones soportadas de Laravel](https://laravel.com/docs/12.x/releases). La integración sigue el [adaptador oficial Inertia para Laravel](https://github.com/inertiajs/inertia-laravel).
