# Cuentas y adopciones — entrega del integrante 2

Fecha: 15 de octubre de 2026. Issue #3. Rama `feature/equipo-2-cuentas-adopciones`.

Base verificada con fetch: `origin/feature/equipo-1-publico-ux`, `b8b07b42cf5d3232f723eaa320a83bbd43458529`. Se creó una rama nueva con Git limpio; no se modificó la rama del integrante 1, main ni sus commits. Las imágenes de refugios se heredan, no se duplican. No se cambió stack, dependencias o lockfiles.

## Diagnóstico y comportamiento final

La base ya tenía registro/login/logout, perfil y contraseñas Breeze; tres roles; permisos de refugio; reserva al aprobar; adopción definitiva posterior; bloqueo del animal en AdoptionService; historial y cierre explicado de otras solicitudes. Los tests secuenciales existentes se conservaron. No se agregaron estados, cancelación ni readopción.

Se encontraron pantallas auxiliares activas en inglés; errores/notificaciones sin traducción local; formularios de perfil con errores sin vincular al campo; solicitud que permitía volver al formulario aun teniendo una activa; y un único campo de motivos expresamente visible al adoptante, sin lugar separado para notas internas.

Cambios:

- Recuperación, nueva contraseña, confirmación y verificación usan los componentes actuales de Huella y textos en español. Login/registro explican la cuenta global; perfil conserva nombre/apellido y agrega etiquetas de error y autocompletado. Las contraseñas se limpian al terminar el envío. No se habilitó eliminación de cuentas ni verificación obligatoria de correo; las plantillas parciales antiguas de Breeze no son las pantallas activas.
- `AccountLocale` fija español únicamente en rutas de cuentas, perfil y solicitudes/adopciones. No cambia `.env` ni fuerza el idioma de los módulos de otros integrantes. Traducciones en `lang/es/` y `lang/es.json`. User conserva las notificaciones estándar Breeze, solicitando locale `es`.
- La recuperación devuelve el mismo mensaje para correo conocido, desconocido o recientemente solicitado. No confirma públicamente la existencia de una cuenta. Los enlaces conservan vencimiento, validación y uso único del broker de Laravel. Se validan tipos de token/contraseña para devolver errores ante arrays manipulados.
- Login conserva el destino solicitado antes de autenticarse y `/dashboard` sigue redirigiendo por rol. Abrir otra vez un enlace de solicitud con una solicitud activa lleva a su detalle; si ya no hay disponibilidad y no existe una activa propia, lleva al perfil con explicación.
- Detalle de solicitud: institución responsable, explicación del estado y próximos pasos, respaldo de foto, historial, y enlace de retorno. Las acciones distinguen aprobar/reservar de registrar adopción definitiva y se filtran por disponibilidad; el servicio sigue siendo la autoridad. Para confirmar se exige selección y motivo visible suficiente; la validación de servidor se conserva.
- Administración de solicitudes conserva filtros y sincroniza sus controles, permite limpiar y vincula errores. Adopciones muestra solo registros definitivos del refugio y enlaza a solicitud/historial.
- El acceso de un propietario a su solicitud requiere rol adoptante; superadmin no hereda acceso de adopciones. Admin conserva el alcance de su propio refugio. No se implementó suspensión de personal, responsabilidad del integrante 3.

## Privacidad y migración

Nueva migración aditiva: `2026_10_15_000001_add_internal_notes_to_adoption_history.php`. Agrega `adoption_request_history.internal_notes` nullable. Aplicar `php artisan migrate` solo en una instalación de prueba con conexión y Storage propios. No modificar ni repetir migraciones previas; no requiere seeder.

`observations` **continúa siendo el motivo visible**, como ya indicaba la interfaz anterior. No se cambian valores persistidos ni se reclasifica automáticamente contenido histórico. El administrador cuenta ahora con `internal_notes`, opcional y hasta 2000 caracteres. El cierre de otras solicitudes publica su explicación estándar, sin copiar notas internas.

El detalle del adoptante selecciona explícitamente columnas públicas del historial: id, solicitud, estados, motivo y fecha. Excluye del payload `internal_notes`, `changed_by`, `actor` y `reviewed_by`, no solamente del HTML. Admin de la institución ve las notas y la autoría. La consulta de solicitudes propias y sus antecedentes continúa disponible si la institución se desactiva; las decisiones de personal inactivo siguen bloqueadas.

Contratos para los demás integrantes:

| Consumidor | Contrato |
|---|---|
| 1 — presentación/tipos | `Application.history.actor` es opcional porque se omite al adoptante; `internal_notes?: string|null` solo para personal. `Adoption.adoption_request_id?` es aditivo y el enlace se omite si falta. No se cambiaron componentes compartidos, estilos globales ni imágenes de refugios. |
| 3 — disponibilidad/personal | `AdoptionService::transition(request, actor, next, publicReason, internalNotes = null)` agrega un argumento opcional; cuatro argumentos siguen siendo válidos. No cambian estados ni orden de bloqueos. Mantener autorización con role, shelter_id y habilitación; coordinar cualquier campo nuevo de suspensión y la revocación de sesiones sin crear otra implementación. User solo agrega locale a las notificaciones estándar. |
| 4 — calidad | Suite de carreras optativa descrita abajo; requiere servicio MySQL/MariaDB desechable y procesos PHP independientes. No se modificó el workflow de CI existente. Revisar su incorporación en un job separado con base exclusiva. |

## Pruebas ejecutadas

SQLite en memoria, sin tocar la configuración local:

```powershell
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
$env:DB_URL=''
php artisan test --compact
```

Resultado: **87 aprobadas, 1025 aserciones; 4 de concurrencia omitidas deliberadamente** porque requieren el servicio separado. Pruebas propias en `tests/Feature/Auth/AccountFlowTest.php` y `tests/Feature/Adoptions/PrivacyAndJourneyTest.php`: tres roles y redirecciones, destino previo, logout, escalada por registro/perfil/formulario, autenticación/confirmación/cambio de contraseña, intentos limitados, token vencido/usado y correo desconocido, notificación española con Notification fake, solicitudes ajenas, dos refugios, notas fuera del payload, institución inactiva, reserva/adopción posterior, motivos e historial.

`npm.cmd run test:frontend`: **28 pruebas aprobadas**. Los casos nuevos de `accounts-adoptions.test.mjs` verifican contratos SSR de las pantallas auxiliares, perfil y detalle según actor. Se usa caché Vite propia del archivo de pruebas para evitar colisiones entre procesos de tests; no se reinstalan paquetes. SSR no comprueba layout, foco ni interacción.

`npm.cmd run build`: TypeScript/Vite aprobados. Pint, Prettier de archivos modificados y `git diff --check`: aprobados.

### Concurrencia real

Se creó una instancia nueva de MariaDB 10.4.32 con directorio exclusivo `.local/e2-mariadb-20261015`, puerto **3310**, enlazada a 127.0.0.1. No se reutilizaron los servidores ni bases de 3306/3307. Base nueva exclusiva `huella_e2_20261015_testing`; se aplicaron allí las migraciones, sin seeders. No se inicializó ni migró la base original.

`ConcurrentAdoptionsTest` inicia dos procesos PHP con conexiones distintas y barreras de archivos. El primero mantiene una transacción con el bloqueo; el segundo intenta operar y debe esperar al menos 0,4 segundos antes de obtener el rechazo esperado. No son llamadas secuenciales ni conexiones simuladas. Los workers usan AdoptionService para todas las operaciones de adopción; la carrera de desactivación reproduce la escritura bloqueada del refugio.

Resultado: **4 pruebas aprobadas, 43 aserciones**:

1. Dos envíos simultáneos de la misma identidad: una solicitud y un evento de historial.
2. Dos aprobaciones: una sola aprobada, animal reservado, sin adopción definitiva anticipada.
3. Dos registros definitivos: una adopción, un evento definitivo y un solo cierre explicado de la otra solicitud.
4. Desactivación concurrente: la solicitud que espera es rechazada y no se crea un registro nuevo.

En el último recorrido, las conexiones de cada pareja fueron diferentes (22/23, 25/26, 29/28 y 31/32); las esperas del contendiente fueron de aproximadamente 0,74–0,78 segundos. Resultados locales en `storage/framework/testing/e2-race-*/results.json`, sin credenciales.

Para repetir en **otro servicio desechable creado expresamente**, crear allí una base vacía con nombre `huella_e2_<identificador>_testing` y usar una terminal exclusiva:

```powershell
$env:APP_ENV='testing'
$env:DB_CONNECTION='mysql'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='<puerto del servicio desechable>'
$env:DB_DATABASE='huella_e2_ci_testing'
$env:DB_USERNAME='<usuario de pruebas>'
$env:DB_PASSWORD='<clave del servicio de pruebas>'
$env:DB_URL=''
$env:HUELLA_CONCURRENCY='1'
php artisan test --compact tests/Feature/Adoptions/ConcurrentAdoptionsTest.php
```

La suite rechaza motores o nombres distintos del patrón dedicado; sin opt-in se omite. Aplica únicamente migraciones pendientes y agrega fixtures únicos; no usa fresh/reset/rollback ni borra datos. Para una nueva ejecución aislada, crear otra base nueva en el servicio desechable. Cerrar esa terminal al terminar. No ejecutar el ejemplo contra una base compartida, original o de producción.

### HTTP y navegador

Demo aislada del integrante 2: **http://127.0.0.1:8017/**. SQLite, sesiones, correo array y Storage privados en `.local/e2-preview`; cuentas ficticias en el archivo local ignorado `accounts.json`, sin publicar contraseñas. Se migró únicamente esa copia. Las demos anteriores no se migraron y no son la referencia de esta rama.

Se ejecutó un recorrido HTTP real con cookies y CSRF: autenticación de tres roles; perfil que ignora rol/refugio forjados; confirmación de contraseña; solicitud de recuperación sin correo real; revisión → aprobación/reserva → adopción definitiva; comprobación del listado definitivo; historial público sin notas internas; superadmin denegado. Resultado local en `.local/e2-preview/http-result.json`. Es HTTP, **no navegador**.

Computer Use pudo enumerar la ventana de Huella pero volvió a bloquear la lectura del navegador porque no pudo verificar su URL con confianza. Se detuvo la interacción de UI. No hay capturas nuevas, ni comprobación visual aprobada de escritorio/tableta/celular, teclado/foco, menú o zoom. Conforme a la habilidad Computer Use, «If Computer Use reports that the turn ended or that the user stopped Computer Use, stop issuing app input». No se sustituye esa evidencia por SSR ni por HTTP.

## Recuperación de correo para publicación futura

Se conservaron broker, tokens con hash, vencimiento (60 minutos), limitación (60 segundos), reset de contraseña y rotación del remember token de Breeze. Notification fake permitió obtener el token, inspeccionar texto/acción española y comprobar vencimiento y uso único. No se probó entrega SMTP real, reputación, colas ni llegada a una casilla externa.

En una futura instalación autorizada, el responsable debe aportar proveedor y remitente verificado; configurar `APP_URL` con el dominio HTTPS correcto y `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` y las opciones TLS del proveedor según `config/mail.php`. No se incluyen credenciales ficticias ni reales en Git. Verificar config cache de esa instalación y probar primero en una casilla de pruebas autorizada. El mailer local sigue separado del proveedor real.

No se habilitó automáticamente la verificación obligatoria del correo; cambiar esa política requiere coordinación, no es una condición nueva para adoptar.

## Publicación y pendientes

PR contra **`feature/equipo-1-publico-ux`**, dependiente de #9 y de su cadena previa. No se presupone que main incluya la entrega. El SHA y el enlace definitivos se registran en la descripción del PR y se obtienen con `git rev-parse origin/feature/equipo-2-cuentas-adopciones`.

Issue #3 permanece abierto y el PR en borrador por estos pendientes:

- Validar login/registro/recuperación/reset/confirmación/perfil y solicitudes/adopciones a **1440×900, 768×1024 y 390×844**, con teclado, etiquetas/errores, foco, contenido largo, imágenes faltantes y capturas sin datos sensibles. Verificar en navegador confirmaciones y actualización/limpieza de controles.
- Revisión principal de 4; 3 por disponibilidad, transición y contrato futuro de suspensión; 1 por presentación y tipos opcionales. No se inventan identidades GitHub ni se afirma revisión completada.
- Configurar y comprobar correo real únicamente cuando exista proveedor, remitente y destinatario autorizados. La entrega SMTP queda sin acreditar.

La base, `.env`, APP_KEY, fotografías e historiales originales se conservaron. No hubo merge, despliegue, correo a terceros, actualización de paquetes ni publicación de este encargo o de instrucciones nuevas para agentes.
