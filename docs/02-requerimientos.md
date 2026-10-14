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

| Operación | Público | Adoptante | Administrador | Veterinario |
|---|---|---|---|---|
| Consultar catálogo/perfiles | Sí | Sí | Sí | Sí |
| Enviar solicitud | No | Sí | No | No |
| Consultar solicitudes | No | Propias | Todas | No |
| Evaluar/registrar adopción | No | No | Sí | No |
| Gestionar animales y fotos | No | No | Sí | No |
| Leer historia clínica | No | No | Sí | Sí |
| Crear registro veterinario | No | No | No | Sí |
| Corregir registro veterinario | No | No | No | Solo autor |
| Consultar dashboard | No | No | Sí | No |

## No funcionales

Laravel 12, React 18, Inertia 2, Tailwind 4, Vite 7 y MySQL. PHP >=8.2 y Node 24 recomendado. Contraseñas hasheadas, CSRF, sesiones, validación de servidor, roles/policies y transacciones. Formularios con etiquetas, foco visible, reducción de movimiento, layouts adaptables, estados vacíos y mensajes de error. No se exponen formularios para elegir roles privilegiados.

Las pruebas de HTTP, permisos y negocio están automatizadas. Queda pendiente comprobar accesibilidad con lector de pantalla, dispositivos reales y pruebas concurrentes con conexiones independientes. La recuperación por email requiere SMTP; por defecto se escribe en el log local.
