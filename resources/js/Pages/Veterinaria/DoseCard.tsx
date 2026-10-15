import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Dose } from '@/types/health';
import { Badge, Errors, Field, date } from '@/Components/Shelter';

export default function DoseCard({ dose, readOnly }: { dose: Dose; readOnly: boolean }) {
    const [action, setAction] = useState<'apply' | 'cancel'>('apply');
    const sending = useRef(false);
    const f = useForm({
        vaccine_name: String(dose.source.vaccine_name || ''),
        application_date: new Date().toLocaleDateString('en-CA'),
        dose: '',
        practitioner_name: '',
        observations: '',
        next_dose_date: '',
        cancellation_reason: '',
    });
    return (
        <article className="card min-w-0 space-y-4">
            <h3 className="break-words font-semibold">
                {String(dose.source.vaccine_name)} · {date(dose.scheduled_date)}
            </h3>
            <Badge>{dose.status}</Badge>
            <p className="text-sm text-stone-600">
                Vacunación de origen #{dose.source_vaccination_id}.{' '}
                {dose.legacy_unverified &&
                    'Programación anterior sin cumplimiento histórico verificado.'}
            </p>
            {dose.application_vaccination_id && (
                <p className="text-sm">
                    Aplicación registrada #{dose.application_vaccination_id} ·{' '}
                    {date(String(dose.application?.application_date || ''))}
                </p>
            )}
            {dose.cancellation_reason && (
                <p className="break-words text-sm">Motivo: {dose.cancellation_reason}</p>
            )}
            {dose.resolved_at && (
                <p className="text-sm text-stone-600">
                    Resuelta por {dose.resolver?.name} {dose.resolver?.last_name} ·{' '}
                    {date(dose.resolved_at)}
                </p>
            )}
            {!readOnly && dose.status === 'Pendiente' && (
                <details>
                    <summary className="text-link cursor-pointer">
                        Registrar aplicación o cancelación
                    </summary>
                    <form
                        className="mt-4 space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (sending.current) return;
                            sending.current = true;
                            f.post(`/veterinaria/${dose.animal_id}/dosis/${dose.id}/${action}`, {
                                preserveScroll: true,
                                onFinish: () => {
                                    sending.current = false;
                                },
                            });
                        }}
                    >
                        <p className="text-sm text-stone-600">
                            Confirmá únicamente una aplicación real indicada por el profesional. No
                            se completa por fecha ni se genera una dosis automáticamente.
                        </p>
                        <Field label="Acción">
                            <select
                                value={action}
                                disabled={f.processing}
                                onChange={(e) => {
                                    setAction(e.target.value as 'apply' | 'cancel');
                                    f.clearErrors();
                                }}
                            >
                                <option value="apply">Registrar dosis aplicada</option>
                                <option value="cancel">Cancelar programación</option>
                            </select>
                        </Field>
                        <Errors errors={f.errors} />
                        {action === 'cancel' ? (
                            <Field
                                label="Motivo de cancelación"
                                error={f.errors.cancellation_reason}
                            >
                                <textarea
                                    required
                                    maxLength={5000}
                                    value={f.data.cancellation_reason}
                                    onChange={(e) =>
                                        f.setData('cancellation_reason', e.target.value)
                                    }
                                />
                            </Field>
                        ) : (
                            <>
                                {(
                                    [
                                        ['vaccine_name', 'Vacuna aplicada', 'text'],
                                        ['application_date', 'Fecha real de aplicación', 'date'],
                                        ['dose', 'Dosis aplicada (según indicación)', 'text'],
                                        [
                                            'practitioner_name',
                                            'Profesional que atendió (si se conoce)',
                                            'text',
                                        ],
                                        [
                                            'next_dose_date',
                                            'Otra próxima dosis (solo si fue indicada)',
                                            'date',
                                        ],
                                    ] as const
                                ).map(([key, label, type]) => (
                                    <Field key={key} label={label} error={f.errors[key]}>
                                        <input
                                            type={type}
                                            required={
                                                key === 'vaccine_name' || key === 'application_date'
                                            }
                                            value={f.data[key]}
                                            onChange={(e) => f.setData(key, e.target.value)}
                                        />
                                    </Field>
                                ))}
                                <Field label="Observaciones" error={f.errors.observations}>
                                    <textarea
                                        maxLength={5000}
                                        value={f.data.observations}
                                        onChange={(e) => f.setData('observations', e.target.value)}
                                    />
                                </Field>
                            </>
                        )}
                        <button className="btn" disabled={f.processing}>
                            {f.processing
                                ? 'Guardando…'
                                : action === 'apply'
                                  ? 'Confirmar aplicación real'
                                  : 'Confirmar cancelación'}
                        </button>
                    </form>
                </details>
            )}
        </article>
    );
}
