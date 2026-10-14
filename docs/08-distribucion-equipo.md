# Distribución del equipo — segunda etapa

Plan basado en el código de `feature/plataforma-refugio` (`de50fcd`) y las correcciones de `review/revision-equipo`. No se propone reconstruir el sistema. El PR #1 sigue abierto en borrador; `main` contiene solamente la presentación inicial del repositorio. **Todavía no crear ramas de implementación desde main**, porque no incluye Laravel.

La revisión real, las limitaciones y la matriz manual están en [09-revision-plataforma.md](09-revision-plataforma.md). Las responsabilidades siguientes son lógicas; el equipo debe asociarlas con sus nombres y usuarios GitHub. No se inventaron asignaciones nominales.

Entrega de esta etapa: [PR #6](https://github.com/franbareuther/Proyecto-Final-UTN/pull/6), en borrador, con base `feature/plataforma-refugio`. No contiene un merge a main ni modifica el estado del PR #1.

## Propiedad de archivos y coordinación

Cada fila tiene un solo responsable principal. Otros integrantes pueden proponer cambios mediante PR, con revisión del propietario. La carpeta `Admin` no define por sí sola la responsabilidad de negocio.

| Área / archivos existentes | Propietario principal | Consultar a |
|---|---|---|
| `resources/js/Pages/Public/*`, `app/Http/Controllers/CatalogController.php` | 1 | 3 por campos del animal |
| `resources/js/Components/*`, `resources/js/Layouts/*`, `resources/css/app.css` | 1 | Consumidor del componente |
| `resources/js/types/*`, `resources/js/app.tsx`, `resources/js/bootstrap.ts`, `resources/views/app.blade.php` | 1 | 2, 3 o 4 por contratos de datos |
| `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `.prettierrc.json` | 1 | 4 por CI |
| `resources/js/Pages/Auth/*`, `Pages/Profile/*`, `Pages/Adoptante/*` | 2 | 1 por UX |
| `resources/js/Pages/Admin/Requests.tsx`, `Admin/Adoptions.tsx` | 2 | 3 por enlaces del panel |
| `Controllers/Auth/*`, `ProfileController.php`, `AdoptionRequestController.php` | 2 | 4 por seguridad |
| `Requests/Auth/*`, `ProfileUpdateRequest.php`, `StoreAdoptionRequest.php`, `RequireRole.php`, `AdoptionRequestPolicy.php`, `Services/AdoptionService.php` | 2 | 3 por disponibilidad |
| `Models/User.php`, `AdoptionRequest.php`, `Adoption.php`, `AdoptionRequestHistory.php`, `factories/UserFactory.php`, `Console/Commands/CreateStaff.php` | 2 | 4 por permisos |
| `routes/web.php`, `routes/auth.php`, `bootstrap/app.php`, `HandleInertiaRequests.php` | 2 | Responsable del módulo afectado |
| `resources/js/Pages/Admin/Animals.tsx`, `Admin/AnimalForm.tsx`, `Admin/Dashboard.tsx` | 3 | 1 por UX, 2 por estados |
| `AnimalController.php`, `DashboardController.php`, `AnimalRequest.php`, `AnimalPolicy.php`, `Models/Animal.php`, `Models/AnimalPhoto.php`, `factories/AnimalFactory.php` | 3 | 2 por adopciones, 4 por relaciones clínicas |
| `database/seeders/*`, migraciones existentes, `config/shelter.php`, `public/images/*`, `config/filesystems.php` | 3 | 2 y 4 por coherencia demo |
| `resources/js/Pages/Veterinaria/*`, `MedicalController.php`, `MedicalRequest.php` | 4 | 1 por UX, 2 por roles |
| `Models/MedicalConsultation.php`, `Vaccination.php`, `Treatment.php`, `VeterinaryControl.php` | 4 | 3 por Animal |
| `tests/Feature/Auth/*`, `ProfileTest.php`, `AdoptionNavigationTest.php` | 2 | 4 como revisor |
| Suite heredada `tests/Feature/ShelterTest.php`, `ExampleTest.php`, `tests/Unit/*`, `tests/TestCase.php`, `phpunit.xml`, `.env.testing.example`, `.github/workflows/ci.yml`, `scripts/review-http.php` | 4 | Autor de la función probada |
| `README.md`, `CONTRIBUTING.md`, `.env.example`, `docs/06-instalacion.md`, este plan y matriz de revisión | 4 | Los tres responsables de módulo |
| `docs/01` a `docs/03`, `docs/05`, `config/auth.php` y `config/session.php` | 2 | Resto del equipo |
| `docs/04-base-de-datos.md`, `docs/creditos-imagenes.md` | 3 | 2 y 4 |
| `docs/07-plan-de-desarrollo.md` e informes de ejecución | 4 | Todos |

Las rutas anteriores abreviadas conservan su raíz Laravel: Controllers/Requests bajo `app/Http`, Policies/Models bajo `app`, factories/seeders bajo `database`. `RequireRole.php` y `HandleInertiaRequests.php` están en `app/Http/Middleware`.

Las nuevas pruebas deben separarse por módulo: `tests/Feature/Catalog/` (1), `Adoptions/` (2), `Admin/` (3), `Veterinary/` (4). Son **directorios propuestos**, todavía no creados. Evitar que los cuatro editen simultáneamente ShelterTest. Una nueva migración pertenece al autor de la funcionalidad y tiene un nombre único; el integrante 3 revisa su integridad, sin convertirse en coautor obligatorio del archivo. No modificar la migración de dominio ya aplicada.

`Components/Shelter.tsx` concentra layout, tarjetas, fechas, listas y confirmaciones. El integrante 1 mantiene su interfaz compartida. Si otro integrante necesita cambiarla, acuerda primero props y comportamiento, y evita copiar o bifurcar componentes. La extracción futura de componentes se hará en un PR pequeño y justificado, conservando imports y comportamiento durante la transición.

## Integrante 1 — Frontend y UX

**Responsabilidad:** Home, catálogo, filtros, perfiles, navegación, componentes visuales, responsive y accesibilidad. También mantiene la consulta pública de CatalogController para que filtros e interfaz evolucionen juntos; no modifica las escrituras de animales.

**Ya desarrollado:** Home con hero, destacados e información; catálogo filtrado y paginado; perfil con galería, estado y salud pública; navbar/sidebar responsive por clases CSS; componentes de mensajes, formularios y confirmación. Esta etapa añade título accesible a confirmaciones y coherencia de edad entre tarjeta y perfil. La existencia de clases responsive no acredita una revisión visual.

**Próximas tareas:** ejecutar primero la matriz manual en los tres tamaños; adjuntar evidencias de navegación, recortes de fotos, textos largos, menú, foco y zoom. Comprobar visualmente los cuatro módulos con sus autores. Documentar cada cambio importante con problema, captura, propuesta y criterio de éxito. Evaluar después navegación activa, diferenciación de badges y consistencia de traducciones; no rediseñar toda la plataforma de una vez.

**Archivos principales:** primera, segunda, tercera y cuarta filas de la tabla de propiedad. No asumir responsabilidad sobre formularios clínicos o decisiones de adopción por el hecho de ser React.

**Dependencias:** 3 suministra campos/fotos/disponibilidad; 2 mantiene permisos y los props de autenticación; 4 mantiene páginas clínicas y CI. Acordar con ellos cambios de tipos y componentes antes de integrar.

**Aceptación:** Home y catálogo cargan sin errores de consola; filtros reflejan la URL y resultados, con paginación y limpiar operativos; tarjeta y perfil no contradicen edad/estado; fotos y respaldo visibles; menú utilizable y sin superposiciones a 1440×900, 768×1024 y 390×844; sin scroll horizontal de página por contenido normal. Teclado, foco, cierre de diálogo y zoom 200% comprobados y registrados. La tabla administrativa puede tener desplazamiento horizontal dentro de su contenedor.

**Pruebas:** `npm run build`, suite PHP, futuros tests de catálogo con combinaciones/fechas límite, matriz manual con capturas. No marcar como aprobados responsive, contraste o lector de pantalla sin ejecutarlos.

**Rama inicial recomendada:** `feature/ux-responsive-catalogo`. Abrir después una rama por mejora concreta. **Issue:** [#2](https://github.com/franbareuther/Proyecto-Final-UTN/issues/2). **Revisor principal:** 3; para accesibilidad también 4.

## Integrante 2 — Autenticación y adopciones

**Responsabilidad:** usuarios, roles, sesión, solicitudes, evaluación, estados, historial y adopciones definitivas. Mantiene las rutas como punto único de integración de propuestas de los otros módulos.

**Ya desarrollado:** registro público de adoptantes, login/logout y perfil; recuperación por correo configurada con log local; middleware/policies; formulario asociado a identidad de sesión; solicitudes propias; revisión administrativa; aprobación separada de la adopción; historial con actor y motivos; transacciones y bloqueo por animal. La corrección de esta etapa devuelve el formulario no disponible al perfil con explicación, sin modificar las transiciones.

**Próximas tareas:** revisar el recorrido con distintos adoptantes; diseñar pruebas concurrentes con conexiones/procesos separados en un entorno desechable; traducir pantallas auxiliares de autenticación y errores genéricos. Proponer configuración SMTP por separado si el equipo necesita entrega real de recuperación. Revisar qué motivos visibles puede escribir el administrador para evitar incluir notas internas sensibles.

**Archivos principales:** Controllers/Auth, ProfileController, AdoptionRequestController; Requests/Auth, ProfileUpdateRequest, StoreAdoptionRequest; RequireRole y AdoptionRequestPolicy; AdoptionService y los cuatro modelos del módulo; Pages/Auth, Profile, Adoptante y **Admin/Requests y Admin/Adoptions**; routes/web y auth. Tests/Auth, ProfileTest y AdoptionNavigationTest. Detalle de propiedad en tabla.

**Dependencias:** 1 mantiene Shell, Confirm, Field y tipos; 3 mantiene la disponibilidad del CRUD y la entidad Animal; 4 revisa permisos y el soporte de pruebas. Toda escritura de adopciones debe continuar pasando por AdoptionService; no duplicar transiciones en controladores o React.

**Aceptación:** registro público nunca crea personal; sesiones y errores funcionan; adoptante solo ve sus solicitudes; veterinario no accede a solicitudes ni administración; una sola aprobación/adopción por animal incluso bajo concurrencia; rechazos terminales y cierre de otras solicitudes con motivo visible. La aprobación no crea adopción definitiva. Datos históricos conservados; volver desde un enlace desactualizado de solicitud muestra un mensaje entendible.

**Pruebas:** suites Auth/Profile/AdoptionNavigation y futura Adoptions; prueba de duplicados, estados, autoría, concurrencia, privacidad y flujo completo; build; revisión manual con 1. Toda prueba destructiva de fixtures se limita a memoria o a un servicio desechable creado expresamente, nunca a MariaDB compartido del grupo.

**Rama:** `feature/adopciones-concurrencia`. **Issue:** [#3](https://github.com/franbareuther/Proyecto-Final-UTN/issues/3). **Revisor principal:** 4; 3 revisa disponibilidad.

## Integrante 3 — Administración y dashboard

**Responsabilidad:** gestión de animales, fotos, disponibilidad ordinaria, panel e indicadores. Mantiene Animal y AnimalPhoto, con revisión de 2/4 cuando cambien relaciones con adopciones o clínica.

**Ya desarrollado:** alta/edición, archivo lógico, carga real con formato/tamaño/cantidad validados, imagen principal y eliminación; protección del estado reservado/adoptado frente a edición manual; búsqueda de animales; dashboard con seis contadores, tres gráficos y actividad. `Animal::count()` excluye archivados; el contador de adopciones usa todos los registros históricos.

**Próximas tareas:** cotejar indicadores con consultas y acordar por escrito si “Animales registrados” debe incluir archivados; verificar búsquedas, tablas y fotos en la matriz manual; reproducir si el selector de archivos conserva nombres después de un envío exitoso y corregir solo si se confirma el problema. Evaluar restauración de archivo con política acordada y sin borrar historial. Cambiar datos demo solo de forma explícita en una copia personal.

**Archivos principales:** AnimalController, DashboardController, AnimalRequest, AnimalPolicy, Animal y AnimalPhoto; Admin/Animals, AnimalForm y Dashboard; AnimalFactory, DemoSeeder, configuración de Storage, fotos demo y documentación ER. No mantiene Admin/Requests ni Admin/Adoptions.

**Dependencias:** 1 define componentes/estilos, 2 reserva/adopta el animal, 4 aporta tratamientos y controles a estadísticas. Un cambio de estado protegido requiere revisión de 2. Los contratos de indicadores clínicos requieren revisión de 4.

**Aceptación:** fotografías válidas persisten y se sirven; inválidas y fotos de otro animal son rechazadas; la imagen principal es coherente; edición no libera una reserva ni modifica una adopción; no se archivan animales con solicitudes activas; historial intacto. Dashboard coincide con una definición documentada y fixtures reproducibles, sin números simulados. Buscar/editar es utilizable en los tres tamaños.

**Pruebas:** CRUD, formatos/límites, foto principal/eliminación/respaldos, archivo con solicitudes, reservas protegidas y dashboard con distintos estados, vacíos y animales archivados; futura carpeta Admin; suite completa y build. Para escenarios manuales de escritura usar la base personal de demostración, no la compartida.

**Rama:** `feature/admin-fotos-dashboard`. **Issue:** [#4](https://github.com/franbareuther/Proyecto-Final-UTN/issues/4). **Revisor principal:** 2; 1 revisa presentación.

## Integrante 4 — Veterinaria y calidad

**Responsabilidad:** historia clínica, consultas, vacunas, tratamientos, controles, agenda y validaciones clínicas; mantenimiento de infraestructura de calidad. Cada integrante sigue siendo responsable de probar sus propios cambios.

**Ya desarrollado:** consulta interna para admin/veterinario; carga de cuatro tipos de registros para veterinario; corrección solo por autor; validación de fechas y estados; controles vencidos/próximos y dosis hasta 30 días; suite transversal, CI MySQL y script local de recorrido HTTP. En esta etapa se añadió la visualización de errores del buscador veterinario.

**Próximas tareas:** verificar agenda y formularios manualmente; acordar cómo indicar que una próxima dosis ya fue aplicada (hoy se lista next_dose_date sin vínculo con su cumplimiento); proponer auditoría detallada de correcciones y consulta clínica de animales archivados. No inventar tratamientos ni diagnósticos automáticos. Coordinar pruebas concurrentes con 2 y apoyar sin apropiarse de sus archivos.

**Archivos principales:** MedicalController, MedicalRequest, MedicalConsultation/Vaccination/Treatment/VeterinaryControl, Pages/Veterinaria; ShelterTest heredado, TestCase, phpunit.xml, workflow CI, scripts/review-http.php y documentos de instalación/revisión. Solicitar a 3 cualquier cambio en relaciones de Animal.

**Dependencias:** 2 mantiene roles; 3 mantiene Animal y estadísticas que consumen clínica; 1 mantiene tipos y componentes visuales. Un cambio en vencimientos necesita acuerdo clínico y su impacto en dashboard antes de migrar datos.

**Aceptación:** adoptante sin acceso a clínica; admin consulta sin poder registrar; veterinario registra y solo autor corrige; fechas inválidas devuelven mensajes visibles; controles realizados no figuran como pendientes; la política de dosis completadas queda definida y probada antes de cambiar el esquema. Se preservan antecedentes. CI, build y suite pasan; toda comprobación manual tiene evidencia o estado pendiente.

**Pruebas:** fecha de aplicación/consulta futura, próxima dosis previa, final de tratamiento anterior al inicio, vencidos/hoy/próximos, autor ajeno y registro de otro animal, privacidad pública y estados vacíos. Futura carpeta Veterinary; script HTTP sobre servidor local, que consulta el dominio y solo cambia sesiones. Pruebas de escrituras con fixtures en memoria/servicio desechable.

**Rama:** `feature/veterinaria-agenda-calidad`. **Issue:** [#5](https://github.com/franbareuther/Proyecto-Final-UTN/issues/5). **Revisor principal:** 1; 2 para permisos.

## Orden seguro de integración

1. Congelar cambios grandes en `feature/plataforma-refugio`. Los cuatro revisan PR #1 por su módulo; 4 centraliza resultados, sin aprobarse a sí mismo.
2. Revisar el PR de `review/revision-equipo` **contra feature/plataforma-refugio**. Es un PR dependiente: así muestra solo correcciones y documentos, sin repetir toda la aplicación contra main. Esta ejecución no hace merge, no cierra ni marca como listo el PR #1.
3. Tras aprobación y autorización del equipo, un mantenedor integra primero ese PR en feature/plataforma-refugio. Revalidar el PR #1 actualizado: CI y matriz visual/manual con cuentas demo. Registrar pendientes aceptados y bloqueantes. No aprobar como “revisión visual completa” el recorrido HTTP.
4. Cuando el equipo autorice la integración inicial, un mantenedor cambia el PR #1 de borrador a revisión y lo integra en main después de las revisiones y checks requeridos. Esta es una decisión humana, no una acción automática del agente.
5. Cada integrante actualiza main y crea una rama por funcionalidad desde ese punto común. Evitar cuatro ramas largas que acumulen módulos enteros; dividir las Issues en subtareas si los PR se vuelven difíciles de revisar. Mantener el padre Issue abierto hasta verificar todos sus criterios.

```powershell
# Solo después de que el equipo haya integrado la aplicación inicial
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/ux-responsive-catalogo
```

Antes de esa integración se puede **inspeccionar** la implementación mediante `git switch --track origin/feature/plataforma-refugio`; no crear un main local con la aplicación ni publicar cambios de funcionalidad en main para adelantar el proceso.

Revisiones cruzadas: 1 revisa 4; 4 revisa 2; 2 revisa 3; 3 revisa 1. Cambios de permisos, migraciones y componentes compartidos requieren además revisión de su propietario. El autor adjunta comandos/resultados, rutas afectadas, evidencia visual cuando corresponda y limitaciones. Quien resuelva un conflicto ejecuta de nuevo los checks del conjunto resultante.

Cada tarea debe tener una Issue con responsable lógico, alcance, archivos, dependencias, aceptación y evidencia. Se consultaron todas las Issues existentes antes de crear #2–#5: solo existía PR #1. No duplicarlas; reutilizarlas y registrar subtareas si cambia el alcance. No se usan `Closes` en el PR de revisión, porque las cuatro tareas todavía deben ejecutarse.

No se configuraron branch protections ni CODEOWNERS con identidades inventadas. El equipo puede activar revisión obligatoria y checks de calidad para main cuando confirme mantenedores; el plan no presupone que ya estén activos.

## Ejecución local para los cuatro integrantes

Durante revisión inicial, elegir la rama existente antes de instalar; después de integrar PR #1 usar main. Cada integrante usa **su propio** .env, base y archivos de Storage. No copiar `.local/mysql` ni compartir credenciales, datos de personas o el .env de otra computadora.

```powershell
git clone https://github.com/franbareuther/Proyecto-Final-UTN.git
cd Proyecto-Final-UTN
git switch --track origin/feature/plataforma-refugio
composer install
npm ci
# Solo si no existe .env:
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

PHP >=8.2 con extensiones Laravel y PDO MySQL/ZIP; Composer 2 y Node 24. Seguir [06-instalacion.md](06-instalacion.md). Antes de ejecutar Artisan, configurar .env con las credenciales reales. En la computadora revisada **se conserva DB_PORT=3307**, DB_CONNECTION=mysql y DB_DATABASE=refugio_animales; MariaDB ya está en ejecución y no se reinicializa. En otra computadora el servicio debe estar iniciado en su puerto local acordado; no confundir el 3306 del ejemplo con el puerto real.

En una instalación personal nueva, crear su base desde phpMyAdmin, generar APP_KEY si falta y aplicar `php artisan migrate` (sin fresh/reset). DemoSeeder es opcional, explícito y solo local, con DEMO_PASSWORD personal. No ejecutarlo durante una revisión de datos ya existentes. Ejecutar storage:link solo si falta el enlace. En la computadora actual ya hay clave, tablas, demo y enlace: **no repetir inicialización**.

```powershell
# Terminal de Laravel; no iniciar un duplicado si ya responde en 8000
php artisan serve --host=127.0.0.1 --port=8000
# Otra terminal
npm run dev
```

Abrir http://localhost:8000. En esta revisión Laravel 8000 y Vite 5173 ya respondían; no fue necesario relanzarlos. Usar las cuentas demo documentadas y la contraseña local elegida; no enviarla en Issues o capturas. Para personal real existe `php artisan shelter:create-staff`, fuera del registro público.

En otra terminal exclusiva para pruebas, forzar memoria sin editar .env:

```powershell
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
php artisan test
npm run build
php vendor/laravel/pint/builds/pint --test --repair
```

Cerrar esa terminal al terminar. Los tests recrean únicamente la base efímera en memoria. CI utiliza su propio contenedor desechable MySQL. En esta revisión no se ejecutaron pruebas contra una base persistente ni migraciones/seeders. Para el recorrido HTTP, desde una terminal normal sin esas variables de testing ejecutar `php scripts/review-http.php`; no es una prueba visual y necesita las cuentas demo existentes.
