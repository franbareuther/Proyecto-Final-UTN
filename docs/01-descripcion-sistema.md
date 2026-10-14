# Descripción del sistema

Los refugios necesitan vincular datos de animales, personas interesadas y atención veterinaria. Los registros dispersos dificultan conocer disponibilidad, evaluar solicitudes y reconstruir decisiones.

Huella es una identidad provisional para una aplicación web que centraliza esa información. Su objetivo general es gestionar adopciones responsables con trazabilidad, permisos y persistencia relacional. El nombre visible del refugio se configura mediante `APP_NAME`; la marca gráfica provisional se encuentra en `Components/Shelter.tsx`.

La función principal es **gestionar la adopción de animales de un refugio**. Comienza con el registro del interesado y termina con el registro definitivo de una adopción; un rechazo finaliza el recorrido sin adopción. Incluye catálogo, filtros, perfiles, solicitud, seguimiento y evaluación. Veterinaria y estadísticas son funciones complementarias.

Quedan fuera del alcance pagos, donaciones, reservas comerciales, diagnósticos automáticos, múltiples refugios y despliegue automático. Esta entrega implementa una base funcional que necesita revisión visual y validación de usuarios antes de producción.
