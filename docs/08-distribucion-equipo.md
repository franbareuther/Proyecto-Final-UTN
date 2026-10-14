# Distribución del equipo — Huella multirrefugio

Los PR #1 y #6 ya están integrados en main. El PR #7 contiene trabajo visual. La base multirrefugio aprovecha esa presentación y añade datos, permisos y pantallas comunes. No atribuir tareas completadas a los cuatro integrantes sin confirmar sus identidades y participación.

Los issues #2–#5 identifican las cuatro áreas. Sus textos originales describen la etapa anterior: leerlos junto a este plan. No se cambiaron sus asignaciones desde esta implementación. Confirmar los usuarios y una base común integrada antes de crear ramas.

| Integrante / issue | Propiedad principal | Trabajo de validación y mejora |
|---|---|---|
| 1 / #2 | Páginas públicas, CatalogController, componentes, layouts, estilos y tipos compartidos | Recorrido Huella → refugio → catálogo → animal; filtros, vacíos, fotos, teclado y responsive. Revisar PR #7 y componentes con los otros módulos. |
| 2 / #3 | User, autenticación, RequireRole, policies de solicitudes, AdoptionService, páginas del adoptante y Admin/Requests/Adoptions; integración de rutas | Aislamiento por refugio, adoptante global, solicitudes históricas, permisos y concurrencia con conexiones independientes. Revisar ampliaciones de roles. |
| 3 / #4 | Shelter, ShelterController, superadmin, perfil del refugio, CRUD/fotos/AnimalPolicy, Animal, dashboard e integridad del esquema | Alta manual real, cuentas del refugio, actualización del refugio inicial, fotos e indicadores separados. Revisar permisos con 2. |
| 4 / #5 | Salud, modelos clínicos, agenda, tests/CI y documentación de instalación | Privacidad entre refugios, autoría, fechas y agenda; actualización MySQL, migraciones, historial y recorrido completo. |

Cada autor escribe las pruebas de su módulo. ScopedToStaffShelter es compartido: 2 revisa permisos, 3 relaciones y 4 casos transversales. No desactivar el scope para resolver un problema visual; cualquier excepción requiere autorización y tests.

## Secuencia

1. Revisar PR #7 y PR multirrefugio con sus dependencias. Un mantenedor integra después de revisión y CI; no hay merges automáticos.
2. Confirmar main con la base completa; cada integrante crea una rama corta desde ese commit.
3. Usar instalaciones personales con dos refugios de prueba. No compartir .env, bases ni contraseñas. La actualización de datos reales requiere respaldo y coordinación.
4. Mantener issues abiertos hasta cumplir criterios actualizados con evidencia. Implementación no equivale a validación de usuarios.
5. Revisiones cruzadas: 3 revisa 1, 4 revisa 2, 2 revisa 3 y 1 revisa 4. Permisos también 2; esquema también 3.

Una cuenta de personal pertenece a un refugio; adoptantes pueden usar varios. Solo hay tres roles: superadministrador, administrador del refugio y adoptante. El administrador carga la salud; el superadministrador gestiona altas y habilitación, sin decidir adopciones o modificar clínica. La conversación previa ocurre fuera del sistema. Quedan fuera pagos, donaciones, chat, autorregistro, traslados y diagnósticos automáticos.

Los prompts individuales se preparan posteriormente sobre esta base y con responsables confirmados. La navegación general y la migración de roles se detallan en [la nueva etapa](12-catalogo-y-tres-roles.md). Ver [implementación y actualización](10-multirrefugio.md).
