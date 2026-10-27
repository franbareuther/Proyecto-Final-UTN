# Huellitas multirrefugio

## Alcance

Huellitas es la plataforma común; cada refugio tiene nombre, identificador web, ciudad, descripción y contacto públicos. La portada dirige al directorio de refugios activos. La entrada «Animales en adopción» abre el catálogo general, filtrable por especie, ciudad y refugio; «Refugios» conserva el recorrido por institución. Cada perfil enlaza a su catálogo; filtros, razas y paginación pertenecen al refugio seleccionado. Los enlaces antiguos `/animales/{id}` siguen funcionando para animales de refugios activos.

Alta manual: conversación fuera de la plataforma, verificación y creación por superadministrador. No hay autorregistro de refugios, chat ni aprobación automática. El superadministrador crea cuentas de administrador en el refugio elegido. El administrador edita el perfil público de su refugio, sin cambiar su identificador ni su habilitación.

| Rol | Alcance |
|---|---|
| `superadmin` | Alta/edición/habilitación de refugios y creación de su personal. No hereda permisos de adopciones o clínica. |
| `admin` | Un refugio: animales, fotos, perfil, solicitudes, adopciones, dashboard y carga de salud. |
| `adoptante` | Cuenta global; solicita en distintos refugios y consulta solo sus solicitudes. |

La primera versión asigna un refugio a cada miembro del personal (`users.shelter_id`). Adoptantes y superadministradores no necesitan esa asociación. Los animales requieren `animals.shelter_id`; fotos, solicitudes, adopciones y clínica derivan su pertenencia del animal. No se implementan traslados de animales ni cambios de pertenencia del personal.

Las consultas del personal usan `ScopedToStaffShelter` en animales, solicitudes, adopciones y registros clínicos. Las policies comprueban pertenencia y habilitación. `AdoptionService` comprueba el refugio del actor incluso fuera de HTTP; las nuevas solicitudes bloquean y verifican el refugio en la transacción. El formulario de animales nunca puede elegir otro `shelter_id`.

Desactivar un refugio oculta su perfil y catálogo y bloquea operaciones internas. Conserva registros, cuentas, fotografías e historial. Los adoptantes siguen consultando sus solicitudes anteriores. El superadministrador puede reactivarlo. No hay borrado de refugios.

## Actualización de una instalación existente

1. Revisar e integrar la rama mediante PR. Esta entrega parte del trabajo visual del PR #7; no hace merge automático.
2. Respaldar base y Storage antes de una actualización real. Conservar `.env`, `APP_KEY` y el puerto configurado de MariaDB.
3. Instalar desde los lockfiles, compilar (`npm ci`, `npm run build`) y ejecutar `php artisan migrate`. **No usar `migrate:fresh` ni repetir DemoSeeder sobre datos existentes.**
4. La nueva migración crea `Refugio inicial` (`huella-inicial`), asigna allí todos los animales anteriores —incluidos archivados— y el personal admin. Conserva identificadores y relaciones de adopciones y clínica. Editar luego el nombre y contacto de esa institución.
5. Crear el primer superadministrador con `php artisan shelter:create-staff`; elegir `superadmin` e ingresar datos y contraseña de al menos 12 caracteres en el diálogo. Migrar no crea cuentas privilegiadas ni contraseñas por defecto.
6. Ingresar a `/superadmin/refugios`, completar el refugio inicial y crear otros refugios y su personal. El comando también crea admin solicitando el identificador de un refugio activo.

`users.role` pasa de enum a texto para admitir `superadmin`; registro, creación de personal y comando restringen sus entradas. La migración inversa elimina la separación y degrada superadministradores a adoptantes. La migración siguiente convierte las cuentas veterinarias existentes a administradores del mismo refugio, conserva sus contraseñas y autoría, y distingue recorded_by de practitioner_name. Ver [catálogo general y tres roles](12-catalogo-y-tres-roles.md). No usar rollback como procedimiento habitual de actualización o restauración.

## Verificación y mantenimiento

`MultiShelterTest` verifica catálogos, filtros y paginación, accesos directos ajenos, fotos, asignación forjada, solicitudes y decisiones, dashboard, agenda, alta manual, registro sin privilegios, desactivación e historial, y actualización de registros anteriores. La suite heredada conserva reglas de adopción y clínica.

Las pruebas PHP locales usan SQLite en memoria; CI dispone de MySQL efímero y ejecuta además pruebas de presentación. La base de preview, `.env`, dependencias y archivos compilados están ignorados. No se migró MariaDB existente durante esta implementación.

Consultar [distribución del equipo](08-distribucion-equipo.md) y [validación](11-validacion-multirrefugio.md).
