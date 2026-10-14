# Revisión de plataforma y guía manual — 14 de octubre de 2026

## Alcance y evidencia

Se inspeccionó la implementación existente y se trabajó sobre `review/revision-equipo`, derivada de `feature/plataforma-refugio` en `de50fcd`. No se reconstruyó el sistema ni se modificaron reglas de AdoptionService. PR #1 permanece abierto en borrador; main no fue modificado en esta etapa.

**No había navegador disponible:** computer-use devolvió `apps: []` y `browsers: []`. No se ejecutó React en un navegador ni se capturaron pantallas. No se comprobaron visualmente escritorio, tablet, celular, teclado, contraste ni lector de pantalla. El análisis de JSX/CSS, el build y las respuestas HTTP no reemplazan esas pruebas. Toda celda visual de la matriz inferior está pendiente.

Servicios existentes comprobados:

| Componente | Comprobación ejecutada | Resultado |
|---|---|---|
| MariaDB de XAMPP | Conexión TCP 127.0.0.1:3307 y SELECT VERSION | 10.4.32-MariaDB; 14 animales |
| Esquema | `php artisan migrate:status` | Cuatro migraciones ya aplicadas; solo consulta |
| Laravel | GET http://127.0.0.1:8000 | HTTP 200, Inertia |
| Vite existente | `/@vite/client`, `/resources/js/app.tsx`, `/resources/css/app.css` en http://[::1]:5173 | HTTP 200 en los tres recursos |
| Compilación | `npm run build` | TypeScript y Vite aprobados |
| Regresión PHP | `php artisan test --compact` con DB_CONNECTION=sqlite y DB_DATABASE=:memory: | 46 pruebas, 278 assertions aprobadas |

No se reiniciaron servicios que ya respondían. No se ejecutó migrate, fresh, reset, rollback, seed ni instalación de MariaDB. Las comprobaciones de escritura y estados son las de PHPUnit en memoria, no formularios válidos sobre los registros existentes. Login/logout y las consultas HTTP usan sesiones reales: pueden crear/actualizar filas de sesiones, sin alterar el dominio.

## Recorrido funcional ejecutado

Se añadió `scripts/review-http.php`, una comprobación reproducible con Guzzle, cookies, CSRF y el protocolo Inertia. Solo se permite APP_ENV=local y un servidor localhost/loopback. Usa cuentas demo existentes y DEMO_PASSWORD de la configuración local; no imprime credenciales ni crea usuarios.

- Visitante: Home, catálogo, segunda página, filtro combinado, resultado vacío, login, registro, recuperación y formulario de reset; los 14 perfiles públicos y sus fotografías. Se verifica que el perfil no incluya consultas ni solicitudes privadas.
- Adoptante: login, perfil, confirmación de contraseña, mis solicitudes y los cinco detalles propios existentes; formulario de animal disponible y regreso con mensaje desde uno no disponible; denegación de rutas administrativas y veterinarias; logout.
- Administrador: login/perfil, dashboard, listado de animales, formulario de alta, los 14 formularios de edición, listado/detalles de solicitudes, adopciones, veterinaria, agenda y las 14 historias clínicas. Búsqueda inválida de más de 100 caracteres: redirección y error recibido por Inertia.
- Veterinario: login/perfil, índice, agenda y las 14 historias clínicas; búsqueda inválida; denegación de administración y solicitudes del adoptante; logout.
- Las fotos se verifican con HTTP 200 y Content-Type de imagen. No se evalúa encuadre, calidad ni carga visual.
- El script compara las diez tablas del dominio antes/después mediante conteos, último ID, última actualización y digest SHA-256 de sus filas. No imprime los contenidos de esas filas. Esto detecta cambios concurrentes también: si otra persona trabaja sobre los datos durante el recorrido, la comparación puede fallar y debe investigarse.

Para repetir: `php scripts/review-http.php`, en una terminal normal, sin variables de testing. Si el servicio usa otra dirección local, establecer REVIEW_BASE_URL. No usarlo contra producción. Las comprobaciones HTTP no ejecutan clics, JavaScript, subida válida de archivos, envíos válidos de solicitud ni decisiones administrativas.

## Problemas concretos corregidos

| ID | Evidencia verificable | Corrección acotada | Comprobación / límite |
|---|---|---|---|
| R01 | GET autenticado a `/animales/{id}/solicitar` de un animal no disponible devolvía 409; reproducido por regresión antes de corregir | Regresa al perfil con explicación en flash.error y mensaje de alerta en Shell | Dos pruebas nuevas cubren tres estados no disponibles, animal disponible y permisos; recorrido HTTP confirma perfil y mensaje. Presentación visual pendiente |
| R02 | Admin/Requests y Veterinaria/Index recibían f.errors, pero no renderizaban ningún mensaje | Se incorporó Errors a ambos buscadores | HTTP confirma validación de q con 101 caracteres y props de error; TypeScript/build pasan. Visibilidad real pendiente de navegador |
| R03 | Confirm usaba h2 sin DialogTitle dentro de Headless UI Dialog; el disparador tampoco se deshabilitaba con busy | Se asocia DialogTitle al diálogo, se deshabilita el disparador y se bloquea cierre por fondo/Escape mientras busy | Inspección de código y build; anuncio con lector de pantalla y foco deben probarse manualmente |
| R04 | AnimalCard priorizaba estimated_age cuando birth_date también existía; perfil y filtro priorizan birth_date | La tarjeta usa la misma prioridad que el perfil | Inspección del condicional y build. No se cambió el cálculo/filtro de edad ni el esquema |

La regresión de R01 falló con 409 antes de aplicar el arreglo y pasó después. La suite anterior de 44 pruebas sigue aprobada, más dos pruebas nuevas (46 en total). El resto son cambios de presentación/mensajes, sin alterar estados, transacciones ni permisos. No se realizaron rediseños masivos ni cambios de dependencias.

## Observaciones pendientes y propuestas

Estas son observaciones de código o hipótesis a reproducir, **no defectos visuales observados**:

| Tema | Evidencia / riesgo | Propuesta antes de implementar | Responsable |
|---|---|---|---|
| Navegación y menú | Shell usa menú móvil bajo lg y sidebar desde lg; no hay evidencia de interacción/overflow | Ejecutar matriz, registrar capturas; proponer estado de enlace activo y cierre del menú si se reproduce un problema | 1 |
| Mensajes y estados | Badge aplica el mismo verde a todos los estados; varias pantallas auxiliares/validaciones siguen en inglés | Acordar vocabulario y paleta semántica con contrastes medidos; traducir sin cambiar valores persistidos | 1 + 2 para textos auth |
| Fotografías | Se reutilizan tres imágenes demo; alturas fijas en hero/perfil | Reemplazar por fotos autorizadas al preparar datos reales; validar encuadre en móvil antes de cambiar tamaños | 1; 3 mantiene fotos |
| Archivos tras guardar | AnimalForm vacía photos en useForm, pero no reinicia explícitamente el input file nativo | Reproducir selección → envío → segundo envío en navegador; corregir input si queda información engañosa | 3 |
| Registros archivados | Dashboard usa Animal::count y rutas clínicas no incluyen withTrashed | Definir total actual vs histórico y acceso autorizado a antecedentes archivados; no modificar reglas silenciosamente | 3; 4 propone consulta clínica |
| Próximas dosis | MedicalController lista next_dose_date vencida o hasta 30 días, sin referencia al cumplimiento de la dosis | Acordar con refugio cómo registrar cumplimiento; diseñar migración/test si procede | 4 |
| Accesibilidad | Field envuelve controles en label, pero errores no tienen aria-describedby/aria-invalid; h1 y correos pueden ser largos | Medir con teclado/lector y datos extensos; proponer IDs y vinculación de errores manteniendo API compartida | 1 |
| Confirmaciones | Busy depende del consumidor; las eliminaciones por router no pasan un estado local de procesamiento | Reproducir doble clic y lentitud; si ocurre, añadir seguimiento de petición en cada consumidor | 3 para fotos/archivo; 1 para componente |
| Concurrencia | Existen locks y tests secuenciales de duplicados, pero no prueba con procesos independientes | Añadir prueba de carreras en servicio desechable, sin usar la base compartida | 2, revisión 4 |

## Revisión manual obligatoria

Usar una copia personal demo para cualquier escritura. En la base compartida de 3307 limitarse a consultar; no registrar adopciones de prueba para “volverlas atrás”, porque son definitivas. No cambiar contraseñas de las cuentas compartidas ni adjuntar datos personales en capturas.

Abrir http://localhost:8000 en navegador y DevTools. Probar **1440×900 escritorio**, **768×1024 tablet** y **390×844 celular**; añadir 320 px de ancho y zoom 200% como estrés. Una emulación de viewport no sustituye probar al menos un dispositivo táctil real. Registrar navegador/versión, viewport, fecha, rol, ruta, pasos, esperado, obtenido y captura sin credenciales.

| Pantalla / ruta | Qué verificar | Escritorio | Tablet | Celular |
|---|---|---|---|---|
| Home `/` | Logo/navbar, hero, destacados, enlaces de secciones y footer | Pendiente | Pendiente | Pendiente |
| Catálogo `/animales` | Tarjetas, fotos/respaldo, búsqueda, cada filtro, combinar/limpiar y paginar | Pendiente | Pendiente | Pendiente |
| Catálogo sin coincidencias | Mensaje vacío, filtros conservados y retorno a listado | Pendiente | Pendiente | Pendiente |
| Perfil `/animales/{id}` | Galería/miniaturas, textos largos, edad/estado, cuidados públicos y CTA según rol/estado | Pendiente | Pendiente | Pendiente |
| Registro `/register` | Campos/etiquetas, contraseña confirmada, errores y rol fijo | Pendiente | Pendiente | Pendiente |
| Login y recuperación | Errores, teclado, redirección, recuperación en log local; no presumir email enviado por SMTP | Pendiente | Pendiente | Pendiente |
| Perfil `/profile` | Datos, validación, cambio de contraseña solo en copia personal | Pendiente | Pendiente | Pendiente |
| Solicitud `/animales/{id}/solicitar` | Identidad de sesión, datos vacíos/límites, envío en copia propia, cargando y errores | Pendiente | Pendiente | Pendiente |
| Animal no disponible | Abrir enlace desactualizado: volver al perfil con mensaje, sin formulario ni error técnico | Pendiente | Pendiente | Pendiente |
| `/mis-solicitudes` y `/solicitudes/{id}` | Fotos, estados, motivos, historial y datos exclusivos del dueño | Pendiente | Pendiente | Pendiente |
| Dashboard `/admin` | Seis tarjetas, tres gráficos, ceros, textos, enlaces y actividad real | Pendiente | Pendiente | Pendiente |
| Animales `/admin/animales` | Tabla desplazable dentro del contenedor, búsqueda y acciones | Pendiente | Pendiente | Pendiente |
| Alta/edición de animal | Campos, fechas, disponibilidad protegida, validación y subida de imágenes | Pendiente | Pendiente | Pendiente |
| Fotografías en edición | Principal, eliminar/cancelar, carga lenta y archivos inválidos | Pendiente | Pendiente | Pendiente |
| Solicitudes admin | Búsqueda por animal/adoptante, filtro, error de búsqueda, evaluación y confirmación | Pendiente | Pendiente | Pendiente |
| Adopciones `/admin/adopciones` | Registro definitivo y datos coherentes con animal/solicitud | Pendiente | Pendiente | Pendiente |
| Veterinaria `/veterinaria` | Búsqueda, errores, enlaces e identificación del animal | Pendiente | Pendiente | Pendiente |
| Historia `/veterinaria/{id}` | Cuatro pestañas, vacíos, campos/fechas, errores y edición solo del autor | Pendiente | Pendiente | Pendiente |
| Agenda `/veterinaria/controles` | Vencidos/hoy/próximos, dosis y enlaces a clínica | Pendiente | Pendiente | Pendiente |
| Navegación compartida y diálogo | Menú/sidebar según tamaño/rol, tabulación, foco, Escape, cancelar, título accesible y retorno de foco | Pendiente | Pendiente | Pendiente |

### Escenarios de formulario en copia personal

1. Visitante se registra con email nuevo. Intentar email duplicado y contraseñas distintas. Ingresar y salir; comprobar redirección por rol y que volver atrás no habilite acciones protegidas.
2. Adoptante envía solicitud con motivo breve y luego válido. Ver su seguimiento, duplicado activo y denegación al abrir una solicitud ajena. No debe elegir identidad ni rol desde el formulario.
3. Administrador revisa, aprueba y comprueba que no hay todavía adopción definitiva. Confirmar luego Adoptado, revisar animal/solicitud y motivo de cierre de otras solicitudes. Rechazo terminal y segunda aprobación/adopción deben fallar. Ejecutar solo sobre animales propios de ensayo.
4. Administrador crea/edita un animal con y sin fotos, intenta SVG/archivo de más de 4 MB, elige principal y elimina con confirmación. Un animal reservado/adoptado no se libera desde CRUD. Archivo conserva historial.
5. Veterinario registra consulta/vacuna/tratamiento/control. Probar campos vacíos, fechas inconsistentes y autor ajeno; completar un control y verificar agenda. Admin puede leer clínica pero no registrar; adoptante no puede acceder mediante URL.
6. Recorrer cada pantalla con Tab/Shift+Tab y activar con teclado. El diálogo debe anunciar título, mantener foco dentro, poder cancelar y devolver el foco al disparador. Comprobar estados de carga con red lenta y deshabilitación de acciones. Revisar consola/network sin errores de React, assets, CSRF o Inertia.

### Entrega de evidencia

Actualizar cada celda a Aprobado/Falla/No aplica con enlace de evidencia; no borrar resultados anteriores sin explicación. Abrir o reutilizar la Issue del módulo (#2–#5), adjuntar pasos y propuesta. Las mejoras visuales importantes requieren acuerdo de 1 y del propietario de la pantalla antes de una implementación extensa. El criterio de integración del equipo debe distinguir bloqueantes de mejoras aceptadas para después.

## Pruebas y preservación

Las 46 pruebas cubren autenticación, permisos, privacidad, CRUD/fotos, filtros, duplicados, aprobación, rechazo/adopción e historial, clínica y estadísticas. Las dos nuevas están en `tests/Feature/AdoptionNavigationTest.php`.

El recorrido HTTP valida carga de componentes y datos, pero no composición visual, ejecución de hooks React, clics ni efectos de HMR. Vite respondió a sus recursos y el build pasó; la actualización visual en caliente sigue pendiente. Las operaciones válidas de escritura se verificaron en memoria; no se repitieron manualmente sobre MariaDB compartido. Sin migraciones nuevas, sin cambios de esquema/configuración local, sin seeders, sin merge ni cierre de PR #1.
