# Integrante 4 — Salud, trazabilidad y preparación de entrega

Responsable: integrante 4. Issue #5. Rama propuesta: feature/equipo-4-salud-entrega.

## Encargo

Sos responsable de salud, agenda y preparación técnica de la entrega. No existe un perfil veterinario: el administrador del refugio registra y actualiza su información sanitaria. Tu objetivo es completar la agenda y su trazabilidad y dejar una instalación reproducible de la versión actual.

## Tareas concretas, en orden

1. Revisá consultas, vacunas, tratamientos y controles: validación de fechas, errores, formularios y estados. Conservá la distinción entre practitioner_name (profesional que atendió), recorded_by (autor inicial) y updated_by (último editor). Cualquier administrador del mismo refugio puede actualizar; el autor inicial nunca se cambia con datos del cliente. Adoptante y superadministrador no tienen acceso clínico.
2. Resolvé el cumplimiento de próximas dosis. Hoy se consulta next_dose_date vencida o dentro de 30 días sin enlace que indique si ya fue aplicada. Diseñá una relación explícita entre dosis programada y aplicación/cancelación, con migración progresiva y sin borrar vacunas anteriores. Documentá el criterio antes de codificar; consultá al usuario únicamente si una decisión clínica imprescindible no puede resolverse con el flujo acordado. Aplicar una dosis debe quitar el pendiente sin perder antecedente.
3. Completá agenda de controles y dosis: vencidos, hoy, próximos, realizados y cancelados; casos vacíos y fechas límite. Coordiná con 3 cómo impactan los contadores del dashboard. No generes tratamientos ni diagnósticos automáticos.
4. Implementá auditoría de modificaciones de salud: actor, fecha, registro/tipo y valores anteriores/nuevos relevantes. Hoy se guarda solo el autor y el último editor. La auditoría debe escribirse en la misma transacción y ser de consulta interna, sin edición o borrado desde la UI. Mostrá quién registró y quién actualizó, manteniendo la privacidad multirrefugio.
5. Permití consultar los antecedentes de animales archivados con autorización del refugio correspondiente, en modo de lectura. No reabras el catálogo, solicitudes ni escrituras de un animal archivado y no agregues restauración de animales. Un refugio desactivado mantiene sus restricciones de acceso; no hagas una excepción pública o global para resolver el histórico.
6. Actualizá scripts/review-http.php para superadmin/admin/adoptante, catálogo general y refugios. Actualmente todavía supone una cuenta veterinaria y omite parte de multirrefugio. El recorrido sigue siendo local y de lectura del dominio; si necesitás pruebas de escritura, hacelas por separado en fixtures desechables. Incluí shelters y tablas nuevas relevantes en la comprobación de integridad.
7. Actualizá README y guías de requerimientos, casos de uso, arquitectura, datos e instalación para tres roles. Conservá informes históricos como históricos. Verificá instalación limpia y actualización de una copia anterior, Storage, datos demo locales y creación explícita del superadministrador. No publiques contraseñas reales ni agregues cuentas privilegiadas por defecto al migrar.
8. Mantené CI, tests base y una guía comprobable de respaldo/restauración. Prepará requisitos y pasos de publicación: HTTPS, configuración de producción, correo coordinado con 2 y persistencia de archivos. Preparar no significa desplegar: si falta servidor, dominio o credenciales, registrá el pendiente y no contrates ni publiques servicios automáticamente.

## Archivos y límites

Propiedad: MedicalController.php, MedicalRequest.php, MedicalConsultation/Vaccination/Treatment/VeterinaryControl, Pages/Veterinaria/* y nuevas entidades de agenda/auditoría. Los nombres técnicos históricos de carpetas/rutas no justifican restaurar el rol eliminado. Mantenés Tests/TestCase, phpunit.xml, .github/workflows/ci.yml, scripts/review-http.php y documentación de entrega. Las migraciones de tu funcionalidad son tuyas, revisadas por 3.

Pruebas de salud en tests/Feature/Health y de instalación/actualización en archivos separados. Cada integrante mantiene las pruebas de su módulo: no absorbas toda la calidad. Coordinar contratos de rutas/permisos con 2 y de componentes con 1 evita duplicación.

## Criterios de aceptación

Una dosis aplicada no queda pendiente; agenda y dashboard coherentes; datos clínicos ajenos inaccesibles; autor/profesional separados; todas las correcciones auditadas; histórico archivado consultable sin reactivar al animal. Instalación, actualización y scripts funcionan con el diseño vigente; ningún test toca una base compartida. CI y build pasan; toda limitación de pruebas/dispositivo/correo/despliegue es explícita.

Revisor principal: integrante 1. Permisos: integrante 2; migraciones e indicadores: integrante 3.

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
