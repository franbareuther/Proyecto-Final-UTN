# Ancho fluido — ampliación del Issue #2 / PR #7

Se continúa exclusivamente en `feature/ux-responsive-catalogo`. Alcance acordado: contenedores y estilos compartidos, páginas públicas. No se editarán pantallas Admin, Adoptante, Auth, Profile ni Veterinaria, ni lógica, rutas, permisos o migraciones.

## Diagnóstico y propuesta previa

Shell impone max-w-7xl (1280 px) en navbar, main y footer; además el marco interno tiene max-w-screen-2xl (1536 px). La regla CSS de public-shell/main vuelve a imponer el primer límite. En 1920 px eso deja 320 px por lado fuera del contenedor público, antes de su padding. El hero también limita la foto a 580 px de alto y tres columnas fijas de catálogo desaprovechan el ancho ganado.

Propuesta: quitar esos topes estructurales, usar un único gutter proporcional, conservar límites de lectura y formularios, dar más superficie a la foto, emplear columnas de grid con mínimo flexible y mantener la barra lateral interna como columna independiente. Ningún overflow de página se ocultará para simular un resultado correcto.

Los cambios de Shell/CSS alcanzan a los consumidores de todos los módulos, conservando la API de componentes. Solicitar revisión al integrante 3 del contenedor del panel/tablas y al 4 de clínica; cualquier cambio específico de sus grids o formularios queda para un PR coordinado. No se incorporan librerías ni se cambia la identidad.

## Criterios de implementación

- Márgenes comunes con `clamp(1rem, 3vw, 6rem)`, sin max-width global. Navbar, main y footer alineados.
- Panel interno: marco sin techo global; sidebar conservado, contenido flex con min-width:0; las tablas siguen dentro de overflow-x-auto.
- Hero: una columna bajo 1024 px, dos columnas con minmax(0, fr) desde desktop; texto con límite legible; foto de ancho completo de su columna y proporción adaptable sin max-height de 580 px.
- Catálogo: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)), de modo que una tarjeta no fuerce un ancho mayor al disponible. No se cambia la paginación del servidor.
- Filtros: una columna móvil, dos intermedias, tres desde desktop y seis en monitores amplios.
- Perfil: galería y ficha fluidas, párrafos con límite de lectura y miniaturas con scroll propio. La selección/CTA conservan su comportamiento.
- Conservar max-w de login/registro, formulario de solicitud, edición de animales, diálogos, párrafos y estados vacíos. No se modifican indiscriminadamente clases max-w de descendientes.

## Viewports solicitados

Computer-use devuelve `apps: []`, `browsers: []`. Las siguientes comprobaciones visuales **no se han ejecutado**:

| Tamaño | Margen por lado calculado* | Columnas catálogo calculadas* | Revisión visual e interacción |
|---|---:|---:|---|
| 1920×1080 | 57,6 px | 5 | Pendiente |
| 1440×900 | 43,2 px | 4 | Pendiente |
| 1366×768 | 41,0 px | 4 | Pendiente |
| 1024×768 | 30,7 px | 3 | Pendiente |
| 768×1024 | 23,0 px | 2 | Pendiente |
| 390×844 | 16 px | 1 | Pendiente |
| 375×812 | 16 px | 1 | Pendiente |

*Estimación aritmética del CSS con fuente raíz de 16 px y grid con suficientes animales; no medición de navegador. No incluye la reducción de ancho por scrollbar del navegador. En home hay solo tres destacados reales; auto-fit distribuye esas tarjetas sin crear columnas vacías.

Comprobar en cada tamaño: document.documentElement.scrollWidth <= clientWidth; hero sin texto cortado, encuadre y proporción de imagen; menú y enlaces; filtros/chips/paginación; perfil y galería; login/solicitud/CRUD/clínica legibles y tablas con scroll dentro de su contenedor. Probar además zoom 200%, nombres extensos, filtros sin resultados y teclado. Registrar capturas y navegador/versión en Issue #2, sin credenciales. No enviar formularios válidos sobre datos compartidos para probar presentación.

## Resultado de implementación y comprobaciones

- `resources/css/app.css`: gutters, marco/contenido flexibles, hero, grilla automática, filtros y galería. Se conserva el ancho de lectura de párrafos.
- `resources/js/Components/Shelter.tsx`: navbar, menú móvil, main, marco interno y footer sin los topes globales de 1280/1536 px. Sidebar y contratos de componentes conservados.
- `resources/js/Layouts/AuthenticatedLayout.tsx`: contenedores compartidos fluidos; comportamiento de autenticación intacto.
- `resources/js/Pages/Public/{Home,Catalog,Animal}.tsx`: adopción de los estilos fluidos; sin cambios en consultas, filtros, paginación ni solicitudes.
- `tests/Frontend/catalog.test.mjs`: cobertura adicional del renderizado de formularios acotados y tabla administrativa con wrapper de scroll. No constituye una prueba de geometría ni de interacción de navegador.

Verificado localmente: `npm run test:frontend` (11 aprobadas), `php artisan test --compact` (46 aprobadas, 278 aserciones, con SQLite `:memory:` establecido en el proceso), `npm run build` (TypeScript y Vite aprobados) y `git diff --check` sin errores. No se modificaron archivos de pantallas de otros integrantes, migraciones, permisos ni reglas de negocio. `.env` conserva su hash SHA-256 inicial; la configuración MariaDB 3307 y sus datos no se alteraron.

La revisión visual de los siete tamaños, navegación con teclado, encuadre real de fotografías y scroll horizontal siguen pendientes por ausencia de navegador. La estimación de columnas anterior no reemplaza esas pruebas. Antes de integrar el PR #7, los integrantes 3 y 4 deben revisar sus módulos con los contenedores compartidos nuevos y registrar los resultados; los cambios no requieren actualizar props ni rutas.
