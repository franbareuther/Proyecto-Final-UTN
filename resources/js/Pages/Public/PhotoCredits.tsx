import { Head } from '@inertiajs/react';
import { Shell, Title } from '@/Components/Shelter';

type Credit = {
    key: string;
    file: string;
    title: string;
    source: string;
    author: string;
    license: string;
    licenseUrl: string;
};

export default function PhotoCredits({ photos }: { photos: Credit[] }) {
    return (
        <Shell>
            <Head title="Créditos de fotografías" />
            <Title
                title="Fotografías con historia."
                text="Fuentes y licencias de las imágenes documentales de nuestros refugios de demostración."
            />
            <p className="mb-10 max-w-3xl leading-relaxed text-stone-600">
                Son fotografías de perros e instalaciones reales, usadas como referencia visual. Los
                nombres, las ciudades y las fichas de los tres refugios demo son ficticios; no
                representan a las organizaciones fotografiadas ni la disponibilidad actual de esos
                animales.
            </p>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                    <article key={photo.key} className="min-w-0">
                        <img
                            src={`/images/demo/refugios/${photo.file}`}
                            alt="Fotografía documental de un refugio o sus perros"
                            loading="lazy"
                            className="mb-4 aspect-[4/3] w-full rounded-xl object-cover"
                        />
                        <h2 className="break-words text-lg font-semibold text-emerald-950">
                            {photo.title.replace(/^File:/, '')}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">
                            Fotografía: {photo.author}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-emerald-900">
                            <a
                                href={photo.source}
                                className="underline underline-offset-4"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Ver fuente original
                            </a>
                            <a
                                href={photo.licenseUrl}
                                className="underline underline-offset-4"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {photo.license}
                            </a>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-stone-500">
                            Vista reducida de Wikimedia Commons. Recorte visual para adaptar la
                            imagen a las tarjetas; sin retoque de su contenido.
                        </p>
                    </article>
                ))}
            </div>
        </Shell>
    );
}
