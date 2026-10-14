import { Head, Link, useForm } from '@inertiajs/react';
import { Animal, Page } from '@/types/shelter';
import { Badge, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
export default function Index({
    animals,
    filters,
}: {
    animals: Page<Animal>;
    filters: Record<string, string>;
}) {
    const f = useForm({ q: filters.q || '' });
    return (
        <Shell internal>
            <Head title="Veterinaria" />
            <Title
                title="Cuidar también es acompañar."
                text="Historias clínicas internas, tratamientos y seguimiento sanitario."
            >
                <Link className="btn" href="/veterinaria/controles">
                    Ver agenda
                </Link>
            </Title>
            <form
                className="mb-6 flex items-end gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/veterinaria');
                }}
            >
                <Field label="Buscar animal">
                    <input value={f.data.q} onChange={(e) => f.setData('q', e.target.value)} />
                </Field>
                <button className="btn" disabled={f.processing}>
                    Buscar
                </button>
            </form>
            <Errors errors={f.errors} />
            {animals.data.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {animals.data.map((a) => (
                        <Link
                            key={a.id}
                            href={'/veterinaria/' + a.id}
                            className="card flex items-center gap-5 hover:border-emerald-500"
                        >
                            <img
                                alt=""
                                src={a.photo_url}
                                className="h-20 w-20 rounded-xl object-cover"
                            />
                            <div>
                                <h2 className="mb-2 text-xl font-semibold">{a.name}</h2>
                                <p className="mb-2 text-sm text-stone-500">
                                    {a.species} · {a.sex} · {a.size}
                                </p>
                                <Badge>{a.availability_status}</Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Empty />
            )}
            <Pagination page={animals} />
        </Shell>
    );
}
