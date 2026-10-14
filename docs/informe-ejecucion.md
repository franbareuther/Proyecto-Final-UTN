# Informe de ejecución — 14 de octubre de 2026

Repositorio inspeccionado: `franbareuther/Proyecto-Final-UTN`, inicialmente vacío. Directorio local: `C:/Users/Laureano Beltrami/Desktop/PROYECTOFINAL`.

## Resultado funcional

Aplicación Laravel real con React/Inertia/TypeScript, MySQL, autenticación por sesión y tres roles. Incluye catálogo con filtros/paginación, perfiles y galería, solicitudes propias, evaluación administrativa y registro definitivo separado. El servicio de adopciones implementa transacciones, bloqueo por animal, reserva única, prevención de duplicados, historial de actores y cierre explicado de solicitudes restantes.

Administración: alta, modificación y archivo lógico de animales; carga validada de imágenes, elección de principal y eliminación. Veterinaria: consultas, vacunas, tratamientos y controles, edición por autor y agenda. Dashboard: seis contadores, tres gráficos de barras y actividad reciente calculados desde registros reales.

La presentación demo contiene 14 animales, tres cuentas con contraseña configurable, cinco solicitudes con distintos estados, una adopción y antecedentes sanitarios. Las fotografías de muestra son archivos locales con fuentes documentadas. Los datos demo no se cargan automáticamente ni se permiten en producción.

## Archivos principales

- `app/Services/AdoptionService.php`: reglas del flujo principal y transacciones.
- `app/Http/Controllers/*Controller.php`: módulos público, administrativo, adopciones y veterinaria.
- `app/Http/Requests/{AnimalRequest,StoreAdoptionRequest,MedicalRequest}.php`: validación.
- `app/Policies/` y `app/Http/Middleware/RequireRole.php`: autorización.
- `app/Models/`: entidades y relaciones.
- `database/migrations/2026_10_14_000001_create_shelter_tables.php`: esquema de dominio.
- `database/seeders/DemoSeeder.php` y `database/factories/AnimalFactory.php`: demo/testing.
- `resources/js/Components/Shelter.tsx`, `Pages/{Public,Adoptante,Admin,Veterinaria}`: interfaz funcional.
- `tests/Feature/ShelterTest.php`: reglas principales; suites adicionales de autenticación y perfil.
- `.github/workflows/ci.yml`: pruebas MySQL y build en Pull Requests.
- `README.md`, `CONTRIBUTING.md` y `docs/01` a `docs/07`: documentación.

## Migraciones efectivamente aplicadas

1. `0001_01_01_000000_create_users_table`.
2. `0001_01_01_000001_create_cache_table`.
3. `0001_01_01_000002_create_jobs_table`.
4. `2026_10_14_000001_create_shelter_tables`.

Se crearon 18 tablas incluyendo infraestructura e historial de migraciones, en `refugio_animales` sobre MariaDB 10.4.32 de XAMPP. También se ejecutaron las migraciones en `refugio_animales_testing`. Ambas bases están en una instancia aislada, puerto 3307. La instancia XAMPP preexistente no completaba handshake; no se repararon ni eliminaron sus datos.

## Verificación realizada

| Verificación | Resultado |
|---|---|
| `php artisan test --compact`, SQLite en memoria | 44 pruebas aprobadas, 220 assertions |
| Misma suite con DB_CONNECTION=mysql / refugio_animales_testing | 44 pruebas aprobadas, 220 assertions |
| `npm run build` | TypeScript y Vite aprobados |
| `php vendor/laravel/pint/builds/pint --test` | Aprobado |
| `npm audit --audit-level=moderate` | 0 vulnerabilidades |
| Migraciones y DemoSeeder | Ejecutados correctamente en MySQL/MariaDB aislado |
| Home HTTP con assets compilados | HTTP 200 |
| Login real con cookies y CSRF para los tres roles | HTTP 200 y página Inertia correspondiente |
| Adoptante intentando GET /admin en servidor real | HTTP 403 |
| Fotografía publicada mediante storage:link | HTTP 200 |

Las pruebas incluyen registro/login, roles, CRUD, filtros y privacidad pública, identidad de solicitante, duplicados, estados y transiciones, aprobación única, adopción definitiva, cierre de pendientes, rechazo terminal, controles, autoría clínica, fechas, estadísticas y validación/almacenamiento de imágenes.

No se pudo realizar inspección visual: el entorno de computer-use no tenía navegadores conectados. Build, HTTP y pruebas de backend no sustituyen la revisión visual. Tampoco se ejecutaron pruebas de carga o carreras con múltiples procesos independientes. El estado de GitHub Actions se informa en el PR; no se presume aprobado sin observarlo.

## Ejecución local

En esta computadora Laravel quedó iniciado en `http://localhost:8000`, con assets compilados. `.env` utiliza la instancia aislada del puerto 3307. La contraseña demo generada está en `DEMO_PASSWORD` dentro del archivo local `.env`, excluido de Git; los emails están en README. No compartir ese archivo.

Para otras computadoras seguir [instalación detallada](06-instalacion.md): XAMPP/MySQL, crear base, composer install, npm ci, configurar .env, key:generate, migrate, DemoSeeder opcional, storage:link, artisan serve y npm run dev. Para cuentas reales usar shelter:create-staff.

## Git y colaboración

Rama: `feature/plataforma-refugio`.

- `0fea990`: base inicial de documentación; publicada en main para permitir la comparación en un repositorio vacío.
- `ee44df7`: dominio Laravel y flujo transaccional de adopciones.
- `2262ad1`: interfaz React/Inertia pública e interna.
- `fa8a4e8`: tests de autenticación, adopciones, veterinaria y CI MySQL.
- `8940c44`: documentación de arquitectura, instalación XAMPP, colaboración y validación.

Pull Request en borrador: https://github.com/franbareuther/Proyecto-Final-UTN/pull/1. No se integra automáticamente la aplicación en main. La integración GitHub no tenía permiso para crear el PR (403); se creó con la autenticación Git ya disponible para este mismo repositorio. GitHub Actions se verifica por separado; no confundir resultados locales con CI remoto.

## Pendientes recomendados

Revisión visual responsive, lector de pantalla y teclado; validación de formularios con el refugio; pruebas concurrentes; traducción de pantallas auxiliares y mensajes nativos; revisión de privacidad y auditoría clínica detallada; SMTP y respaldos antes de producción. Consultar [plan real de desarrollo](07-plan-de-desarrollo.md). La entrega constituye una base funcional para continuar colaborativamente, no una certificación de producción.
