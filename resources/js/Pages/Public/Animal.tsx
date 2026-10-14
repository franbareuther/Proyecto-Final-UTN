import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Animal as AnimalType, Shared } from '@/types/shelter';
import { Badge, date, Shell } from '@/Components/Shelter';
import AnimalImage from '@/Components/AnimalImage';
import Icon from '@/Components/Icon';

export default function Animal({ animal: a }: { animal: AnimalType }) {
    const [selected, setSelected] = useState(0);
    const { auth } = usePage<Shared>().props;
    useEffect(() => setSelected(0), [a.id]);
    const photos = a.photos.length
        ? a.photos.map((photo, index) => ({
              id: photo.id,
              src: index === 0 ? a.photo_url : '/storage/' + photo.file_path,
          }))
        : [{ id: 0, src: a.photo_url }];
    const index = Math.min(selected, photos.length - 1);
    const canApply =
        a.availability_status === 'Disponible' && (!auth.user || auth.user.role === 'adoptante');
    return (
        <Shell>
            <Head title={`Conocé a ${a.name}`} />
            <nav
                aria-label="Ruta de navegación"
                className="mb-6 flex flex-wrap items-center gap-2 text-sm text-stone-600"
            >
                <Link href="/animales" className="text-link">
                    Animales del refugio
                </Link>
                <Icon name="chevron" className="h-3 w-3" />
                <span className="min-w-0 break-words" aria-current="page">
                    {a.name}
                </span>
            </nav>
            <div className="profile-layout">
                <section aria-label={`Fotografías de ${a.name}`} className="min-w-0">
                    <div className="relative">
                        <AnimalImage
                            key={photos[index].src}
                            src={photos[index].src}
                            alt={`${a.name}, fotografía ${index + 1} de ${photos.length}`}
                            loading="eager"
                            className="gallery-photo"
                        />
                        <div className="absolute left-4 top-4 right-4">
                            <Badge>{a.availability_status}</Badge>
                        </div>
                        {photos.length > 1 && (
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                                <button
                                    className="btn-secondary border-white"
                                    type="button"
                                    aria-label={`Foto anterior de ${a.name}`}
                                    onClick={() =>
                                        setSelected((index - 1 + photos.length) % photos.length)
                                    }
                                >
                                    <Icon name="chevron" className="h-4 w-4 rotate-180" />
                                </button>
                                <span
                                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-950"
                                    role="status"
                                >
                                    Foto {index + 1} de {photos.length}
                                </span>
                                <button
                                    className="btn-secondary border-white"
                                    type="button"
                                    aria-label={`Foto siguiente de ${a.name}`}
                                    onClick={() => setSelected((index + 1) % photos.length)}
                                >
                                    <Icon name="chevron" className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    {photos.length > 1 && (
                        <div
                            className="mt-4 flex gap-3 overflow-x-auto px-1 py-2"
                            aria-label="Elegir fotografía"
                        >
                            {photos.map((photo, i) => (
                                <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => setSelected(i)}
                                    aria-label={`Ver foto ${i + 1} de ${a.name}`}
                                    aria-pressed={index === i}
                                    className={
                                        'shrink-0 overflow-hidden rounded-xl border-2 p-1 transition ' +
                                        (index === i
                                            ? 'border-emerald-800'
                                            : 'border-transparent hover:border-stone-400')
                                    }
                                >
                                    <AnimalImage
                                        src={photo.src}
                                        alt=""
                                        className="h-16 w-20 rounded-lg object-cover sm:h-20 sm:w-24"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-stone-600">
                        <Icon name="paw" className="mt-0.5 h-4 w-4 shrink-0" />
                        Detrás de cada foto hay una historia que merece ser conocida.
                    </p>
                </section>
                <div className="min-w-0">
                    <p className="eyebrow">Un nuevo capítulo puede empezar acá</p>
                    <h1 className="public-heading mt-4">
                        Hola, soy
                        <br />
                        <span className="font-serif italic font-normal text-huella-clay">
                            {a.name}.
                        </span>
                    </h1>
                    <p className="mt-4 break-words text-lg text-stone-600">
                        {a.species} · {a.breed || 'Raza sin especificar'}
                    </p>
                    <dl className="my-7 grid min-w-0 grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                        {[
                            ['Sexo', a.sex],
                            ['Tamaño', a.size],
                            ['Color', a.color],
                            [
                                'Edad',
                                a.birth_date
                                    ? `Nació el ${date(a.birth_date)}`
                                    : a.estimated_age !== null
                                      ? `${a.estimated_age} meses aprox.`
                                      : 'A confirmar con el refugio',
                            ],
                        ].map(([label, value]) => (
                            <div className="min-w-0" key={label}>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                                    {label}
                                </dt>
                                <dd className="mt-2 break-words text-sm font-medium text-emerald-950 sm:text-base">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <section aria-labelledby="story-title">
                        <h2
                            id="story-title"
                            className="text-xl font-semibold tracking-tight text-emerald-950"
                        >
                            Un poquito sobre mí
                        </h2>
                        <p className="reading-copy mt-3 whitespace-pre-line break-words leading-relaxed text-stone-700">
                            {a.description}
                        </p>
                    </section>
                    <section aria-labelledby="personality-title" className="mt-7">
                        <h2
                            id="personality-title"
                            className="text-xl font-semibold tracking-tight text-emerald-950"
                        >
                            Mi personalidad
                        </h2>
                        <p className="reading-copy mt-3 whitespace-pre-line break-words leading-relaxed text-stone-700">
                            {a.personality || 'El refugio te contará más sobre mí.'}
                        </p>
                    </section>
                    <section
                        aria-labelledby="care-title"
                        className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                    >
                        <h2
                            id="care-title"
                            className="flex items-center gap-2 font-semibold text-emerald-950"
                        >
                            <Icon name="leaf" className="h-5 w-5 shrink-0" />
                            Mis cuidados
                        </h2>
                        <p className="reading-copy mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-emerald-950">
                            {a.public_health_info ||
                                'Consultá al refugio para conocer los cuidados que necesito.'}
                        </p>
                    </section>
                    <section
                        aria-label="Solicitud de adopción"
                        className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
                    >
                        {canApply ? (
                            <>
                                <h2 className="text-lg font-semibold text-emerald-950">
                                    ¿Nos damos una oportunidad?
                                </h2>
                                <p className="mb-5 mt-2 text-sm leading-relaxed text-stone-600">
                                    Contanos sobre tu hogar y el refugio te acompañará en los
                                    siguientes pasos.
                                </p>
                                <Link
                                    href={'/animales/' + a.id + '/solicitar'}
                                    className="btn w-full break-words"
                                >
                                    Quiero adoptar a {a.name}
                                    <Icon name="arrow" className="h-5 w-5 shrink-0" />
                                </Link>
                                <p className="mt-4 text-xs leading-relaxed text-stone-600">
                                    Enviar una solicitud inicia una evaluación. La adopción se
                                    confirma y registra después de la aprobación.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="font-semibold text-emerald-950">
                                    {a.availability_status === 'Disponible'
                                        ? 'Estás en el espacio del equipo'
                                        : 'Cada historia tiene sus tiempos.'}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                                    {a.availability_status === 'Disponible'
                                        ? 'Ingresaste con una cuenta del refugio. Las solicitudes se realizan desde una cuenta de adoptante.'
                                        : 'Por el momento no recibe nuevas solicitudes. Podés conocer a otros compañeros del refugio.'}
                                </p>
                                {a.availability_status !== 'Disponible' && (
                                    <Link href="/animales" className="text-link mt-3">
                                        Conocer otros animales{' '}
                                        <Icon name="arrow" className="h-4 w-4" />
                                    </Link>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </Shell>
    );
}
