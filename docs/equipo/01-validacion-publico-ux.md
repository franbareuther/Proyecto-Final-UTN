# Validación del sitio público — Laureano, issue #2

Fecha: 14 de octubre de 2026. Rama: `feature/equipo-1-publico-ux`.
Base publicada: `origin/feature/huella-multirrefugio`, commit `3c3e0fc`.
Los PR #7 y #8 continúan abiertos y sin integrar; esta entrega depende de ellos y propone su diff contra la base multirrefugio.

## Diagnóstico y alcance

**Implementado en la base:** inicio con animales y refugios, ambas entradas del menú, directorio, perfil institucional, catálogo global y por institución, perfil del animal, fotos ordenadas con principal primero, respaldo de imagen, etiquetas y errores compartidos, menú con Escape y tres roles. Existencia de código no acredita interacción en navegador.

**Problemas encontrados por inspección:** el catálogo institucional recibía `city` y `shelter` en los props aunque su consulta los ignoraba; los chips podían presentarlos como efectivos. `useForm` conservaba su estado al buscar sin volver a sincronizar los controles con los props. Una raza de URL ausente de las opciones no tenía representación seleccionable. El footer sin institución apuntaba al directorio; algunos textos seguían describiendo Huella como refugio. La paginación no desempató animales creados en el mismo instante.

**Verificado automáticamente tras la corrección:** aislamiento de institución y canonicalización de URL; cada filtro excluye independientemente registros no coincidentes; combinación de los ocho filtros; paginación global e institucional; orden estable; inactivos y archivados excluidos; resultados vacíos; límites de edad por fecha y estimación; validación de búsqueda; nombre extenso, principal y respaldo sin foto; ambos perfiles con institución correcta; ausencia de solicitudes y relaciones clínicas internas. Los tests de frontend verifican contratos renderizados, no eventos ni layout.

**Pendiente:** toda la matriz de navegador de esta entrega, incluida la interacción de sincronización, galería, fallos de red, menú, foco, zoom y capturas. No se considera completado el issue #2.

## Cambios y contratos

- `/refugios/sur/animales?shelter=norte&city=Córdoba&species=Gato&page=2` redirige a `/refugios/sur/animales?species=Gato&page=2`. El refugio de la ruta es el responsable; se quitan parámetros de red antes de validarlos, incluso si llegan como arrays. Los demás filtros y la página se conservan.
- El frontend institucional tampoco presenta ni propaga esos filtros. Al enviar el formulario se omiten campos vacíos y filtros de red en instituciones.
- Catálogo y directorio sincronizan sus controles con los filtros recibidos al navegar. Los valores válidos de URL ausentes de las opciones se muestran como «sin coincidencias» y pueden quitarse. El chip de refugio muestra su nombre.
- El orden del catálogo usa fecha descendente e id descendente para evitar empates indeterminados entre páginas.
- El inicio explica que Huella conecta y que la institución cuida y evalúa solicitudes. El footer mantiene los dos recorridos, con destinos rotulados correctamente. El shell conserva el catálogo institucional cuando corresponde.
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
