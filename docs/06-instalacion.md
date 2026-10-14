> Actualización multirrefugio: consultar [diseño y actualización vigentes](10-multirrefugio.md). Las referencias a un refugio único y al estado previo de los PR pertenecen a la etapa inicial.

# Instalación en Windows / XAMPP

1. Instalar XAMPP con PHP 8.2 o superior y habilitar PDO MySQL, mbstring, openssl, fileinfo, DOM/XML y ZIP en el PHP utilizado por Composer. Comprobar `where.exe php` y `php -v`. Reiniciar terminal/Apache si se cambia php.ini. PHP de CLI y Apache deben ser compatibles.
2. Iniciar MySQL desde el panel de XAMPP. Si aparece otro proceso usando 3306, corregir el conflicto o usar el puerto configurado en XAMPP. No eliminar archivos del directorio de datos para reparar errores.
3. Abrir phpMyAdmin y crear `refugio_animales`, con utf8mb4_unicode_ci. Crear también `refugio_animales_testing` solo si se usarán pruebas en MySQL. Usar el usuario y contraseña reales de la instalación.
4. Clonar `https://github.com/franbareuther/Proyecto-Final-UTN.git` y entrar en su carpeta. Para esta implementación, obtener la rama `feature/plataforma-refugio` hasta que el equipo revise su integración.
5. Instalar Composer 2 y ejecutar `composer install`. Si falta ZIP, habilitar `extension=zip` en el php.ini indicado por Composer o instalar una herramienta de extracción compatible.
6. Instalar Node 24 LTS con npm y ejecutar `npm ci`.
7. Copiar `.env.example` a `.env` con `Copy-Item .env.example .env`. Configurar DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME y DB_PASSWORD. La contraseña vacía del ejemplo no implica que tu instalación la tenga vacía. No versionar `.env`.
8. Ejecutar `php artisan key:generate`.
9. Ejecutar `php artisan migrate`.
10. `php artisan db:seed` no crea usuarios. Para la presentación, definir `DEMO_PASSWORD` con al menos 12 caracteres en `.env` y ejecutar `php artisan db:seed --class=DemoSeeder`. Solo funciona en local/testing. Crea `admin@huella.test`, `veterinario@huella.test` y `adoptante@huella.test`, todos con esa contraseña. Las descripciones indican DEMOSTRACIÓN. No importar demo en producción. Si ya existe el administrador demo, el seeder no duplica datos.
11. Ejecutar `php artisan storage:link`. En Windows puede requerir modo desarrollador o permisos para enlaces. Las fotografías se guardan en `storage/app/public/animals` y se sirven desde `/storage/animals`.
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

## Entorno de esta ejecución

La instancia preexistente de XAMPP en 3306 no completaba el handshake. Se detuvo únicamente el proceso iniciado durante esta tarea y se inicializó un directorio independiente en `.local/mysql` con los binarios de XAMPP, puerto 3307, enlazado solo a 127.0.0.1. Los datos preexistentes no se modificaron manualmente. `.env` local usa 3307; `.env.example` conserva 3306. No es una dependencia del proyecto: otras computadoras deben usar su propia instalación normal de XAMPP.
