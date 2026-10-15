# Salud, agenda y entrega técnica

## Criterio de cumplimiento (definido antes de implementar)

Una vacunación aplicada es un antecedente clínico. Su `next_dose_date` expresa una programación, no demuestra otra aplicación. Cada programación tiene una entidad propia vinculada a la vacunación de origen y al mismo animal, con fecha y estado Pendiente, Aplicada o Cancelada.

Aplicar un pendiente requiere que un administrador del refugio registre explícitamente vacuna, fecha real, dosis y profesional si se conoce. Se crea otro antecedente y se enlaza al pendiente, en una transacción; deja de aparecer entre pendientes. La fecha real puede diferir de la prevista, pero no ser futura ni anterior a la aplicación de origen. Solo una fecha próxima indicada por la persona crea otro pendiente: no se calculan esquemas clínicos, productos, diagnósticos ni tratamientos automáticos.

Cancelar requiere motivo y conserva origen, fecha prevista, actor y fecha de resolución. No se borra ni reabre un pendiente resuelto. Corregir el antecedente aplicado sigue siendo posible y se audita; su aplicación y autor inicial no se reemplazan. Una fecha pendiente se puede corregir con auditoría; para quitarla se usa Cancelar con motivo. La fecha de una programación resuelta no se altera desde la vacunación de origen.

La advertencia de cumplimiento histórico no verificado se retira al resolver explícitamente el pendiente; su valor anterior queda en la auditoría. Una corrección de fechas debe conservar el orden de las aplicaciones vinculadas.

La migración copia cada próxima fecha anterior a un pendiente marcado **sin cumplimiento verificado**. No deduce aplicaciones ni cancelaciones históricas por proximidad de fechas. El refugio debe revisar esos casos; confirmar una aplicación real o cancelar con explicación. Las vacunas previas, sus identificadores y autores no se modifican.

Los archivados admiten consulta interna del mismo refugio activo, con historia, auditoría y agenda identificadas como solo lectura. No permiten cargas, correcciones, aplicaciones o cancelaciones. El catálogo y solicitudes conservan su exclusión de archivados.

La auditoría registra tipo/id, animal, actor, fecha y valores anteriores/nuevos de los campos relevantes de cada corrección y resolución, dentro de la misma transacción. No se ofrece edición ni eliminación. Solo administradores del refugio activo acceden a ella; superadministradores y adoptantes no acceden a salud.

## Contratos de implementación e integración

- `HealthService::save` es la entrada para altas/correcciones de consultas, vacunas, tratamientos y controles. `resolve` aplica/cancela una programación. No agregar escrituras directas de fechas de vacunas o correcciones desde futuros consumidores: omitirían la sincronización y auditoría.
- `vaccination_doses` enlaza antecedente y aplicación con unicidad por origen/aplicación; las operaciones bloquean primero el animal y luego el pendiente. La aplicación nueva y su programación opcional se guardan en la misma transacción que el cumplimiento. Una segunda resolución se rechaza. Las pruebas secuenciales no se presentan como concurrencia con procesos independientes.
- Historial: props aditivas `readOnly`, `doses` y `audits`, ambas páginas con parámetros `dose_page` / `audit_page`. Se conservan animal y sus cuatro colecciones, con `recorder` y nuevo `updater`. Los tipos específicos están en `types/health.ts`; MedicalRecord.updater y Animal.deleted_at son opcionales para mantener consumidores previos.
- Agenda: `bucket=pending|overdue|today|upcoming|completed|cancelled|all`, páginas independientes `page` / `dose_page`, orden por fecha e id. Default: pendientes vencidos o previstos hasta hoy+30 inclusive; upcoming excluye hoy y llega hasta +30; all permite posteriores. `completed` significa controles Realizado y dosis Aplicada. `vaccinations` se conserva como prop de compatibilidad derivada de la página de dosis; la autoridad de cumplimiento es `doses`, no next_dose_date.
- Dashboard: contador nuevo `Dosis pendientes hasta 30 días (incluye vencidas)` usa exactamente el conjunto default de dosis, sin aplicadas/canceladas. Incluye antecedentes archivados, identificados como solo lectura en agenda. El contador existente de controles en 30 días incluye hoy a +30 y no vencidos; no se cambia su definición ni la de tratamientos. Integrante 3 debe revisar estas definiciones y conservar su contador separado de archivados al integrar #11.
- Permisos/rutas con 2: solo el GET `medical.show` usa withTrashed. POST/PATCH y resolución no admiten archivados. El servicio vuelve a cargar actor/animal y autoriza bajo bloqueo; al integrar la suspensión de #11 se debe conservar User::isSuspended / belongsToShelter y middleware, sin reemplazarlos por el diseño de esta base. No se incorporaron automáticamente las ramas de 2/3.
- Presentación con 1: se reutilizan Shell, Field, Errors, Badge, Pagination y AnimalImage, sin cambiar sus contratos ni duplicar ShelterImage/ShelterForm.

Migración nueva única: `2026_10_15_000003_add_health_agenda_and_audits`, separada de las 000001/000002 de las ramas 2/3. Revisar con integrante 3 antes de integrar; aplicar solo en una copia con respaldo como indica [operación](14-operacion-y-publicacion.md). Auditoría no reconstruye cambios previos al despliegue.
