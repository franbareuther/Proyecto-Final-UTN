# Arquitectura

Monolito Laravel con páginas React TypeScript servidas por Inertia. No hay API REST separada. Vite compila los recursos; Tailwind 4 usa PostCSS y la configuración compartida de estilos. Breeze suministra autenticación nativa de sesión y limitación de intentos de login.

Laravel 12 se eligió por compatibilidad con PHP 8.2 de XAMPP. Las versiones concretas reproducibles quedan en `composer.lock` y `package-lock.json`. No ejecutar actualizaciones indiscriminadas al instalar.

- `app/Http/Controllers`: entrada HTTP, consultas y respuestas Inertia.
- `app/Http/Requests`: validaciones de animales, solicitudes y registros médicos.
- `app/Http/Middleware/RequireRole`: barrera de rutas por rol.
- `app/Policies`: permisos sobre animales y solicitudes individuales.
- `app/Services/AdoptionService`: transiciones, bloqueo, transacciones, adopción e historial.
- `app/Models`: Eloquent y relaciones; no hay SQL concatenado con datos del usuario.
- `resources/js/Components/Shelter.tsx`: controles, layout, mensajes, paginación y confirmaciones.
- `resources/js/Pages`: módulos público, adoptante, administrador y veterinaria.
- `database`: esquema versionado, factory de animales y datos demo explícitos.
- `tests/Feature`: autenticación, autorización, reglas de negocio y persistencia.

CSRF y sesiones provienen del grupo web de Laravel. La identidad de adoptante/profesional y los estados iniciales se asignan en servidor. Campos de rol, revisión y adopción no entran por asignación masiva del formulario público. Fotografías admitidas: JPG/PNG/WebP, máximo 4 MB y 8 archivos por envío; se excluye SVG. Storage usa el disco público y se limpian archivos si falla el guardado.

Solo el perfil sanitario público llega al catálogo; las relaciones clínicas se cargan en rutas internas. Los datos personales de solicitudes se restringen al dueño y al administrador. Los motivos de decisiones son visibles para el adoptante; no escribir información administrativa confidencial en ellos.

Las páginas compartidas ocultan navegación según rol, pero la autorización siempre se aplica en Laravel. Las fotos son públicas por diseño; nunca subir documentos personales al módulo de imágenes. Para producción se requiere HTTPS, APP_DEBUG=false, configuración SMTP y respaldos. La configuración de despliegue no forma parte de esta entrega.
