import { useForm } from '@inertiajs/react';
import { Errors, Field } from '@/Components/Shelter';
import { Refuge } from '@/types/shelter';
import { useEffect, useRef, useState } from 'react';
import ShelterImage from '@/Components/ShelterImage';

export default function ShelterForm({
    shelter,
    admin = false,
    compact = false,
}: {
    shelter?: Refuge;
    admin?: boolean;
    compact?: boolean;
}) {
    const f = useForm({
        name: shelter?.name || '',
        slug: shelter?.slug || '',
        description: shelter?.description || '',
        city: shelter?.city || '',
        address: shelter?.address || '',
        email: shelter?.email || '',
        phone: shelter?.phone || '',
        website: shelter?.website || '',
        instagram: shelter?.instagram || '',
        facebook: shelter?.facebook || '',
        active: shelter?.active ?? true,
        image: null as File | null,
        image_type: shelter?.image_type || 'photo',
        remove_image: false,
        _method: shelter ? 'patch' : 'post',
    });
    const fileInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        const file = f.data.image;
        if (
            !file ||
            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
            file.size > 5 * 1024 * 1024
        ) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [f.data.image]);
    const fields: [keyof typeof f.data, string][] = [
        ['name', 'Nombre'],
        ['city', 'Ciudad'],
        ['address', 'Dirección pública'],
        ['email', 'Correo de contacto'],
        ['phone', 'Teléfono'],
        ['website', 'Sitio web (opcional)'],
        ['instagram', 'Instagram (opcional)'],
        ['facebook', 'Facebook (opcional)'],
    ];
    const urlFields = ['website', 'instagram', 'facebook'];
    return (
        <form
            className={compact ? 'compact-shelter-form space-y-4' : 'space-y-5'}
            onSubmit={(e) => {
                e.preventDefault();
                const options = {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        if (!shelter) f.reset();
                        else f.setData((data) => ({ ...data, image: null, remove_image: false }));
                        if (fileInput.current) fileInput.current.value = '';
                    },
                };
                if (admin) f.post('/admin/refugio', options);
                else if (shelter) f.post(`/superadmin/refugios/${shelter.slug}`, options);
                else f.post('/superadmin/refugios', options);
            }}
        >
            <Errors errors={f.errors} />
            <div className={'grid sm:grid-cols-2 ' + (compact ? 'gap-x-4 gap-y-3' : 'gap-5')}>
                {fields.map(([key, label]) => (
                    <Field key={key} label={label} error={f.errors[key]}>
                        <input
                            className="input"
                            required={key === 'name'}
                            type={key === 'email' ? 'email' : urlFields.includes(key) ? 'url' : 'text'}
                            placeholder={urlFields.includes(key) ? 'https://' : undefined}
                            value={String(f.data[key])}
                            onChange={(e) => f.setData(key, e.target.value)}
                        />
                    </Field>
                ))}
                {!admin && (
                    <Field
                        label={compact ? 'Dirección web' : 'Identificador en la dirección web'}
                        error={f.errors.slug}
                    >
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
            </div>
            <details
                className={compact ? 'rounded-lg border border-stone-200' : 'contents'}
                open={
                    !compact ||
                    Boolean(f.errors.description || f.errors.image || f.errors.image_type)
                }
            >
                {compact && (
                    <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-stone-600 hover:text-stone-900">
                        Descripción e imagen{' '}
                        <span className="ml-1 font-normal text-stone-400">(opcional)</span>
                    </summary>
                )}
                <div className={compact ? 'space-y-3 border-t border-stone-200 p-3' : 'space-y-5'}>
                    <Field label="Historia y descripción" error={f.errors.description}>
                        <textarea
                            className="input min-h-32"
                            value={f.data.description}
                            onChange={(e) => f.setData('description', e.target.value)}
                        />
                    </Field>
                    <fieldset
                        className="min-w-0 space-y-4 rounded-xl border border-stone-200 p-4"
                        disabled={f.processing}
                    >
                        <legend className="px-2 font-semibold text-emerald-950">
                            Imagen del refugio (opcional)
                        </legend>
                        <p id="shelter-image-help" className="text-sm text-stone-600">
                            JPEG, PNG o WebP, hasta 5 MB. Para logos con transparencia, usá PNG. No
                            se admite SVG.
                        </p>
                        <Field label="Elegir imagen" error={f.errors.image}>
                            <input
                                ref={fileInput}
                                className="block w-full min-w-0 max-w-full text-sm"
                                type="file"
                                name="image"
                                accept="image/jpeg,image/png,image/webp"
                                aria-describedby="shelter-image-help"
                                onChange={(event) => {
                                    f.clearErrors('image');
                                    const image = event.target.files?.[0] || null;
                                    f.setData((data) => ({
                                        ...data,
                                        image,
                                        remove_image: image ? false : data.remove_image,
                                    }));
                                }}
                            />
                        </Field>
                        <Field label="Presentación" error={f.errors.image_type}>
                            <select
                                name="image_type"
                                value={f.data.image_type}
                                onChange={(event) =>
                                    f.setData('image_type', event.target.value as 'photo' | 'logo')
                                }
                            >
                                <option value="photo">Fotografía · llenar el marco</option>
                                <option value="logo">Logo · mostrar completo</option>
                            </select>
                        </Field>
                        <div
                            className={compact ? 'max-w-48' : 'max-w-md'}
                            hidden={compact && !preview && !shelter?.image_url}
                        >
                            <ShelterImage
                                src={f.data.remove_image ? null : preview || shelter?.image_url}
                                name={f.data.name || 'tu refugio'}
                                kind={f.data.image_type as 'photo' | 'logo'}
                            />
                        </div>
                        <p className="break-words text-sm text-stone-600" role="status">
                            {f.data.remove_image
                                ? 'La imagen se quitará al guardar.'
                                : f.data.image
                                  ? `Archivo seleccionado: ${f.data.image.name}. Los cambios se publican al guardar.`
                                  : shelter?.image_url
                                    ? 'Imagen actual. Podés reemplazarla o quitarla.'
                                    : 'Sin imagen. El nombre y los datos del refugio seguirán visibles.'}
                        </p>
                        {f.data.image && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    f.setData('image', null);
                                    f.clearErrors('image');
                                    if (fileInput.current) fileInput.current.value = '';
                                }}
                            >
                                Descartar archivo seleccionado
                            </button>
                        )}
                        {shelter?.image_url && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    f.setData((data) => ({
                                        ...data,
                                        image: null,
                                        remove_image: !data.remove_image,
                                    }));
                                    f.clearErrors('image');
                                    if (fileInput.current) fileInput.current.value = '';
                                }}
                            >
                                {f.data.remove_image
                                    ? 'Conservar imagen actual'
                                    : 'Quitar imagen al guardar'}
                            </button>
                        )}
                    </fieldset>
                </div>
            </details>
            <div
                className={
                    compact
                        ? 'sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white py-3'
                        : 'space-y-5'
                }
            >
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
                    <p className="text-xs text-stone-500">
                        Al desactivarlo, se oculta el catálogo y se bloquean nuevas operaciones del
                        personal. Las solicitudes e historias se conservan.
                    </p>
                )}
                <button className="btn" disabled={f.processing}>
                    {f.processing ? 'Guardando…' : shelter ? 'Guardar cambios' : 'Crear refugio'}
                </button>
            </div>
        </form>
    );
}
