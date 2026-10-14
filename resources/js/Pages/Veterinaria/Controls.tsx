import { Head, Link } from '@inertiajs/react';
import { MedicalRecord, Page } from '@/types/shelter';
import { Badge, date, Empty, Pagination, Shell, Title } from '@/Components/Shelter';
export default function Controls({
    controls,
    vaccinations,
    today,
}: {
    controls: Page<MedicalRecord>;
    vaccinations: MedicalRecord[];
    today: string;
}) {
    return (
        <Shell internal>
            <Head title="Agenda veterinaria" />
            <Title
                title="Agenda de cuidados"
                text="Controles pendientes, vencimientos y próximas dosis."
            />
            <h2 className="mb-4 text-xl font-semibold">Controles pendientes</h2>
            {controls.data.length ? (
                <div className="card divide-y p-0">
                    {controls.data.map((c) => (
                        <Link
                            className="flex flex-wrap items-center justify-between gap-4 p-5"
                            key={c.id}
                            href={'/veterinaria/' + c.animal?.id}
                        >
                            <div>
                                <strong>{c.animal?.name}</strong>
                                <p className="mt-1 text-sm text-stone-500">
                                    {String(c.control_type)} · {date(String(c.scheduled_date))}
                                </p>
                            </div>
                            <Badge>
                                {String(c.scheduled_date) < today ? 'Vencido' : 'Próximo'}
                            </Badge>
                        </Link>
                    ))}
                </div>
            ) : (
                <Empty>No hay controles pendientes.</Empty>
            )}
            <Pagination page={controls} />
            <h2 className="mb-4 mt-10 text-xl font-semibold">
                Vacunas: vencidas o previstas en 30 días
            </h2>
            {vaccinations.length ? (
                <div className="card space-y-5">
                    {vaccinations.map((v) => (
                        <Link key={v.id} className="block" href={'/veterinaria/' + v.animal?.id}>
                            <strong>{v.animal?.name}</strong> · {String(v.vaccine_name)}
                            <p className="mt-1 text-sm text-stone-500">
                                Próxima dosis: {date(String(v.next_dose_date))}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <Empty>No hay vencimientos de vacunación en este período.</Empty>
            )}
        </Shell>
    );
}
