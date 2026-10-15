import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { Confirm, Errors, Field } from '@/Components/Shelter';
import { Person, Refuge } from '@/types/shelter';

export default function StaffEditor({ person, shelter }: { person: Person; shelter: Refuge }) {
    const f = useForm({
        name: person.name,
        last_name: person.last_name,
        email: person.email,
        suspended: !!person.suspended_at,
    });
    const sending = useRef(false);
    const save = () => {
        if (sending.current) return;
        sending.current = true;
        f.patch(`/superadmin/refugios/${shelter.slug}/personal/${person.id}`, {
            preserveScroll: true,
            onFinish: () => {
                sending.current = false;
            },
        });
    };
    return (
        <section
            className="min-w-0 space-y-4 rounded-xl border border-stone-200 p-4"
            aria-label={`Cuenta de ${person.name} ${person.last_name}`}
        >
            <p className="break-words font-semibold">
                {person.name} {person.last_name} ·{' '}
                {person.suspended_at ? 'Acceso suspendido' : 'Acceso habilitado'}
            </p>
            <Errors errors={f.errors} />
            <div className="grid gap-4 sm:grid-cols-2">
                {(
                    [
                        ['name', 'Nombre'],
                        ['last_name', 'Apellido'],
                        ['email', 'Correo de acceso'],
                    ] as const
                ).map(([key, label]) => (
                    <Field key={key} label={label} error={f.errors[key]}>
                        <input
                            type={key === 'email' ? 'email' : 'text'}
                            name={key}
                            required
                            maxLength={255}
                            value={f.data[key]}
                            onChange={(e) => f.setData(key, e.target.value)}
                        />
                    </Field>
                ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
                <input
                    type="checkbox"
                    checked={f.data.suspended}
                    onChange={(e) => f.setData('suspended', e.target.checked)}
                />{' '}
                Suspender acceso
            </label>
            <p className="text-sm text-stone-600">
                La suspensión bloquea ingreso y sesiones abiertas sin borrar cuentas ni historial.
                Reactivar exige un nuevo ingreso. Cambiar el correo también revoca sesiones
                anteriores.
            </p>
            <Confirm
                label={f.processing ? 'Guardando…' : 'Guardar cuenta'}
                title="Confirmar cambios de acceso"
                busy={f.processing}
                onConfirm={save}
            >
                Se guardarán los datos de esta cuenta de {shelter.name}.{' '}
                {f.data.suspended
                    ? 'Su acceso quedará suspendido.'
                    : 'Su acceso quedará habilitado mientras el refugio esté activo.'}{' '}
                No se cambia su rol ni su institución.
            </Confirm>
        </section>
    );
}
