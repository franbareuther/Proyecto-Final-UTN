# Fotografías de demostración

Las fotos incluidas son ilustrativas: no representan a animales reales del refugio. Los registros demo están identificados en sus descripciones. Se almacenan localmente para no depender de servicios externos al navegar.

Fuente: Unsplash, licencia general de Unsplash (https://unsplash.com/license).

- `perro.jpg`: archivo fuente https://images.unsplash.com/photo-1552053831-71594a27632d.
- `gato.jpg`: archivo fuente https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba.
- `companero.jpg`: archivo fuente https://images.unsplash.com/photo-1583337130417-3346a1be7dee.
- `gato-2.jpg`: https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8.
- `gato-3.jpg`: https://images.unsplash.com/photo-1573865526739-10659fec78a5.
- `gato-4.jpg`: https://images.unsplash.com/photo-1495360010541-f48722b34f7d.
- `gato-5.jpg`: https://images.unsplash.com/photo-1518791841217-8f162f1e1131.
- `perro-2.jpg`: https://images.unsplash.com/photo-1587300003388-59208cc962cb.
- `perro-3.jpg`: https://images.unsplash.com/photo-1543466835-00a7907e9de1.
- `perro-4.jpg`: https://images.unsplash.com/photo-1558788353-f76d92427f16.
- `perro-5.jpg`: https://images.unsplash.com/photo-1518717758536-85ae29035b6d.
- `perro-6.jpg`: https://images.unsplash.com/photo-1537151625747-768eb6cf92b2.
- `perro-7.jpg`: https://images.unsplash.com/photo-1583511655857-d19b40a7a54e.
- `perro-8.jpg`: https://images.unsplash.com/photo-1517849845537-4d257902454a.
- `perro-9.jpg`: https://images.unsplash.com/photo-1530281700549-e82e7bf110d6 (animal adicional de la instalación de prueba).

Cada uno de los 14 animales de `DemoSeeder` tiene una fotografía diferente y correspondiente a su especie. Esta asignación se aplica al crear una demo nueva; no reemplaza fotografías de instalaciones existentes.

Reemplazar las fotos de muestra por fotografías propias y autorizadas antes de usar el sistema en un refugio real.

## Animales decorativos del inicio

Los seis recortes de `public/images/hero/` fueron generados con IA para la composición visual del inicio: golden retriever, beagle, border collie, gato atigrado gris con rayas negras y ojos verdes, gato bicolor y conejo. Son imágenes ilustrativas; no representan animales disponibles ni se asignan a registros del catálogo. Se sirven localmente en WebP con transparencia.

Los seis animales usan las variantes `*-cara.webp`: caras ilustradas recortadas por la silueta de sus orejas y mentón, sin cuerpo ni fondo. Se distribuyen en posiciones y tamaños distintos alrededor del texto. El hero ocupa todo el ancho disponible, con fondo verde claro y cuadrícula verde fina que se desvanecen hacia blanco en el borde inferior. El mismo fondo se extiende detrás de la navbar transparente.

El hero adapta la referencia con texto centrado y caras estáticas. El título presenta la búsqueda de un compañero de huellas, con esa última palabra subrayada, y la descripción explica la conexión entre familias y refugios. La implementación usa React y CSS existentes, sin instalar otra biblioteca de componentes.
