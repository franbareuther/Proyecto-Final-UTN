# Distribución actual del equipo

La base de Huellitas ya está implementada: catálogo general y por refugio; tres roles; alta manual de instituciones; solicitudes/adopciones; administración; salud del refugio. Las tareas siguientes completan su uso, calidad y entrega. Los issues #2–#5 se actualizan para esta etapa.

| Integrante | Responsabilidad | Entrega principal |
|---|---|---|
| 1 — Laureano / #2 | Sitio público, catálogos, navegación, componentes y accesibilidad | Ambos recorridos utilizables en escritorio/tableta/celular, con evidencia. |
| 2 / #3 | Cuentas, permisos y adopciones | Autenticación en español, seguimiento claro y decisiones seguras bajo concurrencia. |
| 3 / #4 | Superadmin, personal, animales, fotos e indicadores | Operación del refugio y administración/suspensión segura de sus accesos. |
| 4 / #5 | Salud, agenda, auditoría y preparación de entrega | Dosis cumplidas, antecedentes auditables e instalación/documentación vigentes. |

El reparto detallado y los cuatro prompts están en [docs/equipo/00-coordinacion.md](equipo/00-coordinacion.md). Cada prompt incluye alcance, archivos, límites, pruebas, aceptación, rama y revisor. Cada integrante escribe sus propias pruebas.

La base publicada está en feature/huella-multirrefugio, con PR #8 dependiente del visual #7. Mientras no se integren, todos parten de esa rama actual. Cuando main los contenga, podrán partir de main verificado. Esta publicación no hace merges ni cierra tareas.

Solo existen superadmin, admin del refugio y adoptante. El administrador carga y corrige la salud de su institución; el superadmin no opera clínica o adopciones. La autoría clínica y el profesional se distinguen. Los catálogos públicos abarcan la red, mientras los paneles y escrituras internas se limitan a cada refugio.

No inventar identidades de los integrantes 2–4. Confirmar sus usuarios cuando se quieran asignar nominalmente en GitHub. Revisión cruzada: 3 revisa 1, 4 revisa 2, 2 revisa 3 y 1 revisa 4. Cambios compartidos de permisos y esquema requieren también revisión de su propietario.
