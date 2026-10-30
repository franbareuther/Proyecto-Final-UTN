import { Head, Link } from '@inertiajs/react';
import { Shell, Title } from '@/Components/Shelter';
import { Refuge } from '@/types/shelter';
import ShelterImage from '@/Components/ShelterImage';

export default function Shelter({ shelter: s }: { shelter: Refuge }) {
    return (
        <Shell backdrop>
            <Head title={s.name} />
            <Link href="/refugios" className="text-link mb-6 inline-flex">
                ← Todos los refugios
            </Link>
            <Title title={s.name} text={s.city || undefined} />
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <section className="card">
                    <ShelterImage
                        src={s.image_url}
                        name={s.name}
                        kind={s.image_type}
                        className="mb-6"
                    />
                    <h2 className="mb-4 text-2xl font-semibold">Conocé nuestro refugio</h2>
                    <p className="whitespace-pre-line break-words leading-relaxed text-stone-600">
                        {s.description || 'Pronto compartiremos más sobre nuestra historia.'}
                    </p>
                    <Link className="btn mt-8" href={`/refugios/${s.slug}/animales`}>
                        Ver animales en adopción
                    </Link>
                </section>
                <aside className="card">
                    <h2 className="mb-4 text-xl font-semibold">Hablemos</h2>
                    <p className="mb-5 text-stone-600">
                        Consultanos para conocer el proceso de adopción y coordinar los próximos
                        pasos.
                    </p>
                    {s.address && <p className="mb-3 break-words">{s.address}</p>}
                    {s.phone && <p className="mb-3 break-words">Teléfono: {s.phone}</p>}
                    {s.email && (
                        <a className="text-link break-all" href={`mailto:${s.email}`}>
                            {s.email}
                        </a>
                    )}
                    {!s.phone && !s.email && (
                        <p>Los datos de contacto estarán disponibles próximamente.</p>
                    )}
                    {(s.website || s.instagram || s.facebook) && (
                        <ul className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-5" aria-label="Redes del refugio">
                            {(
                                [
                                    ['Sitio web', s.website],
                                    ['Instagram', s.instagram],
                                    ['Facebook', s.facebook],
                                ] as const
                            )
                                .filter(([, url]) => url)
                                .map(([label, url]) => (
                                    <li key={label}>
                                        <a
                                            className="btn-secondary"
                                            href={url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {label}
                                        </a>
                                    </li>
                                ))}
                        </ul>
                    )}
                </aside>
            </div>
        </Shell>
    );
}
