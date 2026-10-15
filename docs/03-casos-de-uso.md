> Actualización multirrefugio: consultar [diseño y actualización vigentes](10-multirrefugio.md). Las referencias a un refugio único y al estado previo de los PR pertenecen a la etapa inicial.

# Casos de uso

Actores: visitante, adoptante, administrador del refugio y superadministrador. No existe perfil veterinario. El profesional que atendió se registra como dato clínico, separado del usuario autor.

## CU01 — Gestionar una adopción

Precondición: existe un animal disponible. El visitante se registra, consulta el catálogo, abre el perfil y completa su solicitud. Laravel toma su identidad de la sesión. El adoptante consulta su seguimiento. Un administrador revisa el formulario y registra su decisión con un motivo visible para el adoptante.

Una aprobación coloca al animal en proceso de adopción y permite **registrar la adopción** mediante otra operación. Esta crea el registro definitivo, actualiza solicitud y animal a Adoptado y cierra otras solicitudes activas con motivo explícito e historial. La operación completa es transaccional.

Flujos alternativos: formulario inválido devuelve errores; solicitud activa duplicada se rechaza; animal no disponible impide solicitar; rechazo cierra el recorrido; rechazo de una aprobación libera la reserva. Una solicitud rechazada o adoptada es terminal. Una solicitud nueva no puede saltar directamente a Adoptado.

```mermaid
flowchart LR
 A[Registro] --> B[Catálogo y filtros] --> C[Perfil] --> D[Solicitud Nueva]
 D --> E[En revisión]
 D --> F[Aprobada]
 E --> F
 E --> G[Rechazada]
 D --> G
 F --> H[Registrar adopción]
 F --> G
 H --> I[Animal y solicitud Adoptado]
```

## Otros casos

- CU02: administrador registra o edita un animal y administra sus fotos. Si tiene solicitudes activas no puede archivarlo ni ponerlo temporalmente no disponible. El archivo es lógico y conserva relaciones.
- CU03: un administrador del refugio activo consulta antecedentes y registra o corrige una atención de un animal sin archivar. Otro administrador del mismo refugio puede corregirla; recorded_by se conserva y updated_by identifica al editor. La auditoría guarda actor, fecha y valores anteriores/nuevos en la misma transacción. No hay borrado clínico.
- CU04: el administrador consulta agenda vencida, de hoy, próximos 30 días, realizados/aplicadas, cancelados o todos. Actualiza el estado de un control en la historia. Para una dosis programada registra una aplicación real enlazada, o cancela con motivo; una segunda resolución se rechaza. La migración marca programaciones anteriores sin cumplimiento verificado, sin fabricar aplicaciones. El animal archivado solo admite lectura de antecedentes y auditoría por su refugio.
- CU06: el superadministrador crea/habilita refugios y sus administradores; no opera adopciones ni salud. Ambos catálogos permiten explorar la red a cualquier visitante o rol, sin conceder permisos internos ajenos.
- CU05: administrador consulta indicadores y actividad reciente. Los gráficos muestran datos reales y no generan valores simulados.
