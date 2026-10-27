# Integrante 2 — Cuentas, permisos y adopciones

Responsable: integrante 2. Issue #3. Rama propuesta: feature/equipo-2-cuentas-adopciones.

## Encargo

Sos responsable de cuentas y del proceso de adopción. Tu objetivo es que registro, sesión, perfil y seguimiento funcionen con los tres roles actuales, y que cada decisión de adopción respete disponibilidad, pertenencia e historial.

## Tareas concretas, en orden

1. Revisá registro, login, logout, perfil, cambio y recuperación de contraseña, confirmación y las pantallas auxiliares que use la aplicación. Traducí textos, errores y notificaciones al español sin cambiar valores persistidos. Comprobá redirecciones después de login y accesos a enlaces de solicitud desactualizados.
2. Verificá el proceso: una solicitud inicia en Nueva; pasa a En revisión, Aprobada o Rechazada según las transiciones permitidas; la aprobación reserva al animal y la adopción definitiva se registra aparte. Conservá motivos e historial y el cierre explicado de otras solicitudes cuando se concreta una adopción. No agregues estados ni cambies estas reglas silenciosamente.
3. Mejorá las pantallas del adoptante y Admin/Requests/Adoptions: estado visible, datos necesarios, acciones habilitadas y explicación de los próximos pasos. La información pública o visible al adoptante no debe contener observaciones internas sensibles. El adoptante sigue viendo sus antecedentes si un refugio se desactiva.
4. Probá permisos con dos refugios y los tres roles. Registro y edición de perfil no pueden asignar rol o refugio; adoptantes no ven solicitudes ajenas; administradores solo toman decisiones de su institución; superadministradores no heredan clínica o adopciones. Revisá además el alcance público del catálogo, que sí permite explorar todas las instituciones activas.
5. Agregá pruebas de concurrencia con conexiones o procesos independientes en un MySQL/MariaDB desechable. Comprobá solicitudes duplicadas, dos aprobaciones del mismo animal, doble registro de adopción y carreras con desactivación. Mantener una sola aprobación/adopción válida y un historial consistente es el criterio; tests secuenciales no acreditan una carrera real.
6. Prepará la recuperación por correo para una publicación real mediante configuración documentada. Usá Mail fake o un servidor de correo de pruebas para validación; no inventes credenciales SMTP ni envíes mensajes a terceros. Si falta un servicio real, entregá la configuración y el pendiente concreto sin declarar entrega de correo real.

## Archivos y límites

Propiedad: Controllers/Auth/*, ProfileController.php, AdoptionRequestController.php, Requests/Auth/*, ProfileUpdateRequest.php, StoreAdoptionRequest.php, RequireRole.php, AdoptionRequestPolicy.php, AdoptionService.php, User/AdoptionRequest/Adoption/AdoptionRequestHistory, Pages/Auth/*, Pages/Profile/*, Pages/Adoptante/* y Admin/Requests.tsx/Adoptions.tsx. Mantenés rutas web/auth como punto de integración, con cambios mínimos para los demás módulos.

El integrante 3 implementa gestión y suspensión de personal del refugio. Revisá su contrato con User, middleware y sesiones, pero no crees una segunda implementación. El integrante 4 mantiene CI y tests base; vos escribís las pruebas de cuentas/adopciones en tests/Feature/Auth y tests/Feature/Adoptions. Salud es responsabilidad de 4; animales y dashboard de 3.

## Criterios de aceptación

Autenticación y errores en español; recuperación comprobada al nivel realmente disponible; ninguna escalada de rol/refugio; solo acceso a solicitudes permitidas; recorrido completo y motivos visibles; una sola adopción por animal incluso en pruebas simultáneas; historial preservado. Todas las operaciones de adopción continúan pasando por AdoptionService. Pruebas, formato y build pasan.

Revisor principal: integrante 4. El integrante 3 revisa disponibilidad y el integrante 1 presentación y componentes.

## Base y reglas comunes

Repositorio: franbareuther/Proyecto-Final-UTN. Continuá la aplicación Laravel 12 + React/Inertia + TypeScript existente. Huellitas ya tiene catálogo general, catálogo por refugio, tres roles, solicitudes y adopciones, administración y salud. No reconstruyas el proyecto ni repitas tareas ya resueltas.

Los únicos roles son superadmin, admin del refugio y adoptante. El superadministrador crea refugios manualmente y su personal; no opera adopciones ni clínica. El administrador gestiona los datos de su propio refugio, incluida salud. El adoptante usa una cuenta global y ve solo sus solicitudes. La información pública de animales de toda la red puede ser explorada también por personal autenticado; los paneles y escrituras internas permanecen separados por refugio.

Antes de editar, leé AGENTS.md si existe, CONTRIBUTING.md, docs/08-distribucion-equipo.md, docs/10-multirrefugio.md, docs/12-catalogo-y-tres-roles.md y docs/equipo/00-coordinacion.md; inspeccioná el código real y el issue de tu área. Los informes históricos y algunas guías antiguas aún mencionan veterinario o estados previos de los PR: usalos como antecedentes, no como diseño vigente.

Inspeccioná el estado de Git y conservá los cambios locales. La base común publicada es feature/huella-multirrefugio; main todavía puede no incluirla. Si los PR visual y multirrefugio ya se integraron, comprobá que main incluya catálogo global, tres roles y las tres migraciones de dominio antes de usarlo. Si siguen abiertos, trabajá desde la última versión publicada de feature/huella-multirrefugio y dejá claro que tu PR depende de ella. Creá la rama indicada para tu módulo sin modificar main, sobrescribir ramas existentes ni ejecutar merges automáticos.

Cada cambio debe ser pequeño, verificable y dentro del área asignada. Respetá los componentes y contratos compartidos. Si necesitás tocar un archivo de otro responsable, limitá el cambio al contrato necesario, explicalo en el PR y pedí revisión del propietario; no implementes también su módulo. No reinstales dependencias ni cambies configuración local sin necesidad. Usá nuevas migraciones, nunca edites migraciones ya aplicadas.

Preservá .env, APP_KEY, datos, fotografías e historiales. No ejecutes migrate:fresh, reset, rollback o seeders sobre una base existente o compartida. Las escrituras de prueba se hacen con SQLite en memoria o servicios desechables creados para testing; una base persistente debe ser exclusiva de pruebas. No publiques credenciales, archivos .env, vendor, node_modules ni datos personales. Usá datos ficticios en capturas. No envíes correos reales sin destinatarios autorizados.

La base inicial tiene 62 pruebas PHP y 17 frontend aprobadas; verificá el estado real porque esas cantidades pueden cambiar. Agregá pruebas de tu funcionalidad en archivos de tu módulo, evitando que los cuatro editen a la vez ShelterTest.php. Ejecutá PHP, frontend, build y formato según los cambios; adjuntá resultados y límites. No presentes como comprobadas pruebas de navegador, concurrencia real, correo o despliegue que no ejecutaste.

Quedan fuera chat, pagos, donaciones, nuevos roles, autorregistro de refugios, traslados de animales, readopción y diagnósticos automáticos. Tampoco agregues restauración de animales o cancelación de solicitudes como reglas nuevas sin acordar ese alcance. Ante una decisión de negocio sin respuesta, identificá la decisión y avanzá con las tareas independientes.

## Forma de entrega

Empezá con un diagnóstico breve que distinga implementado, reproducido y pendiente, y un orden de trabajo. Después implementá tu alcance autorizado, verificá y documentá. Publicá PR pequeños en borrador, referenciando el issue con Refs; no lo cierres antes de completar y verificar sus criterios. No hagas merge ni despliegue automático. Cada PR debe explicar problema, comportamiento final, datos afectados, pruebas y pendientes. Terminá con un informe de lo realizado, evidencia y decisiones que quedan para el equipo.
