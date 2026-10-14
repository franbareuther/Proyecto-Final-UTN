# Trabajo de los cuatro integrantes

## Base común

La implementación publicada ya contiene multirrefugio, dos catálogos, tres roles y salud gestionada por el refugio. El trabajo visual previo está en PR #7 y la base actual en PR #8. Ambos se revisan antes de integrar; esta publicación no hace merge a main.

Los cuatro usan la última versión publicada de feature/huella-multirrefugio mientras esos PR sigan abiertos. Tras integrarlos, usar main y comprobar que conserve esa implementación. Cada uno crea su rama propuesta desde el mismo punto de partida. No arrancar desde un main antiguo ni reutilizar las ramas de los PR anteriores para nuevas tareas.

| Integrante | Issue | Prompt | Rama propuesta | Revisor principal |
|---|---|---|---|---|
| 1 — Laureano | #2 | [Integrante 1 — Laureano: sitio público y experiencia de uso](01-laureano-publico-ux.md) | feature/equipo-1-publico-ux | 3 |
| 2 | #3 | [Integrante 2 — Cuentas, permisos y adopciones](02-cuentas-adopciones.md) | feature/equipo-2-cuentas-adopciones | 4 |
| 3 | #4 | [Integrante 3 — Superadministración y gestión de refugios](03-gestion-refugios.md) | feature/equipo-3-gestion-refugios | 2 |
| 4 | #5 | [Integrante 4 — Salud, trazabilidad y preparación de entrega](04-salud-entrega.md) | feature/equipo-4-salud-entrega | 1 |

## Contratos y responsabilidades compartidas

- 1 mantiene componentes, layouts y tipos; cada módulo mantiene sus propias pantallas.
- 2 mantiene autenticación y reglas de adopción y revisa contratos de permisos/rutas. 3 implementa el ciclo de vida del personal del refugio; los cambios necesarios en User, sesión o middleware se revisan con 2, sin dos implementaciones paralelas.
- 3 mantiene animales, refugios, dashboard e integridad del esquema. 4 implementa agenda y auditoría y acuerda los indicadores de salud con 3.
- Cada autor escribe sus pruebas. 4 mantiene la infraestructura y el recorrido de entrega, sin asumir todas las pruebas.
- Las nuevas migraciones tienen nombres distintos; no modificar las ya aplicadas. Los informes históricos no sustituyen docs/10 y docs/12.

## Orden de integración

1. Revisar la base y repartir los cuatro prompts. Confirmar los contratos de suspensión de personal, agenda/auditoría e indicadores antes de editar archivos compartidos.
2. Trabajar en paralelo en PR pequeños contra la base común. Empezar por reproducción y validación; publicar cambios con pruebas y evidencia.
3. Integrar primero los cambios de esquema y permisos que necesiten otros módulos, con revisión de sus responsables. Después sus interfaces. No reservar todo el trabajo de una persona para un único PR grande.
4. Ejecutar la prueba final conjunta en una instalación desechable: superadmin crea refugio y administrador; admin carga animal/fotos/salud; adoptante lo encuentra por ambos recorridos y solicita; admin evalúa y concreta; historial intacto. Repetir con dos refugios y probar accesos ajenos.
5. Cerrar cada issue cuando su aceptación tenga evidencia. La publicación real es una fase separada, preparada por 4 y coordinada con 2/3, con autorización del equipo.

## Alcance de esta etapa

Terminar y verificar el producto existente para la entrega: sitio público, cuentas/adopciones, administración y salud. Incluye guías e instalación reproducible. No incluye chat, pagos, donaciones, nuevos roles, traslados, readopción ni autorregistro de refugios. Restauración de animales y retiro de solicitudes requieren un acuerdo de negocio aparte.

La configuración de correo real y la puesta online se preparan; requieren que el equipo aporte servicio/destino y autorización antes de usarlos. Hasta entonces se validan con servicios desechables y datos ficticios.
