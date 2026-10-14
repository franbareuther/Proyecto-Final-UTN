import { Head, useForm } from '@inertiajs/react';
import { Application, Page } from '@/types/shelter';
import { Field, Pagination, RequestList, Shell, Title } from '@/Components/Shelter';
export default function Requests({
    requests,
    filters,
}: {
    requests: Page<Application>;
    filters: Record<string, string>;
}) {
    const f = useForm({ q: filters.q || '', status: filters.status || '' });
    return (
        <Shell internal>
            <Head title="Solicitudes" />
            <Title
                title="Solicitudes de adopción"
                text="Evaluá cada historia y acompañá el encuentro con una nueva familia."
            />
            <form
                className="card mb-6 grid items-end gap-4 sm:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/admin/solicitudes');
                }}
            >
                <Field label="Adoptante o animal">
                    <input value={f.data.q} onChange={(e) => f.setData('q', e.target.value)} />
                </Field>
                <Field label="Estado">
                    <select
                        value={f.data.status}
                        onChange={(e) => f.setData('status', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <button disabled={f.processing} className="btn">
                    Buscar
                </button>
            </form>
            <RequestList requests={requests.data} admin />
            <Pagination page={requests} />
        </Shell>
    );
}
