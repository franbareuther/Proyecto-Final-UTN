> Actualización multirrefugio: consultar [diseño y actualización vigentes](10-multirrefugio.md). Las referencias a un refugio único y al estado previo de los PR pertenecen a la etapa inicial.

# Instalación en Windows / XAMPP

1. Instalar XAMPP con PHP 8.2 o superior y habilitar PDO MySQL, mbstring, openssl, fileinfo, DOM/XML y ZIP en el PHP utilizado por Composer. Comprobar `where.exe php` y `php -v`. Reiniciar terminal/Apache si se cambia php.ini. PHP de CLI y Apache deben ser compatibles.
2. Iniciar MySQL desde el panel de XAMPP. Si aparece otro proceso usando 3306, corregir el conflicto o usar el puerto configurado en XAMPP. No eliminar archivos del directorio de datos para reparar errores.
3. Abrir phpMyAdmin y crear `refugio_animales`, con utf8mb4_unicode_ci. Crear también `refugio_animales_testing` solo si se usarán pruebas en MySQL. Usar el usuario y contraseña reales de la instalación.
4. Clonar `https://github.com/franbareuther/Proyecto-Final-UTN.git` en una carpeta nueva y elegir la rama publicada de la entrega. Salud está en `feature/equipo-4-salud-entrega`, basada en `feature/equipo-1-publico-ux` (PR #9); no presuponer su integración en main. No cambiar ni sobrescribir otra rama con trabajo.
5. Instalar Composer 2 y ejecutar `composer install`. Si falta ZIP, habilitar `extension=zip` en el php.ini indicado por Composer o instalar una herramienta de extracción compatible.
6. Instalar Node 24 LTS con npm y ejecutar `npm ci`.
7. Copiar `.env.example` a `.env` con `Copy-Item .env.example .env`. Configurar DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME y DB_PASSWORD. La contraseña vacía del ejemplo no implica que tu instalación la tenga vacía. No versionar `.env`.
8. Ejecutar `php artisan key:generate`.
9. Ejecutar `php artisan migrate`.
10. `php artisan db:seed` no crea usuarios. Para una base de demostración vacía y exclusiva, definir `DEMO_PASSWORD` con al menos 12 caracteres y ejecutar `php artisan db:seed --class=DemoSeeder`. Solo funciona en local/testing. Crea `admin@huella.test` y `adoptante@huella.test`, fotografías y registros ficticios, incluidas programaciones de dosis. No importar ni repetir demo sobre datos existentes. No crea superadministradores: usar explícitamente `php artisan shelter:create-staff`, elegir superadmin e ingresar sus datos. Migrar nunca crea cuentas privilegiadas.
11. Ejecutar `php artisan storage:link`. En Windows puede requerir modo desarrollador o permisos para enlaces. El disco public contiene `animals/` y `shelters/`; comprobar una foto de animal y una foto/logo de refugio por URL. No reemplazar un enlace existente sin inspeccionarlo. Se admiten JPEG/PNG/WebP, sin SVG: 4 MB por foto de animal (8 por envío), 5 MB por imagen de refugio. El servidor debe permitir esa carga total (por ejemplo upload_max_filesize=8M, post_max_size=48M, max_file_uploads al menos 8).
12. Iniciar Laravel con `php artisan serve --host=127.0.0.1 --port=8000`.
13. En otra terminal ejecutar `npm run dev`.
14. Abrir `http://localhost:8000`. Alternativamente `npm run build` genera assets sin mantener Vite en ejecución.

Crear cuentas reales del personal mediante `php artisan shelter:create-staff`: solicita nombre, apellido, email, rol y contraseña oculta. No existe selector de roles en el registro público. Recuperación de contraseña usa `MAIL_MAILER=log` localmente; configurar SMTP para envío real.

## Apache opcional

Definir un VirtualHost cuyo DocumentRoot apunte a la carpeta **public**, nunca a la raíz del repositorio. Habilitar mod_rewrite y `AllowOverride All`; añadir un nombre como `huella.local` en el archivo hosts y actualizar APP_URL. Otorgar escritura a storage y bootstrap/cache. Ejecutar `npm run build` y `php artisan config:clear`. No es necesario Apache para el modo de desarrollo recomendado.

## Pruebas seguras

`php artisan test` usa SQLite en memoria por defecto, exclusivamente para testing. Para verificar el motor real, configurar variables de entorno de PowerShell antes de correr:

```powershell
$env:DB_CONNECTION='mysql'
$env:DB_DATABASE='refugio_animales_testing'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='3306'
$env:DB_USERNAME='usuario_testing'
$env:DB_PASSWORD='contraseña_testing'
php artisan test
```

La suite migra y limpia la base de testing. **Nunca** apuntar a datos reales. `Tests/TestCase.php` impide usar una base persistente cuyo nombre no termine en `_testing`, antes de ejecutar RefreshDatabase. Cerrar esa terminal al terminar para que la aplicación no herede esas variables. `.env.testing.example` sirve como referencia; las variables de phpunit.xml tienen prioridad sobre un .env.testing, por eso para MySQL se usan variables de proceso.

La protección actual exige además APP_ENV=testing, solo permite SQLite en memoria y comprueba el nombre efectivo de conexión tras resolver DB_URL. No habilitar un archivo SQLite persistente para el framework de pruebas. El recorrido HTTP y las instalaciones de ensayo tienen sus propias bases/Storage desechables y no heredan esas variables de tests.

Para actualizar una copia anterior o preparar recuperación, seguir [respaldo/restauración y publicación](14-operacion-y-publicacion.md). Conservar `.env`/APP_KEY y archivos, aplicar solo migraciones pendientes, sin fresh/reset/rollback ni demo sobre datos existentes.

## Registro local histórico de la etapa inicial

La instancia preexistente de XAMPP en 3306 no completaba el handshake. Se detuvo únicamente el proceso iniciado durante esta tarea y se inicializó un directorio independiente en `.local/mysql` con los binarios de XAMPP, puerto 3307, enlazado solo a 127.0.0.1. Los datos preexistentes no se modificaron manualmente. `.env` local usa 3307; `.env.example` conserva 3306. No es una dependencia del proyecto: otras computadoras deben usar su propia instalación normal de XAMPP.
