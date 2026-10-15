import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Animal, Page } from '@/types/shelter';
import {
    Badge,
    Confirm,
    Empty,
    Errors,
    Field,
    Pagination,
    Shell,
    Title,
} from '@/Components/Shelter';
import { useEffect, useRef, useState } from 'react';
import AnimalImage from '@/Components/AnimalImage';
export default function Animals({
    animals,
    filters,
}: {
    animals: Page<Animal>;
    filters: Record<string, string>;
}) {
    const f = useForm({
        q: filters.q || '',
        species: filters.species || '',
        status: filters.status || '',
        archive: filters.archive || 'active',
    });
    useEffect(
        () =>
            f.setData({
                q: filters.q || '',
                species: filters.species || '',
                status: filters.status || '',
                archive: filters.archive || 'active',
            }),
        [filters.q, filters.species, filters.status, filters.archive],
    );
    const pending = useRef(false);
    const [busy, setBusy] = useState(false);
    const archive = (id: number) => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        router.delete('/admin/animales/' + id, {
            onFinish: () => {
                pending.current = false;
                setBusy(false);
            },
        });
    };
    const errors = usePage().props.errors;
    return (
        <Shell internal>
            <Head title="Gestión de animales" />
            <Title
                title="Los habitantes del refugio"
                text="Información, fotografías y disponibilidad en un solo lugar."
            >
                <Link className="btn" href="/admin/animales/create">
                    + Registrar animal
                </Link>
            </Title>
            <form
                className="mb-6 flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/admin/animales');
                }}
            >
                <Field label="Buscar por nombre" error={f.errors.q}>
                    <input
                        name="q"
                        type="search"
                        maxLength={100}
                        value={f.data.q}
                        onChange={(e) => f.setData('q', e.target.value)}
                    />
                </Field>
                <Field label="Especie" error={f.errors.species}>
                    <select
                        name="species"
                        value={f.data.species}
                        onChange={(e) => f.setData('species', e.target.value)}
                    >
                        <option value="">Todas</option>
                        {['Perro', 'Gato', 'Otro'].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Disponibilidad" error={f.errors.status}>
                    <select
                        name="status"
                        value={f.data.status}
                        onChange={(e) => f.setData('status', e.target.value)}
                    >
                        <option value="">Todas</option>
                        {[
                            'Disponible',
                            'En proceso de adopción',
                            'Adoptado',
                            'No disponible temporalmente',
                        ].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Archivo" error={f.errors.archive}>
                    <select
                        name="archive"
                        value={f.data.archive}
                        onChange={(e) => f.setData('archive', e.target.value)}
                    >
                        <option value="active">Sin archivar</option>
                        <option value="archived">Archivados</option>
                        <option value="all">Todos</option>
                    </select>
                </Field>
                <button className="btn" disabled={f.processing}>
                    Buscar
                </button>
                <Link className="text-link" href="/admin/animales">
                    Limpiar filtros
                </Link>
            </form>
            <Errors errors={errors} />
            {animals.data.length ? (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500">
                            <tr>
                                {['Animal', 'Características', 'Estado', 'Acciones'].map((h) => (
                                    <th className="p-5 font-medium" key={h}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {animals.data.map((a) => (
                                <tr key={a.id}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <AnimalImage
                                                src={a.photo_url}
                                                alt=""
                                                className="h-12 w-12 rounded-xl object-cover"
                                            />
                                            <strong className="max-w-64 break-words">
                                                {a.name}
                                            </strong>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {a.species} · {a.size}
                                        <p className="text-stone-500">{a.breed}</p>
                                    </td>
                                    <td className="p-5">
                                        <Badge>{a.availability_status}</Badge>
                                        {a.deleted_at && (
                                            <p className="mt-2 font-semibold text-stone-600">
                                                Archivado
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        {!a.deleted_at ? (
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    className="btn-secondary"
                                                    href={'/admin/animales/' + a.id + '/edit'}
                                                >
                                                    Editar
                                                </Link>
                                                <Link
                                                    className="btn-secondary"
                                                    href={'/veterinaria/' + a.id}
                                                >
                                                    Historia clínica
                                                </Link>
                                                <Confirm
                                                    label="Archivar"
                                                    title={'Archivar a ' + a.name}
                                                    busy={busy}
                                                    onConfirm={() => archive(a.id)}
                                                >
                                                    <p>
                                                        Se retirará del catálogo. Conservaremos las
                                                        adopciones y los antecedentes veterinarios.
                                                    </p>
                                                </Confirm>
                                            </div>
                                        ) : (
                                            <p className="text-stone-600">
                                                Historial conservado. Sin acciones de restauración.
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty>No hay animales con estos criterios. Podés limpiar los filtros.</Empty>
            )}
            <Pagination page={animals} />
        </Shell>
    );
}
