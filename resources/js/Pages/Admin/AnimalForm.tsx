import { Head, router, useForm } from '@inertiajs/react';
import { Animal } from '@/types/shelter';
import { Confirm, Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function AnimalForm({ animal: a }: { animal?: Animal }) {
    const f = useForm({
        name: a?.name || '',
        species: a?.species || 'Perro',
        breed: a?.breed || '',
        sex: a?.sex || 'Hembra',
        birth_date: a?.birth_date?.slice(0, 10) || '',
        estimated_age: a?.estimated_age?.toString() || '',
        size: a?.size || 'Mediano',
        color: a?.color || '',
        description: a?.description || '',
        personality: a?.personality || '',
        entry_date: a?.entry_date?.slice(0, 10) || new Date().toLocaleDateString('en-CA'),
        availability_status:
            a?.availability_status === 'No disponible temporalmente'
                ? 'No disponible temporalmente'
                : 'Disponible',
        public_health_info: a?.public_health_info || '',
        photos: [] as File[],
        _method: a ? 'put' : 'post',
    });
    const locked = a && ['Adoptado', 'En proceso de adopción'].includes(a.availability_status);
    return (
        <Shell internal>
            <Head title={a ? 'Editar animal' : 'Registrar animal'} />
            <Title
                title={a ? `El perfil de ${a.name}` : 'Un nuevo habitante'}
                text="La información de esta ficha será visible en el catálogo público."
            />
            <form
                className="card max-w-4xl space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.post(a ? '/admin/animales/' + a.id : '/admin/animales', {
                        forceFormData: true,
                        onSuccess: () => f.setData('photos', []),
                    });
                }}
            >
                <Errors errors={f.errors} />
                <div className="grid gap-5 md:grid-cols-2">
                    {(
                        [
                            ['name', 'Nombre'],
                            ['breed', 'Raza (opcional)'],
                            ['color', 'Color'],
                            ['birth_date', 'Fecha de nacimiento (opcional)'],
                            ['estimated_age', 'Edad estimada en meses (opcional)'],
                            ['entry_date', 'Fecha de ingreso'],
                        ] as const
                    ).map(([k, l]) => (
                        <Field key={k} label={l} error={f.errors[k]}>
                            <input
                                type={
                                    k.includes('date')
                                        ? 'date'
                                        : k === 'estimated_age'
                                          ? 'number'
                                          : 'text'
                                }
                                min={k === 'estimated_age' ? 0 : undefined}
                                required={['name', 'color', 'entry_date'].includes(k)}
                                value={f.data[k]}
                                onChange={(e) => f.setData(k, e.target.value)}
                            />
                        </Field>
                    ))}
                    {(
                        [
                            ['species', 'Especie', ['Perro', 'Gato', 'Otro']],
                            ['sex', 'Sexo', ['Hembra', 'Macho']],
                            ['size', 'Tamaño', ['Pequeño', 'Mediano', 'Grande']],
                            [
                                'availability_status',
                                'Disponibilidad',
                                ['Disponible', 'No disponible temporalmente'],
                            ],
                        ] as const
                    ).map(([k, l, opts]) => (
                        <Field key={k} label={l}>
                            <select
                                disabled={k === 'availability_status' && !!locked}
                                value={f.data[k]}
                                onChange={(e) => f.setData(k, e.target.value)}
                            >
                                {opts.map((o) => (
                                    <option key={o}>{o}</option>
                                ))}
                            </select>
                            {k === 'availability_status' && locked && (
                                <span className="mt-2 block text-xs text-stone-500">
                                    Estado actual: {a.availability_status}. Se gestiona desde
                                    solicitudes.
                                </span>
                            )}
                        </Field>
                    ))}
                </div>
                {(
                    [
                        ['description', 'Descripción'],
                        ['personality', 'Personalidad'],
                        [
                            'public_health_info',
                            'Información sanitaria pública (sin datos clínicos privados)',
                        ],
                    ] as const
                ).map(([k, l]) => (
                    <Field key={k} label={l}>
                        <textarea
                            rows={4}
                            required={k === 'description'}
                            value={f.data[k]}
                            onChange={(e) => f.setData(k, e.target.value)}
                        />
                    </Field>
                ))}
                <Field label="Fotografías (JPG, PNG o WebP, hasta 8 por envío, 4 MB cada una)">
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => f.setData('photos', Array.from(e.target.files || []))}
                    />
                </Field>
                {f.progress && (
                    <progress className="w-full" value={f.progress.percentage} max={100} />
                )}
                <button className="btn" disabled={f.processing}>
                    {f.processing ? 'Guardando…' : 'Guardar animal'}
                </button>
            </form>
            {a && (
                <section className="mt-8">
                    <h2 className="mb-5 text-2xl font-semibold">Fotografías del perfil</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {a.photos.map((p) => (
                            <div className="card space-y-3" key={p.id}>
                                <img
                                    src={'/storage/' + p.file_path}
                                    alt={a.name}
                                    className="h-40 w-full rounded-xl object-cover"
                                />
                                <button
                                    className="btn-secondary w-full"
                                    disabled={p.is_primary}
                                    onClick={() =>
                                        router.patch(`/admin/animales/${a.id}/fotos/${p.id}`)
                                    }
                                >
                                    {p.is_primary ? 'Imagen principal' : 'Usar como principal'}
                                </button>
                                <Confirm
                                    label="Eliminar foto"
                                    title="Eliminar fotografía"
                                    onConfirm={() =>
                                        router.delete(`/admin/animales/${a.id}/fotos/${p.id}`)
                                    }
                                >
                                    Esta fotografía se eliminará del almacenamiento.
                                </Confirm>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </Shell>
    );
}
