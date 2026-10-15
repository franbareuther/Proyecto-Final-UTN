import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AnimalImage from '@/Components/AnimalImage';
import { Animal, Page } from '@/types/shelter';
import { Badge, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
export default function Index({
    animals,
    filters,
}: {
    animals: Page<Animal>;
    filters: Record<string, string>;
}) {
    const f = useForm({ q: filters.q || '', archive: filters.archive || 'active' });
    useEffect(
        () => f.setData({ q: filters.q || '', archive: filters.archive || 'active' }),
        [filters.q, filters.archive],
    );
    return (
        <Shell internal>
            <Head title="Salud y cuidados" />
            <Title
                title="Cuidar también es acompañar."
                text="Historias clínicas internas, tratamientos y seguimiento sanitario."
            >
                <Link className="btn" href="/veterinaria/controles">
                    Ver agenda
                </Link>
            </Title>
            <form
                className="mb-6 flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/veterinaria');
                }}
            >
                <Field label="Buscar animal" error={f.errors.q}>
                    <input
                        type="search"
                        maxLength={100}
                        name="q"
                        value={f.data.q}
                        onChange={(e) => f.setData('q', e.target.value)}
                    />
                </Field>
                <Field label="Archivo" error={f.errors.archive}>
                    <select
                        name="archive"
                        value={f.data.archive}
                        onChange={(e) => f.setData('archive', e.target.value)}
                    >
                        <option value="active">Sin archivar</option>
                        <option value="archived">Archivados (solo lectura)</option>
                        <option value="all">Todos</option>
                    </select>
                </Field>
                <button className="btn" disabled={f.processing}>
                    Buscar
                </button>
                <Link className="text-link" href="/veterinaria">
                    Limpiar filtros
                </Link>
            </form>
            <Errors errors={f.errors} />
            {animals.data.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {animals.data.map((a) => (
                        <Link
                            key={a.id}
                            href={'/veterinaria/' + a.id}
                            className="card flex min-w-0 items-center gap-5 hover:border-emerald-500"
                        >
                            <AnimalImage
                                alt=""
                                src={a.photo_url}
                                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                            />
                            <div className="min-w-0 break-words">
                                <h2 className="mb-2 text-xl font-semibold">{a.name}</h2>
                                <p className="mb-2 text-sm text-stone-500">
                                    {a.species} · {a.sex} · {a.size}
                                </p>
                                <Badge>{a.availability_status}</Badge>
                                {a.deleted_at && (
                                    <p className="mt-2 text-sm">Archivado · Solo lectura</p>
                                )}
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
