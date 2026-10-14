import { Head, Link, useForm } from '@inertiajs/react';
import { Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
import { Page, Refuge } from '@/types/shelter';

export default function Shelters({
    shelters,
    filters,
}: {
    shelters: Page<Refuge>;
    filters: { q?: string };
}) {
    const form = useForm({ q: filters.q || '' });
    return (
        <Shell>
            <Head title="Refugios de Huella" />
            <Title
                title="Elegí un refugio"
                text="Conocé a quienes cuidan cada historia y descubrí los animales que esperan un hogar."
            />
            <form
                className="card mb-8 flex flex-wrap items-end gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.get('/refugios');
                }}
            >
                <div className="flex-1">
                    <Field label="Nombre o ciudad">
                        <input
                            className="input"
                            value={form.data.q}
                            onChange={(e) => form.setData('q', e.target.value)}
                        />
                    </Field>
                </div>
                <button className="btn" disabled={form.processing}>
                    Buscar
                </button>
                <Link className="btn-secondary" href="/refugios">
                    Limpiar
                </Link>
                <Errors errors={form.errors} />
            </form>
            {shelters.data.length ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {shelters.data.map((s) => (
                        <article key={s.id} className="card flex flex-col gap-4">
                            <p className="eyebrow">{s.city || 'Refugio de la red Huella'}</p>
                            <h2 className="text-2xl font-semibold text-emerald-950">{s.name}</h2>
                            <p className="line-clamp-3 text-stone-600">
                                {s.description || 'Conocé al refugio y a sus animales en adopción.'}
                            </p>
                            <Link className="btn mt-auto" href={`/refugios/${s.slug}`}>
                                Conocer el refugio
                            </Link>
                        </article>
                    ))}
                </div>
            ) : (
                <Empty>No encontramos refugios con esa búsqueda.</Empty>
            )}
            <Pagination page={shelters} />
        </Shell>
    );
}
