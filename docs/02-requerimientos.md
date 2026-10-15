> Actualización multirrefugio: consultar [diseño y actualización vigentes](10-multirrefugio.md). Las referencias a un refugio único y al estado previo de los PR pertenecen a la etapa inicial.

# Requerimientos

## Funcionales implementados

- RF01: registro público con nombre, apellido, email y contraseña; rol adoptante asignado por defecto en la base de datos.
- RF02: inicio/cierre de sesión, recuperación de contraseña y edición del perfil.
- RF03: catálogo paginado con búsqueda por nombre y filtros por especie, raza, tamaño, edad y disponibilidad.
- RF04: perfil público con fotografías y salud pública separada de historia clínica.
- RF05: alta, edición y archivo lógico de animales; carga, eliminación y elección de foto principal.
- RF06: solicitud persistente asociada a la sesión autenticada; prevención de duplicados activos.
- RF07: seguimiento exclusivo de solicitudes propias e historial con responsable, fecha y observaciones.
- RF08: búsqueda administrativa, evaluación, aprobación, rechazo y registro definitivo independiente.
- RF09: historia clínica con consultas, vacunas, tratamientos y controles; agenda de vencimientos.
- RF10: dashboard con contadores, gráficos y actividad calculados desde MySQL.

## Roles y permisos

| Operación | Público | Adoptante | Admin del refugio | Superadmin |
|---|---|---|---|---|
| Explorar ambos catálogos y refugios activos | Sí | Sí | Toda la red | Toda la red |
| Enviar solicitud | No | Sí | No | No |
| Consultar solicitudes | No | Propias | De su refugio | No |
| Evaluar/registrar adopción | No | No | Su refugio | No |
| Gestionar animales y fotos | No | No | Su refugio | No |
| Salud, agenda y auditoría | No | No | Su refugio activo | No |
| Corregir salud / resolver dosis | No | No | Cualquier admin del mismo refugio; animal sin archivar | No |
| Consultar antecedentes archivados | No | No | Solo lectura, su refugio activo | No |
| Perfil público del refugio | No | No | Edita el propio | Crea/edita cualquiera |
| Habilitación, slug y alta de personal | No | No | No | Sí |
| Dashboard | No | No | Su refugio | No |

RF11: cumplimiento explícito de dosis programadas mediante aplicación enlazada o cancelación con motivo; conserva antecedentes y no deduce aplicaciones históricas. RF12: auditoría interna de correcciones y resoluciones, atómica con la escritura, sin edición/borrado. Ver [criterios de salud](13-salud-agenda-entrega.md).

## No funcionales

Laravel 12, React 18, Inertia 2, Tailwind 4, Vite 7 y MySQL. PHP >=8.2 y Node 24 recomendado. Contraseñas hasheadas, CSRF, sesiones, validación de servidor, roles/policies y transacciones. Formularios con etiquetas, foco visible, reducción de movimiento, layouts adaptables, estados vacíos y mensajes de error. No se exponen formularios para elegir roles privilegiados.

Las pruebas de HTTP, permisos y negocio están automatizadas. Queda pendiente comprobar accesibilidad con lector de pantalla, dispositivos reales y pruebas concurrentes con conexiones independientes. La recuperación por email requiere SMTP; por defecto se escribe en el log local.
