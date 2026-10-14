# Propuesta UX del integrante 1

Base: `main` en `1e18431`, que ya integra PR #6 y PR #1. Rama: `feature/ux-responsive-catalogo`. Alcance: Issue #2, páginas públicas y componentes compartidos del integrante 1.

## Problemas identificados en el código

- Hero y galería usan alturas fijas altas incluso en celular; títulos y nombres no tienen límites fluidos ni cortes para cadenas extensas.
- Todas las disponibilidades usan el mismo badge verde. Los links de navegación no indican página actual y el menú móvil no tiene relación aria-controls ni cierre explícito tras navegar.
- Los filtros se presentan como un bloque plano, sin resumen de filtros aplicados ni contexto del rango de resultados. Las opciones de raza y disponibilidad pueden ser largas en columnas estrechas.
- La galería no indica la miniatura seleccionada ni posición actual. Las fotos no tienen recuperación visual ante un archivo inaccesible.
- Los campos tienen etiquetas envolventes, pero no vinculan mensajes de error con aria-describedby/aria-invalid.
- Falta un enlace para saltar al contenido y el foco visible depende de estilos parciales. Textos y controles de 14 px pueden resultar pequeños para interacción táctil.

Son observaciones del código; no se presentan como defectos vistos en capturas. Computer-use no expuso navegadores ni aplicaciones. No hay evidencia visual previa a 1440×900, 768×1024 o 390×844.

## Dirección visual propuesta

Conservar Huella y el verde del refugio. Usar fondo marfil, verde bosque y pequeños acentos terracota; títulos editoriales con serif en fragmentos, texto principal sans y espacios generosos. Fotografías existentes como protagonistas, sin generar imágenes ni agregar servicios externos. No inventar estadísticas, testimonios o animales.

Home: hero dividido con título fluido, foto vinculada al animal real destacado, pasos de adopción y sección del refugio. Catálogo: cabecera clara, filtros adaptables, resumen de filtros aplicados y resultados, tarjetas con proporciones consistentes y disponibilidad diferenciada. Perfil: galería adaptable, datos legibles, selección accesible y bloque de acción con la condición de adopción existente.

Navegación pública activa, menú móvil con cierre al navegar/Escape, footer más útil, enlace para saltar al contenido. Botones y controles con foco visible y altura táctil; badges con color y texto. Los colores no serán el único indicador del estado.

## Límites y compatibilidad

No cambiar controladores, consultas, rutas, permisos, transacciones, migraciones ni configuración local. No editar páginas Auth, Adoptante, Admin o Veterinaria. Mantener nombres, props y exports existentes de los componentes compartidos; sus consumidores deben seguir compilando. La presentación de badges, campos y botones compartidos también afecta a los paneles: solicitar revisión del integrante 3 y documentar la validación visual pendiente por módulo. Cualquier rediseño propio de esos módulos requiere coordinación posterior.

No se agregan dependencias. Las fotografías y datos de MySQL siguen llegando por Inertia. Los formularios públicos solo consultan el catálogo; el enlace a solicitar adopción conserva sus condiciones actuales.

## Verificación prevista

Suite Laravel solo con base en memoria, TypeScript/Vite, formato y comprobaciones de renderizado de componentes con datos de borde. Registrar resultados reales en `02-verificacion-catalogo.md`. La revisión manual debe cubrir los tres viewports, teclado, zoom 200%, fotos inaccesibles, estados vacíos, nombres extensos y filtros/paginación. No cerrar Issue #2 como validación visual completada si no existe evidencia de navegador.
