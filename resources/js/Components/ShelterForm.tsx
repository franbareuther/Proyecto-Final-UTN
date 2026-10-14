import { useForm } from '@inertiajs/react';
import { Errors, Field } from '@/Components/Shelter';
import { Refuge } from '@/types/shelter';

export default function ShelterForm({
    shelter,
    admin = false,
}: {
    shelter?: Refuge;
    admin?: boolean;
}) {
    const f = useForm({
        name: shelter?.name || '',
        slug: shelter?.slug || '',
        description: shelter?.description || '',
        city: shelter?.city || '',
        address: shelter?.address || '',
        email: shelter?.email || '',
        phone: shelter?.phone || '',
        active: shelter?.active ?? true,
    });
    const fields: [keyof typeof f.data, string][] = [
        ['name', 'Nombre'],
        ['city', 'Ciudad'],
        ['address', 'Dirección pública'],
        ['email', 'Correo de contacto'],
        ['phone', 'Teléfono'],
    ];
    return (
        <form
            className="space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                const options = {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (!shelter) f.reset();
                    },
                };
                if (admin) f.patch('/admin/refugio', options);
                else if (shelter) f.patch(`/superadmin/refugios/${shelter.slug}`, options);
                else f.post('/superadmin/refugios', options);
            }}
        >
            <Errors errors={f.errors} />
            <div className="grid gap-5 sm:grid-cols-2">
                {fields.map(([key, label]) => (
                    <Field key={key} label={label} error={f.errors[key]}>
                        <input
                            className="input"
                            required={key === 'name'}
                            type={key === 'email' ? 'email' : 'text'}
                            value={String(f.data[key])}
                            onChange={(e) => f.setData(key, e.target.value)}
                        />
                    </Field>
                ))}
            </div>
            {!admin && (
                <Field label="Identificador en la dirección web" error={f.errors.slug}>
                    <input
                        className="input"
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        placeholder="patitas-del-sur"
                        value={f.data.slug}
                        onChange={(e) => f.setData('slug', e.target.value)}
                    />
                </Field>
            )}
            <Field label="Historia y descripción" error={f.errors.description}>
                <textarea
                    className="input min-h-32"
                    value={f.data.description}
                    onChange={(e) => f.setData('description', e.target.value)}
                />
            </Field>
            {!admin && (
                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={f.data.active}
                        onChange={(e) => f.setData('active', e.target.checked)}
                    />{' '}
                    Refugio activo
                </label>
            )}
            {!admin && shelter && (
                <p className="text-sm text-stone-600">
                    Al desactivarlo, se oculta el catálogo y se bloquean nuevas operaciones del
                    personal. Las solicitudes e historias se conservan.
                </p>
            )}
            <button className="btn" disabled={f.processing}>
                {f.processing ? 'Guardando…' : shelter ? 'Guardar cambios' : 'Crear refugio'}
            </button>
        </form>
    );
}
