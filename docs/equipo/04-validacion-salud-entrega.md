# Validación de salud y entrega — integrante 4

15/10/2026. Refs #5. Rama `feature/equipo-4-salud-entrega`, base verificada `origin/feature/equipo-1-publico-ux` en `b8b07b42cf5d3232f723eaa320a83bbd43458529`. Git estaba limpio; se actualizó origin y se creó una rama nueva, sin sobrescribir las entregas de 2/3. La base reemplaza la referencia antigua a feature/huella-multirrefugio del issue. PR #9 continúa abierto en borrador; PR #10 y #11 también, separados y sin merge. No se presupone que main contenga estas entregas.

## Diagnóstico y cambios

La base ya tenía cuatro entidades clínicas, profesional separado del autor, corrección por administradores del mismo refugio y agenda por fechas. Por inspección se detectó que next_dose_date no acreditaba cumplimiento y que solo se conservaba el último editor; el binding de animales tampoco permitía leer archivados. No se presenta esa inspección como reproducción visual.

Se definió antes de codificar el [criterio de cumplimiento](../13-salud-agenda-entrega.md). La entrega agrega programación explícita, aplicación enlazada y cancelación con motivo, sin fabricar aplicaciones históricas. Las correcciones conservan recorded_by, atribuyen updated_by desde sesión y guardan auditoría con valores anteriores/nuevos y actor/fecha en la misma transacción. El servicio bloquea primero el animal y vuelve a autorizar; rechaza escrituras si fue archivado o no pertenece al refugio activo.

Agenda: vencidos, hoy, próximos 30 días, realizados/aplicadas, cancelados y todos; vacíos, filtros/URL y páginas independientes de controles/dosis. Historia: auditoría paginada y dosis con aplicación/cancelación explícitas. Archivados: búsqueda y lectura interna de antecedentes, sin botones de carga/corrección/resolución ni rutas de escritura habilitadas. No hay restauración, cambios de adopciones o permiso clínico para superadmin/adoptante.

Los modelos sanitarios agregan relación updater; se preservan los contratos existentes. `types/health.ts` contiene Dose/HealthAudit y los tipos compartidos solo reciben campos opcionales. Se reutilizan componentes de 1 y el uploader de refugios de #9 permanece intacto. El dashboard suma un contador derivado de los mismos pendientes de la agenda; las definiciones y puntos de integración con #11 están documentados para revisión de 3.

## Migración y compatibilidad

Nueva migración única `2026_10_15_000003_add_health_agenda_and_audits.php`: crea vaccination_doses y health_audits, con claves restrictivas e índices, sin cambiar migraciones anteriores ni vacunas. Cada next_dose_date previa se copia como pendiente con legacy_unverified=true. No se crean cuentas, aplicaciones ni auditorías históricas. La advertencia se retira al resolver explícitamente y su valor anterior se conserva en auditoría.

La migración no coincide con 000001 (integrante 2) ni 000002 (integrante 3). Revisar integración de User/middleware/policies con 2/3 sin reemplazar su suspensión de personal. El servicio recarga actor y animal; debe conservarse la comprobación de suspensión que aporta #11 al integrar ambas entregas.

HealthService es el contrato para futuras escrituras clínicas. No usar actualizaciones directas de modelos para corregir registros o fechas de vacunas; omitirían auditoría/sincronización. El único ajuste al test heredado MultiShelterTest usa el servicio al crear el fixture de vacuna, para que la agenda tenga una programación explícita de acuerdo con el contrato nuevo; se conservaron sus comprobaciones de aislamiento y el resto de tests.

## Resultados ejecutados

| Comprobación | Resultado real |
| --- | --- |
| PHP completo, SQLite en memoria | 88 pruebas, 1223 aserciones aprobadas. |
| PHP completo, MariaDB 10.4 desechable | 88 pruebas, 1223 aserciones aprobadas; base exclusiva huella_e4_20261015_testing en servicio local 3310. |
| Frontend Node/React SSR | 28 pruebas aprobadas, 4 nuevas de salud. No acredita navegador. |
| Build | TypeScript y Vite aprobados. |
| Formato | Pint completo, Prettier de cambios y git diff --check aprobados. |
| Protección de testing | Rechazo intencional de SQLite persistente antes de migrar; no se creó el archivo. Se resuelven también overrides DB_URL y se exige APP_ENV=testing. |
| HTTP de escritura aislado | Cookies/CSRF, alta/corrección auditadas, aplicación y exclusión del pendiente, segunda aplicación rechazada, cancelación con motivo, archivados solo lectura, otro refugio/roles denegados y catálogo sin clínica. |
| Script HTTP de lectura | scripts/review-http.php pasó con tres roles, ambos catálogos, refugios, fotografías y logo, salud y archivados propios. SHA-256 de todas las tablas de dominio conservado. |
| Instalación y actualización | DB vacía/Storage/APP_KEY propios, migraciones, demo local sin rol eliminado ni duplicación, comando explícito de superadmin probado y storage:link real con fotografía/hash verificados. Copia SQLite anterior del PR #9 actualizada solo con la migración pendiente; hashes de datos previos conservados. |
| Respaldo/restauración | Dump MariaDB restaurado en otra DB desechable y todas las tablas comparadas; SQLite clínico y 15 archivos (14 animales + logo), más clave exclusiva de prueba, restaurados y comparados. |
| Navegador y capturas | No ejecutados: el navegador conectado no estaba disponible y Computer Use detuvo el acceso por no poder verificar la URL de Chrome. Sin capturas ni aprobación visual. |

Tests propios: `tests/Feature/Health/HealthWorkflowTest.php`, `HealthUpgradeTest.php` y `tests/Frontend/health.test.mjs`. Incluyen autores falsificados, correcciones de los cuatro tipos, atomicidad ante fallo de auditoría, dosis cumplidas/canceladas/reprogramadas, fechas inválidas/límite y orden de aplicaciones, segundo cumplimiento rechazado, relaciones ajenas, privacidad clínica, archivados, migración con datos anteriores, cuentas/demo. El resultado de CI del SHA publicado se registra en el PR/issue #5; no se infiere del resultado local.

Los ensayos locales usan las dependencias ya instaladas con las versiones de los lockfiles: Laravel 12.70.0, Inertia Laravel 2.0.28/React 2.3.29, React 18.3.1, TypeScript 5.9.3, Vite 7.3.7 y Tailwind 4.0.17. No se reinstalaron ni actualizaron dependencias. CI realiza instalación desde lockfiles en su runner limpio y MySQL desechable.

## Instalación de prueba y evidencias locales

Demo: **http://127.0.0.1:8019/**, desde esta carpeta, encabezado `X-Huella-Preview: e4-salud-entrega`. Tiene SQLite, APP_KEY, sesiones, correo array y Storage propios en `.local/e4-preview/`. Cuentas ficticias y resultados HTTP están en archivos locales ignorados; no se publican contraseñas, bases ni copias. Otras demos anteriores no identifican esta entrega; el servidor usa el checkout actual, por lo que cambiar de rama cambia el código servido.

Se preservaron `.env`, APP_KEY, base existente en 3307, fotos e historiales. Solo hubo migraciones/fixtures en memoria, copias o bases desechables; no se ejecutaron seeders en la base original. No hubo correos reales, merges ni despliegues. Los archivos de instrucciones/prompts existentes se conservaron y no se publicaron prompts o archivos nuevos para agentes.

Instalación/actualización: [guía de instalación](../06-instalacion.md). Procedimiento y evidencia de recuperación, variables del script local y requisitos de futura publicación: [operación y publicación](../14-operacion-y-publicacion.md). Los informes históricos y capturas anteriores no acreditan las comprobaciones de esta entrega.

## Pendientes precisos y revisión

Antes de cerrar #5, completar en navegador con datos ficticios a 1440×900, 768×1024 y 390×844; agregar 320 px y zoom 200% como estrés:

1. Buscar animales activos/archivados y recorrer las cuatro colecciones de historia; verificar nombre/texto largo, ausencia/fallo de foto, etiquetas, errores de fechas/estado, guardado y autor/editor correctos.
2. Agenda: vencido, hoy, +30, +31, realizado y cancelado, vacíos y paginación independiente. Registrar una aplicación real ficticia con y sin otra fecha indicada; cancelar otra con motivo. Comparar agenda/dashboard/historia tras guardar, volver y avanzar.
3. Revisar doble clic/red lenta, foco y teclado dentro de formularios y details; errores claros sin perder datos. Confirmar que el archivado muestra antecedentes/auditoría sin acciones de escritura, y que otros roles/refugios reciben denegación.
4. Consultar auditoría antes/después y paginar sin perder el animal; revisar fecha/hora y lectura de datos largos. Guardar capturas sin datos reales. SSR/HTTP no prueban eventos, zoom, dispositivos ni ausencia de desbordamiento.

Revisión solicitada por responsabilidad en PR/issue: **1 principal**, presentación, componentes y accesibilidad; **2 permisos/rutas y revisión del contrato de actor**; **3 migración, modelo de datos e indicadores**. No se inventan sus cuentas GitHub ni se da por aprobada esa revisión. Por estos pendientes el PR se publica en borrador y #5 permanece abierto.

Para compañeros que necesiten la mejora antes de integrar: partir de `origin/feature/equipo-4-salud-entrega`, en el SHA final registrado en el PR, conservando sus ramas existentes. Depende de #9; no incluye #10/#11 ni autoriza un merge automático. Revisar especialmente rutas de health, tipos opcionales, User/policies de suspensión e integración del contador nuevo en el dashboard de 3.

La publicación futura requiere decisión del equipo sobre servidor/dominio, responsables de operación y retención de backups, persistencia de DB/Storage, proveedor/remitente de correo y credenciales autorizadas. No se probaron HTTPS público, SMTP real, dispositivos, carga o despliegue. No hay una decisión clínica imprescindible bloqueante: el flujo solo registra hechos y fechas indicados explícitamente por personas autorizadas.
