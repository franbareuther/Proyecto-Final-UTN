import { Head, Link } from '@inertiajs/react';
import { Empty, Shell, Title } from '@/Components/Shelter';
import { Refuge } from '@/types/shelter';

type Total = { label: string; total: number };
type RefugeSummary = Refuge & {
    animals_count: number;
    available_count: number;
    staff_count: number;
};

function Distribution({ title, items }: { title: string; items: Total[] }) {
    const max = Math.max(1, ...items.map((item) => item.total));
    return (
        <section className="card">
            <h2 className="mb-5 text-lg font-semibold">{title}</h2>
            {items.length ? (
                items.map((item) => (
                    <div key={item.label} className="mb-4 last:mb-0">
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                            <span>{item.label}</span>
                            <strong>{item.total}</strong>
                        </div>
                        <div
                            className="h-2 overflow-hidden rounded-full bg-stone-100"
                            aria-hidden="true"
                        >
                            <div
                                className="h-full rounded-full bg-emerald-700"
                                style={{ width: `${(item.total / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-stone-500">Todavía no hay registros.</p>
            )}
        </section>
    );
}

export default function Dashboard({
    stats,
    shelters,
    species,
    statuses,
}: {
    stats: { label: string; value: number; href: string }[];
    shelters: RefugeSummary[];
    species: Total[];
    statuses: Total[];
}) {
    return (
        <Shell internal>
            <Head title="Resumen de la red" />
            <Title
                title="Resumen de la red"
                text="Animales, adopciones y cuidados de todos los refugios. Cada indicador abre su listado."
            >
                <Link className="btn" href="/superadmin/refugios">
                    Gestionar refugios
                </Link>
            </Title>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-emerald-700 sm:p-5"
                    >
                        <p className="text-xs text-stone-500 sm:text-sm">{stat.label}</p>
                        <div className="mt-3 flex items-end justify-between gap-2">
                            <strong className="text-3xl font-semibold leading-none text-emerald-900 sm:text-4xl">
                                {stat.value}
                            </strong>
                            <span aria-hidden="true" className="text-emerald-800">
                                →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="mb-6 grid gap-5 lg:grid-cols-2">
                <Distribution title="Animales por especie · sin archivar" items={species} />
                <Distribution title="Solicitudes por estado" items={statuses} />
            </div>
            <section>
                <h2 className="mb-4 text-xl font-semibold">Actividad por refugio</h2>
                {shelters.length ? (
                    <div className="card overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-stone-200 text-stone-500">
                                <tr>
                                    {[
                                        'Refugio',
                                        'Estado',
                                        'Animales sin archivar',
                                        'Disponibles',
                                        'Equipo',
                                        'Detalle',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="whitespace-nowrap p-3 font-medium"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {shelters.map((shelter) => (
                                    <tr key={shelter.id}>
                                        <td className="p-3">
                                            <strong>{shelter.name}</strong>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {shelter.city || 'Sin localidad'}
                                            </p>
                                        </td>
                                        <td className="p-3">
                                            {shelter.active ? 'Activo' : 'Inactivo'}
                                        </td>
                                        <td className="p-3">{shelter.animals_count}</td>
                                        <td className="p-3">{shelter.available_count}</td>
                                        <td className="p-3">{shelter.staff_count}</td>
                                        <td className="p-3">
                                            <Link
                                                className="text-link whitespace-nowrap"
                                                href={`/superadmin/animales?shelter=${shelter.id}`}
                                            >
                                                Ver animales →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty>Creá el primer refugio para empezar a ver la actividad de la red.</Empty>
                )}
            </section>
        </Shell>
    );
}
