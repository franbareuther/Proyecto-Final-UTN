import { Head, Link } from '@inertiajs/react';
import { Adoption, Application, MedicalRecord } from '@/types/shelter';
import { date, Empty, RequestList, Shell } from '@/Components/Shelter';
function Chart({ title, items }: { title: string; items: { label: string; total: number }[] }) {
    const max = Math.max(1, ...items.map((i) => i.total));
    return (
        <section className="card">
            <h2 className="mb-6 font-semibold">{title}</h2>
            {items.length ? (
                items.map((i) => (
                    <div key={i.label} className="mb-4">
                        <div className="mb-2 flex justify-between gap-3 text-xs">
                            <span>{i.label}</span>
                            <strong>{i.total}</strong>
                        </div>
                        <div className="h-2 rounded-full bg-stone-100">
                            <div
                                className="h-2 rounded-full bg-emerald-700"
                                style={{ width: (100 * i.total) / max + '%' }}
                            />
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-stone-500">Sin registros todavía.</p>
            )}
        </section>
    );
}
export default function Dashboard({
    stats,
    species,
    statuses,
    months,
    recentRequests,
    recentAdoptions,
    controls,
}: {
    stats: Record<string, number>;
    species: { label: string; total: number }[];
    statuses: { label: string; total: number }[];
    months: { label: string; total: number }[];
    recentRequests: Application[];
    recentAdoptions: Adoption[];
    controls: MedicalRecord[];
}) {
    return (
        <Shell internal>
            <Head title="Resumen de estadísticas" />
            <h1 className="mb-5 text-2xl font-semibold tracking-tight text-emerald-950">
                Resumen de estadísticas
            </h1>
            <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(stats).map(([k, v]) => (
                    <div
                        key={k}
                        className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs text-stone-500">{k}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">
                            {v}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mb-8 grid gap-5 xl:grid-cols-3">
                <Chart title="Adopciones por mes" items={months} />
                <Chart title="Animales por especie" items={species} />
                <Chart title="Solicitudes por estado" items={statuses} />
            </div>
            <section className="mb-8">
                <div className="mb-4 flex justify-between">
                    <h2 className="text-xl font-semibold">Últimas solicitudes</h2>
                    <Link href="/admin/solicitudes" className="text-sm text-emerald-800">
                        Ver todas →
                    </Link>
                </div>
                <RequestList requests={recentRequests} admin />
            </section>
            <div className="grid gap-6 xl:grid-cols-2">
                <section>
                    <h2 className="mb-4 text-xl font-semibold">Últimas adopciones</h2>
                    {recentAdoptions.length ? (
                        <div className="card space-y-5">
                            {recentAdoptions.map((a) => (
                                <p key={a.id}>
                                    <strong>{a.animal.name}</strong> · {a.user.name}{' '}
                                    {a.user.last_name}
                                    <span className="mt-1 block text-xs text-stone-500">
                                        {date(a.adoption_date)}
                                    </span>
                                </p>
                            ))}
                        </div>
                    ) : (
                        <Empty />
                    )}
                </section>
                <section>
                    <h2 className="mb-4 text-xl font-semibold">Agenda veterinaria</h2>
                    {controls.length ? (
                        <div className="card space-y-5">
                            {controls.map((c) => (
                                <Link
                                    className="block"
                                    key={c.id}
                                    href={'/veterinaria/' + c.animal?.id}
                                >
                                    <strong>{c.animal?.name}</strong> · {String(c.control_type)}
                                    <span className="mt-1 block text-xs text-stone-500">
                                        {date(String(c.scheduled_date))}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Empty>No hay controles pendientes.</Empty>
                    )}
                </section>
            </div>
        </Shell>
    );
}
