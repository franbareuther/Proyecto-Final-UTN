import { Head, router, useForm } from '@inertiajs/react';
import { Animal } from '@/types/shelter';
import { Confirm, Errors, Field, Shell, Title } from '@/Components/Shelter';
import { useRef, useState } from 'react';
import AnimalImage from '@/Components/AnimalImage';
export default function AnimalForm({ animal: a }: { animal?: Animal }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const submitting = useRef(false);
    const photoPending = useRef(false);
    const [photoBusy, setPhotoBusy] = useState(false);
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
    const changePhoto = (id: number, remove = false) => {
        if (!a || photoPending.current || submitting.current) return;
        photoPending.current = true;
        setPhotoBusy(true);
        const options = {
            preserveScroll: true,
            onFinish: () => {
                photoPending.current = false;
                setPhotoBusy(false);
            },
        };
        if (remove) router.delete(`/admin/animales/${a.id}/fotos/${id}`, options);
        else router.patch(`/admin/animales/${a.id}/fotos/${id}`, {}, options);
    };
    const photoError =
        Object.entries(f.errors)
            .filter(([key]) => key === 'photos' || key.startsWith('photos.'))
            .map(([, error]) => error)
            .join(' ') || undefined;
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
                    if (photoPending.current || submitting.current) return;
                    submitting.current = true;
                    f.post(a ? '/admin/animales/' + a.id : '/admin/animales', {
                        forceFormData: true,
                        onFinish: () => {
                            submitting.current = false;
                        },
                        onSuccess: () => {
                            f.setData('photos', []);
                            if (fileInput.current) fileInput.current.value = '';
                        },
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
                        <Field key={k} label={l} error={f.errors[k]}>
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
                    <Field key={k} label={l} error={f.errors[k]}>
                        <textarea
                            rows={4}
                            required={k === 'description'}
                            value={f.data[k]}
                            onChange={(e) => f.setData(k, e.target.value)}
                        />
                    </Field>
                ))}
                <Field
                    label="Fotografías (JPG, PNG o WebP, hasta 8 por envío, 4 MB cada una)"
                    error={photoError}
                >
                    <input
                        ref={fileInput}
                        name="photos[]"
                        className="block w-full min-w-0 max-w-full"
                        disabled={f.processing || photoBusy}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => f.setData('photos', Array.from(e.target.files || []))}
                    />
                </Field>
                {f.data.photos.length > 0 && (
                    <div role="status" className="text-sm text-stone-700">
                        <p>{f.data.photos.length} fotografías pendientes de guardar.</p>
                        <ul
                            aria-label="Archivos seleccionados"
                            className="mt-2 list-inside list-disc"
                        >
                            {f.data.photos.map((photo, index) => (
                                <li className="break-words" key={index}>
                                    {photo.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {f.progress && (
                    <progress
                        aria-label="Carga de fotografías"
                        className="w-full"
                        value={f.progress.percentage}
                        max={100}
                    />
                )}
                <button className="btn" disabled={f.processing || photoBusy}>
                    {f.processing ? 'Guardando…' : 'Guardar animal'}
                </button>
            </form>
            {a && (
                <section className="mt-8">
                    <h2 className="mb-5 text-2xl font-semibold">Fotografías del perfil</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {a.photos.map((p) => (
                            <div className="card space-y-3" key={p.id}>
                                <AnimalImage
                                    src={'/storage/' + p.file_path}
                                    alt={a.name}
                                    className="h-40 w-full rounded-xl object-cover"
                                />
                                <button
                                    className="btn-secondary w-full"
                                    disabled={p.is_primary || f.processing || photoBusy}
                                    onClick={() => changePhoto(p.id)}
                                >
                                    {p.is_primary ? 'Imagen principal' : 'Usar como principal'}
                                </button>
                                <Confirm
                                    label="Eliminar foto"
                                    title="Eliminar fotografía"
                                    busy={f.processing || photoBusy}
                                    onConfirm={() => changePhoto(p.id, true)}
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
