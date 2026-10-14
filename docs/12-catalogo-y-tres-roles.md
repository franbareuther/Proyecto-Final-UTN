# Catálogo general y tres roles

Esta actualización incorpora los dos recorridos acordados: **Animales en adopción** abre el catálogo de toda la red; **Refugios** abre el directorio y el catálogo de cada institución. El inicio presenta hasta seis animales y una sección de refugios, con accesos a ambos listados completos. Las tarjetas y perfiles identifican el refugio responsable.

El catálogo general mantiene búsqueda, filtros y paginación y agrega refugio y ciudad. Solo incluye instituciones activas y animales no archivados. El catálogo de cada refugio sigue separado; una URL con filtros ajenos no puede cambiar su institución. El personal también puede explorar el sitio público de toda la red, mientras sus paneles y escrituras siguen limitados a su refugio.

## Tres roles

- Superadministrador: alta/habilitación de refugios y creación de administradores.
- Administrador de refugio: catálogo, fotos, solicitudes, adopciones, indicadores y registros de salud de su institución.
- Adoptante: catálogo público y sus propias solicitudes en distintas instituciones.

Se elimina el perfil veterinario del selector de cuentas, navegación y permisos. La sección interna se llama **Salud y cuidados**. Las rutas técnicas y los nombres de tablas históricas se mantienen para compatibilidad.

## Salud y actualización de datos

La migración nueva convierte las cuentas veterinarias anteriores en administradores del mismo refugio. Conserva sus identificadores, nombres, contraseñas y relaciones. No se crea personal nuevo ni se elimina ninguna cuenta o antecedente. Esto amplía los permisos de esas cuentas al panel administrativo de su propio refugio, según el cambio de roles acordado.

En consultas, vacunas, tratamientos y controles, `veterinarian_id` pasa a `recorded_by`, conservando la referencia a quien registró. `practitioner_name` distingue el profesional que atendió; los registros anteriores conservan allí el nombre del autor original. Si no se conoce, el formulario admite dejarlo vacío y muestra «Sin informar». Los nuevos datos se cargan según la documentación del profesional.

Cualquier administrador del mismo refugio puede actualizar sus registros de salud; no depende de la cuenta anterior del veterinario. El autor inicial no cambia y `updated_by` identifica al último administrador que actualizó. Las comprobaciones de servidor impiden cargar o editar salud de otros refugios o falsificar autores. No se ofrece acceso clínico público ni al superadministrador.

En una instalación existente aplicar únicamente `php artisan migrate`, con respaldo y coordinación. No reiniciar la base. El rollback de esta migración elimina los campos nuevos y no reconstruye roles anteriores; no es un mecanismo habitual de restauración.

## Validación

Pruebas locales de servidor y presentación, compilación TypeScript/Vite y formato; CI sobre MySQL efímero. Casos específicos: catálogo global y filtros, paginación, refugios inactivos, navegación del personal, prohibición de accesos internos ajenos, tres roles, autor/profesional separado y migración de los cuatro tipos de registros clínicos con contraseñas intactas.

Resultados locales: 62 pruebas PHP (561 aserciones), 17 pruebas frontend y compilación aprobadas. En navegador se verificaron las dos entradas, filtro por ciudad, resultado perteneciente al refugio correcto y edición/guardado de un control anterior desde el administrador. Las fechas del formulario conservan su valor al editar. Evidencia: [salud gestionada por el refugio](screenshots/salud-administrador.png).

La demo local usa una copia aislada con datos ficticios; la base MariaDB original permanece sin modificaciones. Se actualizará el PR multirrefugio en su misma rama, sin merge automático.
