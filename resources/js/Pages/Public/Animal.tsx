import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Animal as AnimalType, Shared } from '@/types/shelter';
import { Badge, date, Shell } from '@/Components/Shelter';
export default function Animal({ animal: a }: { animal: AnimalType }) {
    const [selected, setSelected] = useState(a.photo_url);
    const { auth } = usePage<Shared>().props;
    return (
        <Shell>
            <Head title={a.name} />
            <Link href="/animales" className="text-sm text-stone-500">
                ← Volver al catálogo
            </Link>
            <div className="mt-7 grid gap-10 lg:grid-cols-2">
                <div>
                    <img
                        src={selected}
                        alt={a.name}
                        className="h-[460px] w-full rounded-3xl object-cover"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                        {a.photos.map((p, i) => (
                            <button
                                key={p.id}
                                onClick={() => setSelected('/storage/' + p.file_path)}
                                aria-label={`Ver foto ${i + 1} de ${a.name}`}
                                className="rounded-xl focus:ring-2 focus:ring-emerald-700"
                            >
                                <img
                                    src={'/storage/' + p.file_path}
                                    alt=""
                                    className="h-20 w-24 rounded-xl object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <Badge>{a.availability_status}</Badge>
                    <h1 className="mb-3 mt-5 text-5xl font-semibold">Hola, soy {a.name}.</h1>
                    <p className="text-lg text-stone-500">
                        {a.species} · {a.breed || 'Raza sin especificar'}
                    </p>
                    <dl className="my-7 grid grid-cols-2 gap-5 rounded-2xl bg-white p-6">
                        {[
                            ['Sexo', a.sex],
                            ['Tamaño', a.size],
                            ['Color', a.color],
                            [
                                'Edad',
                                a.birth_date
                                    ? `Nacimiento: ${date(a.birth_date)}`
                                    : a.estimated_age !== null
                                      ? `${a.estimated_age} meses aprox.`
                                      : 'A confirmar',
                            ],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-xs uppercase tracking-wider text-stone-500">
                                    {k}
                                </dt>
                                <dd className="mt-1 font-medium">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="whitespace-pre-line leading-relaxed text-stone-600">
                        {a.description}
                    </p>
                    <h2 className="mb-2 mt-6 text-xl font-semibold">Mi personalidad</h2>
                    <p className="whitespace-pre-line text-stone-600">
                        {a.personality || 'El refugio te contará más sobre mí.'}
                    </p>
                    <h2 className="mb-2 mt-6 text-xl font-semibold">Mis cuidados</h2>
                    <p className="whitespace-pre-line text-stone-600">
                        {a.public_health_info ||
                            'Consultá al refugio para conocer los cuidados que necesito.'}
                    </p>
                    {a.availability_status === 'Disponible' &&
                    (!auth.user || auth.user.role === 'adoptante') ? (
                        <Link className="btn mt-8" href={'/animales/' + a.id + '/solicitar'}>
                            Quiero adoptar a {a.name} ↗
                        </Link>
                    ) : (
                        <p className="mt-8 rounded-xl bg-stone-100 p-4 text-sm">
                            {a.availability_status === 'Disponible'
                                ? 'Ingresaste con una cuenta del equipo del refugio.'
                                : 'Por el momento no recibe nuevas solicitudes.'}
                        </p>
                    )}
                    <p className="mt-4 text-sm text-stone-500">
                        Enviar una solicitud inicia la evaluación del refugio.
                    </p>
                </div>
            </div>
        </Shell>
    );
}
