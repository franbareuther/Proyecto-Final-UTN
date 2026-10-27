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
export default function Animals({
    animals,
    filters,
}: {
    animals: Page<Animal>;
    filters: Record<string, string>;
}) {
    const f = useForm({ q: filters.q || '' });
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
                className="mb-6 flex items-end gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/admin/animales');
                }}
            >
                <Field label="Buscar por nombre">
                    <input value={f.data.q} onChange={(e) => f.setData('q', e.target.value)} />
                </Field>
                <button className="btn" disabled={f.processing}>
                    Buscar
                </button>
            </form>
            <Errors errors={errors} />
            {animals.data.length ? (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500">
                            <tr>
                                <th className="p-5 font-medium">Animal</th>
                                <th className="p-5 font-medium">Características</th>
                                <th className="p-5 font-medium">Estado</th>
                                <th className="w-px whitespace-nowrap p-5 text-right font-medium">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {animals.data.map((a) => (
                                <tr key={a.id}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={a.photo_url}
                                                alt=""
                                                className="h-12 w-12 rounded-xl object-cover"
                                            />
                                            <strong>{a.name}</strong>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {a.species} · {a.size}
                                        <p className="text-stone-500">{a.breed}</p>
                                    </td>
                                    <td className="p-5">
                                        <Badge>{a.availability_status}</Badge>
                                    </td>
                                    <td className="w-px whitespace-nowrap p-5">
                                        <div className="flex flex-nowrap justify-end gap-2">
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
                                                onConfirm={() =>
                                                    router.delete('/admin/animales/' + a.id)
                                                }
                                            >
                                                <p>
                                                    Se retirará del catálogo. Conservaremos las
                                                    adopciones y los antecedentes veterinarios.
                                                </p>
                                            </Confirm>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty>El refugio todavía no tiene animales registrados.</Empty>
            )}
            <Pagination page={animals} />
        </Shell>
    );
}
