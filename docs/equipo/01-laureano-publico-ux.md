# Integrante 1 — Laureano: sitio público y experiencia de uso

Responsable: Laureano, integrante 1. Issue #2. Rama propuesta: feature/equipo-1-publico-ux.

## Encargo

Sos responsable del sitio público y de los componentes visuales compartidos. Tu objetivo es que una familia pueda encontrar un animal desde el catálogo general o desde un refugio, reconocer la institución responsable y completar la navegación sin confusión. El trabajo visual anterior ya existe: completalo y corregilo con evidencia.

## Tareas concretas, en orden

1. Revisá inicio, menú, footer, catálogo general, directorio y perfil de refugio, catálogo de un refugio y perfil de animal. Mantené las dos entradas «Animales en adopción» y «Refugios», y la sección de cada una en el inicio. Revisá que los textos representen a Huellitas como plataforma y al refugio como responsable del animal.
2. Verificá búsqueda, especie, raza, tamaño, edad, disponibilidad, ciudad y refugio; combinaciones, chips para quitar un filtro, limpiar y paginar. La URL, los controles y los resultados deben coincidir. En el catálogo de una institución, ninguna combinación de URL debe cambiarla ni mostrar filtros como aplicados si no afectan la consulta.
3. Comprobá foto principal, galería y miniaturas, nombres largos, imágenes faltantes o inaccesibles, listas vacías y refugios sin contacto. Mantené el nombre del refugio en tarjetas y perfiles. Usá fotos autorizadas o las demo existentes; no inventes testimonios, estadísticas o animales reales.
4. Probá las pantallas públicas a 1440×900, 768×1024 y 390×844; agregá 320 px y zoom 200% como casos de estrés. Comprobá teclado, foco, menú con Escape, etiquetas, errores y contraste de los elementos modificados. Adjuntá capturas y pasos, sin confundir renderizado SSR con navegador.
5. Pulí componentes, formularios y confirmaciones compartidos sin romper sus consumidores. La presentación de Auth/Adoptante la implementa 2, de Admin/Superadmin 3 y de Salud 4; coordiná sus necesidades y revisá el resultado, sin apropiarte de esas pantallas.

## Archivos y límites

Propiedad principal: resources/js/Pages/Public/*, app/Http/Controllers/CatalogController.php, resources/js/Components/*, resources/js/Layouts/*, resources/css/app.css, resources/js/types/* y configuración frontend. No modifiques AdoptionService, políticas de personal, escrituras de animales o salud. Los cambios de tipos deben preservar lo que usan los otros módulos.

Pruebas propias: tests/Feature/Catalog/ y tests/Frontend/ con archivos separados de los demás. Cubrí filtros de varios refugios, inactivos, paginación, vacíos, datos extensos y privacidad clínica. Conservá los tests existentes y agregá casos útiles; no generes tests que repitan literalmente el CSS.

## Criterios de aceptación

Ambos recorridos llevan al animal y su refugio correcto; filtros y paginación son coherentes; foto y respaldo funcionan; no hay desbordamiento horizontal de página con contenido normal; menú, teclado y zoom se verifican con evidencia. Los catálogos públicos no exponen salud interna ni solicitudes privadas. La compilación y pruebas pasan. Las limitaciones reales quedan documentadas.

Revisor principal: integrante 3; integrante 4 apoya accesibilidad. Solicitá revisión adicional del consumidor cuando cambies un componente compartido.

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
