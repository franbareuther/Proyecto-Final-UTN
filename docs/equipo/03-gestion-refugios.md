# Integrante 3 — Superadministración y gestión de refugios

Responsable: integrante 3. Issue #4. Rama propuesta: feature/equipo-3-gestion-refugios.

## Encargo

Sos responsable de la operación del refugio y de la superadministración. Tu objetivo es completar los paneles existentes para gestionar instituciones, cuentas administrativas, animales, fotos e indicadores, respetando el aislamiento multirrefugio.

## Tareas concretas, en orden

1. Revisá alta manual, edición, habilitación y desactivación de refugios. Completá búsqueda y navegación del panel del superadministrador para listas extensas, sin alterar las reglas de desactivación ni permitir autorregistro. El administrador solo edita el perfil público de su institución; habilitación e identificador web corresponden al superadministrador.
2. Completá la gestión de personal, que hoy solo crea administradores. Implementá edición segura de datos y suspensión/reactivación de cuentas administrativas, manteniendo relaciones e historiales. No permitas crear el rol veterinario ni otorgar superadmin desde ese formulario. La suspensión debe bloquear ingreso y sesiones ya abiertas; definí la condición explícita en User y su control de servidor, y pedí revisión de 2 sobre middleware/sesiones. Los errores o duplicados no deben dejar operaciones parciales.
3. Revisá alta, edición y archivo de animales. Confirmá validaciones, protección contra refugio enviado por el cliente, y que CRUD no libera reservas ni cambia adopciones definitivas. El archivo no puede saltarse solicitudes activas. No borres archivos históricos ni implementes traslados, restauración o readopción dentro de este alcance.
4. Reproducí carga múltiple, errores, principal, eliminación y segundo envío de fotos. Comprobá si el input de archivos conserva nombres después de guardar y corregilo si se confirma. Revisá doble clic, lentitud y confirmaciones para evitar operaciones duplicadas; coordiná el componente compartido con 1. Todas las fotos deben corresponder al animal/refugio autorizado.
5. Completá búsquedas y filtros útiles de los listados administrativos. Revisá estados vacíos, mensajes y tablas en los tres tamaños con 1. No modifiques Admin/Requests/Adoptions, que son de 2.
6. Verificá dashboard con fixtures: animales activos/archivados, disponibles, solicitudes, adopciones, tratamientos y controles. Documentá qué incluyen los contadores y sus etiquetas antes de ajustar consultas. Todos los resultados del panel pertenecen al refugio autenticado; acordá los indicadores sanitarios con 4.
7. Probá nuevas migraciones con datos anteriores: cuentas, fotos e historiales intactos. Cada migración nueva tiene un nombre único y no reemplaza la ya aplicada. Actualizá el modelo de datos de tu área.

## Archivos y límites

Propiedad: Shelter.php, ShelterController.php y nuevas policies/requests de refugios/personal; AnimalController.php, DashboardController.php, AnimalRequest.php, AnimalPolicy.php, Animal.php, AnimalPhoto.php; Superadmin/Shelters.tsx, Admin/ShelterProfile.tsx, Animals.tsx, AnimalForm.tsx, Dashboard.tsx y Components/ShelterForm.tsx. Mantenés integridad del esquema, factories de animales y datos demo; no cambiás reglas de adopción o datos clínicos por tu cuenta.

La lógica de ciclo de vida del personal pertenece a este módulo; User y middleware son compartidos y requieren revisión de 2. Las cuentas del adoptante y superadmin no se suspenden desde el panel de personal del refugio. No cambies la asociación de una cuenta a otra institución: eso requiere definir una política de traslado fuera de esta etapa.

Pruebas propias: tests/Feature/Admin y tests/Feature/Superadmin. Cubrí roles, cuentas suspendidas, sesiones existentes, fotografías ajenas, estados protegidos, desactivación y dashboard de dos refugios.

## Criterios de aceptación

Superadministrador administra refugios y sus accesos; personal suspendido no conserva acceso; administrador administra solo su institución; fotos y CRUD son coherentes; historial intacto; indicadores documentados coinciden con los datos. Pruebas, formato y build pasan y la revisión visual tiene evidencia.

Revisor principal: integrante 2. El integrante 1 revisa presentación y 4 efectos en salud/migraciones.

## Base y reglas comunes

Repositorio: franbareuther/Proyecto-Final-UTN. Continuá la aplicación Laravel 12 + React/Inertia + TypeScript existente. Huella ya tiene catálogo general, catálogo por refugio, tres roles, solicitudes y adopciones, administración y salud. No reconstruyas el proyecto ni repitas tareas ya resueltas.

Los únicos roles son superadmin, admin del refugio y adoptante. El superadministrador crea refugios manualmente y su personal; no opera adopciones ni clínica. El administrador gestiona los datos de su propio refugio, incluida salud. El adoptante usa una cuenta global y ve solo sus solicitudes. La información pública de animales de toda la red puede ser explorada también por personal autenticado; los paneles y escrituras internas permanecen separados por refugio.

Antes de editar, leé AGENTS.md si existe, CONTRIBUTING.md, docs/08-distribucion-equipo.md, docs/10-multirrefugio.md, docs/12-catalogo-y-tres-roles.md y docs/equipo/00-coordinacion.md; inspeccioná el código real y el issue de tu área. Los informes históricos y algunas guías antiguas aún mencionan veterinario o estados previos de los PR: usalos como antecedentes, no como diseño vigente.

Inspeccioná el estado de Git y conservá los cambios locales. La base común publicada es feature/huella-multirrefugio; main todavía puede no incluirla. Si los PR visual y multirrefugio ya se integraron, comprobá que main incluya catálogo global, tres roles y las tres migraciones de dominio antes de usarlo. Si siguen abiertos, trabajá desde la última versión publicada de feature/huella-multirrefugio y dejá claro que tu PR depende de ella. Creá la rama indicada para tu módulo sin modificar main, sobrescribir ramas existentes ni ejecutar merges automáticos.

Cada cambio debe ser pequeño, verificable y dentro del área asignada. Respetá los componentes y contratos compartidos. Si necesitás tocar un archivo de otro responsable, limitá el cambio al contrato necesario, explicalo en el PR y pedí revisión del propietario; no implementes también su módulo. No reinstales dependencias ni cambies configuración local sin necesidad. Usá nuevas migraciones, nunca edites migraciones ya aplicadas.

Preservá .env, APP_KEY, datos, fotografías e historiales. No ejecutes migrate:fresh, reset, rollback o seeders sobre una base existente o compartida. Las escrituras de prueba se hacen con SQLite en memoria o servicios desechables creados para testing; una base persistente debe ser exclusiva de pruebas. No publiques credenciales, archivos .env, vendor, node_modules ni datos personales. Usá datos ficticios en capturas. No envíes correos reales sin destinatarios autorizados.

La base inicial tiene 62 pruebas PHP y 17 frontend aprobadas; verificá el estado real porque esas cantidades pueden cambiar. Agregá pruebas de tu funcionalidad en archivos de tu módulo, evitando que los cuatro editen a la vez ShelterTest.php. Ejecutá PHP, frontend, build y formato según los cambios; adjuntá resultados y límites. No presentes como comprobadas pruebas de navegador, concurrencia real, correo o despliegue que no ejecutaste.

Quedan fuera chat, pagos, donaciones, nuevos roles, autorregistro de refugios, traslados de animales, readopción y diagnósticos automáticos. Tampoco agregues restauración de animales o cancelación de solicitudes como reglas nuevas sin acordar ese alcance. Ante una decisión de negocio sin respuesta, identificá la decisión y avanzá con las tareas independientes.

## Forma de entrega

Empezá con un diagnóstico breve que distinga implementado, reproducido y pendiente, y un orden de trabajo. Después implementá tu alcance autorizado, verificá y documentá. Publicá PR pequeños en borrador, referenciando el issue con Refs; no lo cierres antes de completar y verificar sus criterios. No hagas merge ni despliegue automático. Cada PR debe explicar problema, comportamiento final, datos afectados, pruebas y pendientes. Terminá con un informe de lo realizado, evidencia y decisiones que quedan para el equipo.
