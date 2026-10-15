# Respaldo, restauración y preparación de publicación

Estos procedimientos se ensayan en instalaciones independientes, con base, archivos, clave y sesiones propias. No son autorización para migrar, borrar o restaurar la base existente ni para desplegar. La entrega de salud depende de `feature/equipo-1-publico-ux` / PR #9; ver el SHA final en su PR. Las ramas de 2 y 3 siguen siendo entregas separadas pendientes de integración revisada.

## Instalación y actualización comprobables

En una carpeta y base vacías: instalar desde composer.lock/package-lock.json, configurar un `.env` propio, generar APP_KEY **una sola vez en esa instalación nueva**, ejecutar `migrate`, `storage:link` y `npm run build`. Inspeccionar primero la conexión con `php artisan db:show`. Default DatabaseSeeder no crea usuarios. Crear el primer superadministrador explícitamente con `php artisan shelter:create-staff`; la migración no crea privilegios. La demo es opcional, local y solo para base exclusiva vacía, con DEMO_PASSWORD elegido localmente; nunca importar a producción.

Para actualizar: congelar escrituras y respaldar; restaurar una copia de prueba de la versión anterior con su entorno/Storage propios, conservar APP_KEY de esa copia, verificar versión y conexión, revisar `php artisan migrate:status`, ejecutar `php artisan migrate` y compilar. No usar fresh, rollback o seeders contra datos existentes. La migración `2026_10_15_000003_add_health_agenda_and_audits` crea las tablas de dosis/auditoría, copia próximas fechas como pendientes no verificados y no modifica los antecedentes. El rollback elimina esas tablas, por lo que **no es un plan de recuperación**.

Comprobar ambos catálogos y refugios, imagen institucional foto/logo y fallback, archivos de animales, login de tres roles, salud privada de dos refugios, archivados solo lectura y auditoría. Ejecutar tests en otra base exclusiva (SQLite en memoria o MySQL desechable terminado en `_testing`). `scripts/review-http.php` usa solo localhost y APP_ENV=local; autentica cuentas ficticias existentes y compara SHA-256 del dominio antes/después. Configurar REVIEW_BASE_URL, REVIEW_PASSWORD (o DEMO_PASSWORD) y, si difieren, REVIEW_SUPERADMIN_EMAIL / REVIEW_ADMIN_EMAIL / REVIEW_ADOPTANTE_EMAIL como variables locales. No crea cuentas ni modifica salud. Login requiere hashes compatibles con la configuración para no provocar rehash; si cambia el dominio, el script falla y exige revisar. No usarlo como comprobación visual ni contra producción.

## Qué respaldar

- Dump consistente del motor real, esquema, datos, claves, índices y tabla migrations. Comprobar versión del motor y tipo de tablas; `--single-transaction` presupone InnoDB y no protege DDL concurrente.
- Todo el Storage persistente, incluyendo `storage/app/public/animals` y `shelters`. Congelar escrituras también durante su copia para que DB y archivos correspondan al mismo punto.
- Configuración secreta y APP_KEY, cifradas y fuera del repositorio, con acceso restringido. Conservar la misma clave al restaurar; no ejecutar key:generate en una instalación recuperada.
- Commit, lockfiles, versión del motor/PHP y manifiesto de hashes de archivos. Assets se pueden reconstruir desde ese commit.

No publicar dumps, entornos, contraseñas ni datos de salud. Definir responsables, retención, cifrado y almacenamiento externo antes de una publicación real. No se contrataron servicios.

## Ejemplo MySQL/MariaDB

Usar un archivo de opciones privado con credenciales autorizadas y ACL restringida, fuera del repositorio; no pasar contraseñas por la línea de comandos. `--defaults-extra-file` debe ir primero. Los nombres de ejemplo siguientes son bases **de prueba exclusivas**:

```text
mysqldump --defaults-extra-file=<opciones-privadas> --single-transaction --routines --triggers --events --hex-blob --result-file=<backup.sql> huella_copia_testing
mysql --defaults-extra-file=<opciones-privadas> huella_restaurada_testing < <backup.sql>
```

La segunda línea usa redirección de cmd/bash, no de PowerShell. Crear primero la base de destino vacía en el servicio desechable, verificar su nombre y no importar en otra. Restaurar Storage en un directorio nuevo, restaurar configuración privada, recrear el enlace público apuntando a ese Storage y reconstruir assets desde el commit respaldado. No ejecutar el dump como SQL contra una base ajena. Verificar que el dump no contiene USE u otros destinos inesperados.

Comparar filas/conteos/IDs/relaciones y hashes de todas las tablas, especialmente shelters, animales, fotos, solicitudes, adopciones, cuatro entidades clínicas, vaccination_doses y health_audits. Comparar SHA-256 de archivos y clave; servir imágenes por HTTP. Comprobar permisos y ensayar recuperación antes de declarar utilizable el respaldo. Un dump que terminó sin error todavía necesita esta comprobación.

En SQLite de prueba se utilizó `VACUUM INTO` para una copia consistente, con escrituras detenidas, seguida de restauración en un archivo nuevo y comparación de registros. No copiar a ciegas un archivo activo en modo WAL ni reutilizar esta técnica como reemplazo de un respaldo MySQL.

## Evidencia de esta entrega

Se verificaron instalación vacía, comando explícito de superadmin (prueba automatizada), demo local sin otros roles ni duplicación de dosis, enlace Storage real y lectura de una fotografía enlazada. Se actualizó una copia SQLite anterior del PR #9, conservando SHA-256 de usuarios/credenciales, instituciones, animales, fotos, vacunas, consultas, solicitudes, adopciones e historial. Solo se aplicó la migración sanitaria pendiente.

Se generó un dump del MariaDB 10.4 desechable en 3310, se restauró en **otra base desechable vacía** y se compararon todas las tablas. Se restauró también SQLite con registros clínicos/dosis/auditorías, 15 archivos ficticios (14 fotos de animales y un logo PNG de refugio) y una APP_KEY exclusiva de prueba; registros y SHA-256 de archivos/clave coincidieron. Las bases y archivos originales no se usaron como destino. Esto es un ensayo local, no una recuperación ni restauración de producción, ni una prueba sobre MySQL remoto.

## Preparación para publicación futura

Antes de publicar, el equipo debe aportar servidor, dominio, responsables, estrategia de respaldo/retención y credenciales autorizadas. Configurar DocumentRoot en public/, HTTPS válido, APP_ENV=production, APP_DEBUG=false, APP_URL HTTPS, cookies de sesión seguras y un origen coherente. Conservar APP_KEY y evitar permisos de escritura fuera de storage/bootstrap/cache. Verificar proxy de confianza y encabezados únicamente para la infraestructura elegida; no abrir confianza global por conveniencia.

DB y Storage deben persistir entre versiones y reinicios. Definir procedimiento de mantenimiento, migraciones aditivas, comprobación posterior y recuperación desde backup probado. No usar DemoSeeder ni cuentas ficticias en producción. Crear privilegios mediante el procedimiento explícito y administrar su entrega por un canal autorizado.

Coordinar con integrante 2 el proveedor de correo, remitente autorizado, transporte cifrado, DNS y recuperación de contraseña con URL HTTPS. Probar inicialmente Mail fake o bandeja autorizada; no registrar tokens de recuperación en logs públicos ni inventar credenciales SMTP. Definir workers/reintentos/monitorización si se habilitan colas; hoy el entorno de prueba usa correo array, sin mensajes externos.

Compilar desde lockfiles, verificar las pruebas y CI del commit que se desplegará y revisar cachés de configuración/rutas tras configurar el entorno correcto. No transportar cachés generadas con secretos o rutas del entorno local. No se realizaron pruebas de correo real, dominio/HTTPS público, carga, dispositivos reales ni despliegue: siguen siendo verificaciones de una futura publicación autorizada.
