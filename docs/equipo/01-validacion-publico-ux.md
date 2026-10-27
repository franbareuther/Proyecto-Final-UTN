# Validación del sitio público — Laureano, issue #2

Fecha: 14 de octubre de 2026. Rama: `feature/equipo-1-publico-ux`.
Actualización final de implementación: imagen opcional del refugio; ver resultados y contrato al final de este informe. Los resultados iniciales se conservan como antecedente.
Base publicada: `origin/feature/huella-multirrefugio`, commit `3c3e0fc`.
Entrega publicada: [PR #9 en borrador](https://github.com/franbareuther/Proyecto-Final-UTN/pull/9), con `Refs #2` y revisión solicitada por responsabilidad en la descripción. El conector devolvió 403 al crearlo; se publicó mediante la autenticación Git existente, sin mostrar credenciales.
Los PR #7 y #8 continúan abiertos y sin integrar; esta entrega depende de ellos y propone su diff contra la base multirrefugio.

## Diagnóstico y alcance

**Implementado en la base:** inicio con animales y refugios, ambas entradas del menú, directorio, perfil institucional, catálogo global y por institución, perfil del animal, fotos ordenadas con principal primero, respaldo de imagen, etiquetas y errores compartidos, menú con Escape y tres roles. Existencia de código no acredita interacción en navegador.

**Problemas encontrados por inspección:** el catálogo institucional recibía `city` y `shelter` en los props aunque su consulta los ignoraba; los chips podían presentarlos como efectivos. `useForm` conservaba su estado al buscar sin volver a sincronizar los controles con los props. Una raza de URL ausente de las opciones no tenía representación seleccionable. El footer sin institución apuntaba al directorio; algunos textos seguían describiendo Huellitas como refugio. La paginación no desempató animales creados en el mismo instante.

**Verificado automáticamente tras la corrección:** aislamiento de institución y canonicalización de URL; cada filtro excluye independientemente registros no coincidentes; combinación de los ocho filtros; paginación global e institucional; orden estable; inactivos y archivados excluidos; resultados vacíos; límites de edad por fecha y estimación; validación de búsqueda; nombre extenso, principal y respaldo sin foto; ambos perfiles con institución correcta; ausencia de solicitudes y relaciones clínicas internas. Los tests de frontend verifican contratos renderizados, no eventos ni layout.

**Pendiente:** toda la matriz de navegador de esta entrega, incluida la interacción de sincronización, galería, fallos de red, menú, foco, zoom y capturas. No se considera completado el issue #2.

## Cambios y contratos

- `/refugios/sur/animales?shelter=norte&city=Córdoba&species=Gato&page=2` redirige a `/refugios/sur/animales?species=Gato&page=2`. El refugio de la ruta es el responsable; se quitan parámetros de red antes de validarlos, incluso si llegan como arrays. Los demás filtros y la página se conservan.
- El frontend institucional tampoco presenta ni propaga esos filtros. Al enviar el formulario se omiten campos vacíos y filtros de red en instituciones.
- Catálogo y directorio sincronizan sus controles con los filtros recibidos al navegar. Los valores válidos de URL ausentes de las opciones se muestran como «sin coincidencias» y pueden quitarse. El chip de refugio muestra su nombre.
- El orden del catálogo usa fecha descendente e id descendente para evitar empates indeterminados entre páginas.
- El inicio explica que Huellitas conecta y que la institución cuida y evalúa solicitudes. El footer mantiene los dos recorridos, con destinos rotulados correctamente. El shell conserva el catálogo institucional cuando corresponde.
- Se permite corte de textos públicos extensos en párrafos, enlaces y datos del perfil; no se acredita ausencia de desbordamiento sin navegador.

No hay migraciones, cambios de esquema, tipos, reglas de adopción, permisos ni escrituras de dominio. No se cambiaron pantallas de Auth/Adoptante, Admin/Superadmin o Salud. `Shell` conserva props e imports; sus consumidores necesitan revisar los destinos públicos y el rótulo de marca.

Los casos nuevos están separados en `tests/Feature/Catalog/PublicUxTest.php` y `tests/Frontend/public-ux.test.mjs`. Se conserva la suite previa. En `CatalogAndThreeRolesTest.php` solo se agrega `followingRedirects()` a la comprobación de URL institucional forjada para conservar su aserción de resultados tras la nueva redirección; solicitar revisión de calidad al integrante 4.

## Resultados ejecutados

En PowerShell, variables limitadas al proceso de pruebas; `.env` no se edita:

```powershell
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
$env:DB_URL=''
php artisan test --compact
php vendor/laravel/pint/builds/pint --test
```

Resultado: **69 pruebas PHP, 758 aserciones, sin fallos; Pint aprobado**.

```powershell
npm.cmd run test:frontend
npm.cmd run build
node node_modules/prettier/bin/prettier.cjs --check resources/js/Pages/Public/Catalog.tsx resources/js/Pages/Public/Home.tsx resources/js/Pages/Public/Shelters.tsx resources/js/Components/Shelter.tsx resources/css/app.css tests/Frontend/public-ux.test.mjs
git diff --check
```

Resultado: **21 pruebas frontend aprobadas, TypeScript y Vite aprobados, Prettier y diff aprobados**. Se usa `npm.cmd` porque PowerShell bloquea `npm.ps1`; no se cambia la política del sistema ni se reinstalan dependencias.

La primera ejecución PHP dio 58 aprobadas y 4 fallidas por el manifiesto local anterior, que no incluía páginas multirrefugio. Compilar la rama actual resolvió esos fallos. Los assets compilados están ignorados.

La suite SSR heredada comprueba los pares de marca usados en texto: bosque/marfil 11,31:1; terracota/marfil 5,36:1; blanco/bosque 11,90:1; terracota/fondo hero 4,72:1. No equivale a auditar todos los estilos computados ni el foco en navegador.

## Evidencia de navegador y pasos pendientes

Se intentó conectar el navegador de la sesión: IAB y Chrome no estaban disponibles en CUA. La habilidad Computer Use local pudo enumerar Chrome y seleccionar la ventana del prompt, pero no obtuvo árbol de accesibilidad. Al intentar preparar una pestaña, el control se detuvo automáticamente con este motivo: «could not determine the current browser URL on Windows with enough confidence to enforce policy». Se detuvo toda entrada de UI, conforme a la instrucción de la habilidad: «If Computer Use reports that the turn ended or that the user stopped Computer Use, stop issuing app input».

**No se tomaron capturas de la aplicación ni se ejecutó una prueba visual aprobada.** No se atribuyen a esta entrega capturas históricas ni renderizado SSR como evidencia de navegador. No hubo rechazo de una publicación o solicitud de permiso: fue una interrupción del mecanismo de control.

Ejecutar con datos ficticios en una instalación desechable, sin migrar ni sembrar la base existente:

| Caso | Pantallas | Estado en esta entrega |
|---|---|---|
| 1440×900 | Inicio, catálogo general, directorio, perfil de refugio, catálogo institucional y perfil de animal | Pendiente |
| 768×1024 | Las mismas seis pantallas | Pendiente |
| 390×844 | Las mismas seis pantallas | Pendiente |
| 320 px de ancho | Las mismas pantallas, nombres extensos y vacíos | Pendiente |
| Zoom real 200% | Las mismas pantallas, menú y formularios | Pendiente |

1. Desde inicio, abrir «Animales en adopción», combinar nombre/especie/raza/tamaño/edad/disponibilidad/ciudad/refugio, enviar, comparar URL, controles, chips y registros. Quitar cada chip, limpiar, paginar, volver y avanzar en historial. Repetir búsqueda en directorio y limpiar.
2. Abrir el mismo animal desde el directorio → refugio → catálogo y desde el catálogo general. Comparar id y nombre del refugio; abrir su perfil institucional. Probar la URL forjada del ejemplo, incluidas variantes `city[]`/`shelter[]`: debe terminar sin parámetros de red y con el mismo refugio.
3. Recorrer fotos principal, siguiente/anterior y miniaturas. Simular una imagen inaccesible en herramientas de red y verificar el respaldo sin bucle; probar cero fotos, lista vacía, nombre largo sin espacios y refugio sin teléfono/correo. No cambiar fotografías reales.
4. Recorrer todo con Tab y Shift+Tab, activar enlaces/botones con teclado, usar salto al contenido, abrir menú y cerrar con Escape comprobando retorno del foco. Revisar etiquetas y mensajes de error. Medir ancho de documento respecto del viewport y guardar capturas completas sin datos personales.
5. Con zoom real del navegador a 200%, repetir navegación y formularios; un viewport reducido por sí solo no acredita zoom. Registrar navegador/versión, viewport, zoom, pasos, esperado/observado y archivos de captura. Revisar contraste computado y visibilidad del foco.
6. Coordinar revisión del shell con los consumidores Auth/Adoptante (2), Admin/Superadmin (3) y Salud (4), incluyendo confirmaciones existentes; sin implementar sus pantallas.

## Revisión y decisiones del equipo

Se solicita revisión principal del integrante 3; apoyo del 4 en accesibilidad y adaptación del test heredado; revisión adicional del 2 por el shell compartido, y del 4 como consumidor de Salud. No se modifican props ni tipos compartidos.

El usuario informó los nombres León Comolli, Luciano Brea y Francisco Bareuther, pero no conoce su correspondencia con integrantes 2–4. Sus usuarios de GitHub y esa correspondencia quedan por confirmar; no se inventan asignaciones ni se afirma que haya una solicitud nominal enviada.

Git estaba limpio antes de cambiar de rama. Se actualizó `origin` con fetch y se creó una rama nueva, sin sobrescribir ramas ni hacer merges. Se verificó que `.env` conserva su hash durante el trabajo. No se aplicaron migraciones, seeders ni escrituras sobre MariaDB; no se tocaron APP_KEY, fotografías o historiales. Todas las escrituras de pruebas fueron en SQLite en memoria. No se enviaron correos reales, ni se probaron concurrencia real, despliegue o MySQL en esta entrega.

## Imagen opcional del refugio — implementación final

Se conserva el diseño existente. El superadministrador carga la imagen al crear o editar cualquier refugio. El administrador carga, reemplaza o quita la imagen únicamente desde «Mi refugio». La autorización está en middleware y controller; no se acepta seleccionar una institución ajena desde el formulario. No cambia la gestión de adopciones, animales, personal o salud.

`ShelterForm` conserva sus props `shelter` y `admin`. Envía siempre `POST` multipart con `forceFormData` y `_method=patch` en edición, siguiendo el patrón existente de carga de fotos. El selector muestra el archivo pendiente, permite descartarlo, revoca la URL temporal y se vacía después de un guardado exitoso. Quitar una imagen es reversible antes de guardar. La vista previa distingue fotografía y logo y advierte que los cambios se publican al guardar. Los mensajes de validación de imágenes están en español; los mensajes de éxito del refugio se conservan.

`ShelterImage` presenta un marco 16:9: fotografía con `object-cover`, logo con `object-contain`, espacio interior y fondo neutro para transparencia. Ante ausencia o error muestra un respaldo con icono y texto. No elimina el nombre, ciudad, descripción ni enlaces de las tarjetas. El mismo componente se usa en inicio, directorio y perfil público, además de la vista previa.

### Migración y contrato para el equipo

Nueva migración: `database/migrations/2026_10_14_000004_add_shelter_image.php`. Agrega `shelters.image_path` nullable y `shelters.image_type` con valor inicial `photo`. No cambia migraciones previas, asignaciones, fotografías ni historiales. Los refugios anteriores conservan sus datos y funcionan sin imagen después de aplicar la migración.

| Contrato | Uso |
|---|---|
| `image` | Archivo opcional de entrada: JPEG, PNG o WebP, hasta 5120 KB; dimensiones legibles. PNG admite transparencia. SVG, GIF, texto y archivos falsificados se rechazan. |
| `image_type` | `photo` o `logo`; puede cambiarse conservando el archivo actual. |
| `remove_image` | Booleano de entrada; quitar y subir simultáneamente se rechaza. |
| `image_path` | Ruta interna generada por el servidor en `shelters/` del disco `public`. Está prohibido enviarla desde el cliente. No es mass assignable. |
| `image_url` | Prop calculado por Shelter, nullable; nunca se acepta como entrada. |
| `Refuge.image_url`, `Refuge.image_type` | Campos opcionales aditivos en TypeScript, compatibles con consumidores anteriores. |
| `ShelterImage` | Props `src`, `name`, `kind` (`photo`/`logo`) y `className` opcional. |

El catálogo del inicio selecciona los nuevos campos para construir la misma URL del directorio y del perfil. Las imágenes se guardan con nombres aleatorios, nunca con rutas o nombres elegidos por el cliente. La carga nueva ocurre antes de la transacción; se conoce su ruta incluso si falla la escritura. Un error o cancelación de guardado limpia el archivo nuevo y conserva el anterior. El registro se bloquea durante la actualización. Solo después del commit se retira el archivo anterior, y únicamente si su ruta tiene el formato generado bajo `shelters/`; nunca se borran rutas de animales.

Como en cualquier almacenamiento de archivos, un fallo físico al eliminar o una interrupción del proceso entre DB y filesystem requiere reconciliación operativa. No se afirma atomicidad distribuida ni recuperación frente a caída del sistema. Se probaron explícitamente los fallos normales de guardado y su limpieza.

En una **instalación desechable de prueba con base y Storage propios**, sin reutilizar MariaDB ni la base local original, compilar y aplicar las migraciones pendientes:

```powershell
npm.cmd run build
# Solo con la conexión apuntando a la base exclusiva de esa instalación de prueba:
php artisan migrate
```

No necesita seeder ni credenciales nuevas para mostrar el sitio público. No usar fresh/reset/rollback. En esta ejecución la migración se aplicó únicamente a una copia desechable `.local/pr9-image/preview_testing.sqlite`, con Storage y sesiones separados. La base de la demo anterior `.local/pr9-manual/preview_testing.sqlite` se conservó; para la mejora usar **http://127.0.0.1:8016/**. Las cuentas ficticias de esa instancia están en `.local/pr9-image/accounts.json`, ignorado por Git; no se publican contraseñas. Los archivos locales de preparación no forman parte de la entrega.

### Verificación final ejecutada

- `php artisan test --compact`, con `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:` y `DB_URL` vacío: **76 pruebas, 859 aserciones, aprobadas**.
- `npm.cmd run test:frontend`: **24 pruebas aprobadas**. Son contratos SSR, sin eventos de navegador.
- `npm.cmd run build`: TypeScript/Vite aprobados. Pint, Prettier de los archivos modificados y `git diff --check`: aprobados.
- Casos nuevos en `tests/Feature/Catalog/ShelterImageTest.php`: formatos permitidos, multipart en alta/edición, formatos y tamaño inválidos, rutas forjadas, reemplazo, eliminación, conservar imagen sin nueva carga, acceso ajeno/adoptante, archivo nuevo sin huérfanos ante excepción/cancelación del guardado, fotos de animales intactas, refugios sin imagen y props de las tres ubicaciones públicas. Los fixtures de imagen usan bytes reales sin requerir GD.
- `tests/Frontend/shelter-image.test.mjs` verifica las tres ubicaciones con imagen/nombre/enlace, texto alternativo, ausencia de imagen y campos de ambos consumidores administrativos. No repite el CSS como prueba de layout.
- Recorrido **HTTP real**, con cookies, CSRF y FormData contra 8016, sobre SQLite y Storage desechables: alta, reemplazo y eliminación por superadmin; carga, reemplazo y eliminación del refugio propio por admin; PNG transparente y JPEG servidos con 200; imagen correcta en inicio, directorio y perfil; adoptante recibe 403. Resultado local en `.local/pr9-image/http-result.json`. Esto comprueba multipart en PHP real, no interacción visual ni selector del navegador.

Se volvió a intentar Computer Use. Chrome pudo enumerarse, pero la captura del estado del navegador fue bloqueada de nuevo por no poder verificar su URL con confianza. Se detuvo la UI. **No hay nuevas capturas ni comprobaciones visuales aprobadas**, aunque el usuario haya valorado favorablemente el diseño anterior.

### Pendiente preciso antes de completar #2

1. En 1440×900, 768×1024, 390×844 y 320 px, cargar/reemplazar/quitar una foto horizontal y una vertical y un PNG transparente desde ambos paneles. Confirmar vista previa, logo completo sin deformación, recorte uniforme de foto, nombre largo y respaldo sin imagen/ante 404 en las tres ubicaciones públicas. Capturar con datos ficticios.
2. Guardar y verificar que el selector queda vacío, la imagen publicada coincide y los errores de formato/5 MB permiten corregir el archivo. Probar descartar archivo y deshacer «quitar» antes de guardar.
3. Completar la matriz pública anterior: filtros/chips/limpiar/paginación/historial, galería y miniaturas de animal, teclado/foco/menú con Escape, contraste computado y zoom real 200%, sin desbordamiento horizontal de página. Adjuntar capturas y pasos; SSR/HTTP no sustituyen estos casos.
4. Revisión principal del integrante 3 por Shelter, ShelterController, migración y consumidores administrativos; integrante 4 por accesibilidad/calidad; integrantes 2 y 4 por contratos compartidos. La correspondencia de nombres/usuarios con los números de integrante sigue sin confirmarse. No se afirma una revisión completada.

Por esos pendientes, **PR #9 permanece en borrador e issue #2 abierto**. El usuario autorizó únicamente esta ampliación de la gestión del refugio; no se implementan otras tareas del integrante 3.

### Continuidad de los compañeros

La entrega está en **`feature/equipo-1-publico-ux`**, dentro del PR #9 existente. El SHA exacto publicado se registra en la descripción del PR después del push y se obtiene con `git rev-parse origin/feature/equipo-1-publico-ux`. No duplicar migración, campos, carga de imagen ni componentes.

Se verificaron PR #7 y #8: ambos abiertos y sin merge. PR #9 conserva base `feature/huella-multirrefugio`; no se presupone que main contenga estos cambios.

Si un compañero necesita la imagen antes de integrar #9, una **rama nueva** debe partir de la entrega publicada del integrante 1:

```powershell
git fetch origin
git switch -c feature/mi-modulo origin/feature/equipo-1-publico-ux
```

Usar un nombre nuevo propio. Si ya tiene una rama con trabajo, conservarla y coordinar la incorporación revisando el diff de #9; no resetearla, forzarla ni repetir la mejora. La base alternativa publicada incluye también la dependencia multirrefugio. Aplicar la migración solo en su instalación de prueba aislada antes de abrir las pantallas actualizadas.
