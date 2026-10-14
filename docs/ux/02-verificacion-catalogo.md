# Entrega frontend / UX — Issue #2

Rama `feature/ux-responsive-catalogo`, creada desde main `1e18431`, después de verificar la integración de PR #6 y PR #1. La advertencia histórica de docs/08 sobre main vacío ya no corresponde al estado actual; se conserva ese documento de otro responsable y se registra aquí la base efectiva.

La [propuesta](01-propuesta-catalogo.md) se documentó antes de aplicar el cambio. Se mantuvieron el stack, dependencias, consultas, rutas, permisos, estados, migraciones y reglas de adopción.

## Cambios implementados

- Identidad Huella con marfil, verde bosque y terracota, tokens de marca en Tailwind y tipografía fluida. Hero dividido, fotografía real destacada vinculada al perfil, pasos de adopción y secciones con títulos jerarquizados. No se inventaron cifras, testimonios ni datos de animales.
- Navbar con enlace activo, marca e iconografía SVG propia; menú móvil con aria-controls, cierre al navegar y Escape; enlace para saltar al contenido. Footer público con enlaces reales y foco claro sobre fondo oscuro. Se mantienen las condiciones de navegación según rol.
- Catálogo con filtros distribuidos en una, dos o tres columnas; búsquedas de nombre con límite compatible con servidor; chips de filtros aplicados que permiten quitar uno conservando el resto; conteo y rango recibidos de Laravel; estado de búsqueda y salida del vacío; paginación con etiquetas y página actual.
- Tarjetas con fotos de proporción 4:3, etiquetas de sexo/tamaño, disponibilidad en texto/color, nombre con corte de palabras y enlace al perfil. Se conserva la prioridad de fecha de nacimiento sobre edad estimada.
- Perfil con imagen adaptable, selección de miniaturas anunciada, contador y controles anterior/siguiente cuando hay varias fotos; datos, personalidad, cuidados públicos y bloque de acción. Se mantienen exactamente las condiciones existentes para ofrecer el enlace de adopción. Cambiar de animal reinicia la selección de foto.
- `AnimalImage` reutilizable con respaldo ante ausencia o error de imagen, carga diferida en tarjetas/miniaturas y carga inmediata para fotos principales. El evento de error y la carga efectiva en cliente quedan pendientes de navegador.
- Botones, campos, badges, errores y diálogos con identidad consistente. `Field` vincula etiqueta/control/error, conserva aria-describedby existente y agrega aria-invalid cuando recibe error. Se conservan nombres y props públicas de los componentes.
- Controles principales con altura mínima de 44 px, inputs de 16 px, foco visible, reducción de movimiento y protecciones de ancho mínimo/textos extensos. Las tablas internas conservan su propia presentación.

## Archivos modificados y nuevos

| Grupo | Archivos |
|---|---|
| Páginas públicas | `resources/js/Pages/Public/Home.tsx`, `Catalog.tsx`, `Animal.tsx` |
| Componentes compartidos | `resources/js/Components/Shelter.tsx`, `PrimaryButton.tsx`, `SecondaryButton.tsx`, `DangerButton.tsx`, `Checkbox.tsx`, `TextInput.tsx`, `Modal.tsx` |
| Componentes nuevos | `resources/js/Components/AnimalImage.tsx`, `Icon.tsx` |
| Estilos | `resources/css/app.css` |
| Tipos | `resources/js/types/shelter.ts`: from/to opcionales que ya entrega la paginación de Laravel |
| Pruebas | `tests/Frontend/catalog.test.mjs`; `package.json`: comando test:frontend |
| Documentación propia | `docs/ux/01-propuesta-catalogo.md`, este informe |

No se editaron páginas de Auth/Adoptante, Admin ni Veterinaria, controladores, rutas, tests PHP compartidos, esquema, seeders, workflow CI ni archivos de configuración local. No se agregaron paquetes ni cambió package-lock.json.

## Pruebas efectivamente ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run test:frontend` | 9 tests aprobados |
| `php artisan test --compact`, DB_CONNECTION=sqlite y DB_DATABASE=:memory: | 46 tests, 278 assertions aprobados; no se usó MariaDB para testing |
| `npm run build` | TypeScript y Vite aprobados |
| `php vendor/laravel/pint/builds/pint --test --repair` | Aprobado |
| `npx prettier --check` sobre archivos frontend modificados | Aprobado; no confundir formateo con validación visual |
| HTTP de Laravel local | Home respondió 200 |
| `php scripts/review-http.php` | Recorrido de cuatro perfiles de uso completado: páginas, fichas/fotos, edición, solicitudes, clínica y permisos. SHA-256 de las diez tablas del dominio sin cambios |

Las pruebas frontend usan Node test runner, ReactDOM server y el transformador de Vite, ya presentes. No agregan dependencias y renderizan los componentes reales. Verifican asociación de etiquetas/errores, badges, prioridad de edad, filtros removibles, navegación activa/menú inicialmente cerrado, paginación, condiciones del CTA según rol/disponibilidad, vacíos, fotos ausentes y nombres extensos. No ejecutan eventos DOM, hooks de efectos ni navegación real de un navegador.

Se midió el contraste de los tokens de marca usados para texto: bosque/marfil 11,31:1; terracota/marfil 5,36:1; blanco/bosque 11,90:1; terracota/fondo verde claro del hero 4,72:1. Son pares de colores calculados, no una auditoría completa de contraste sobre fotografías, estados hover ni todos los componentes.

## Lo que no se pudo comprobar

Computer-use devolvió `apps: []` y `browsers: []`. No se tomaron capturas ni se ejecutó inspección visual a 1440×900, 768×1024 o 390×844. Tampoco se probaron táctil, lector de pantalla, tabulación/foco, Escape, clics de galería/chips, errores de imágenes, HMR o zoom en navegador. Las clases CSS y el renderizado server no acreditan esos resultados.

| Viewport | Revisión visual | Interacción | Evidencia |
|---|---|---|---|
| 1440×900 escritorio | Pendiente | Pendiente | Sin navegador |
| 768×1024 tablet | Pendiente | Pendiente | Sin navegador |
| 390×844 celular | Pendiente | Pendiente | Sin navegador |

### Recorrido manual al disponer de navegador

1. Iniciar los servicios existentes y abrir localhost:8000. No regenerar clave ni ejecutar migraciones/seeders para revisar esta instalación.
2. En cada viewport recorrer Home, las secciones del navbar, catálogo, página 2, combinación de filtros, chip individual, limpiar, vacío y perfil.
3. En perfiles con varias fotos, elegir miniaturas, anterior/siguiente y verificar el contador. Probar foto fallida en una copia de datos o con bloqueo de petición desde DevTools, sin borrar archivos reales.
4. Usar nombres/razas/correos extensos en una copia personal; verificar que página, chips y badges no generen desplazamiento horizontal. Solo la tira de miniaturas y tablas internas pueden desplazarse dentro de su contenedor.
5. Recorrer con Tab y Shift+Tab. Verificar salto al contenido, foco, labels, errores y lectura del estado seleccionado. Abrir menú móvil y cerrar con Escape; abrir confirmación y cancelar, comprobando foco y título. Repetir con zoom 200% y reducción de movimiento.
6. Comprobar el enlace de adopción como visitante/adoptante y su ausencia para personal/animal no disponible. No enviar formularios válidos ni registrar adopciones sobre la base compartida para esta revisión.
7. Con integrantes 2, 3 y 4, revisar la repercusión de botones, campos, badges, menú/sidebar, vacíos y Modal en sus pantallas. No rediseñar esos formularios o tablas sin acordarlo.
8. Registrar navegador/versión, ruta, rol, tamaño, resultado y capturas sin credenciales en Issue #2. Cualquier fallo verificable se corrige en esta rama o una subtarea acordada.

## Configuración y coordinación

`.env` se conservó y su hash SHA-256 coincide con el tomado antes de modificar frontend. MariaDB existente responde en 3307 con 14 animales; no se ejecutaron inicializaciones, migraciones ni seeders. Las nuevas constantes visuales son exclusivamente de presentación.

Solicitar revisión del integrante 3 para componentes y presentación compartida y del integrante 4 para calidad/accesibilidad. `npm run test:frontend` todavía no está incorporado al workflow: proponer su adición al integrante 4 en un cambio coordinado, manteniendo los checks actuales de Laravel y build.

El PR debe referenciar Issue #2 con `Refs #2`, sin cierre automático: sus criterios visuales/manuales permanecen pendientes. No se hace merge automático. Esta entrega implementa mejoras visuales y pruebas de renderizado, sin declarar completada la revisión responsive en navegador.
