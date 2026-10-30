import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
import ShelterImage from '@/Components/ShelterImage';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
type Key =
    | 'shelter_name'
    | 'city'
    | 'address'
    | 'phone'
    | 'description'
    | 'name'
    | 'last_name'
    | 'email'
    | 'password'
    | 'password_confirmation'
    | 'website'
    | 'instagram'
    | 'facebook';
type Input = [Key, string, string, string?, string?];

const shelterFields: Input[] = [
    ['shelter_name', 'Nombre del refugio', 'text', 'organization'],
    ['city', 'Localidad', 'text', 'address-level2'],
    ['address', 'Dirección (opcional)', 'text', 'street-address'],
    ['phone', 'Teléfono de contacto', 'tel', 'tel'],
];
const accountFields: Input[] = [
    ['name', 'Nombre', 'text', 'given-name'],
    ['last_name', 'Apellido', 'text', 'family-name'],
    [
        'email',
        'Correo electrónico',
        'email',
        'email',
        'También será el correo de contacto del refugio.',
    ],
    ['password', 'Contraseña', 'password', 'new-password', 'Usá al menos 8 caracteres.'],
    ['password_confirmation', 'Confirmar contraseña', 'password', 'new-password'],
];
const socialFields: Input[] = [
    ['website', 'Sitio web', 'url', 'url', 'https://mirefugio.org'],
    ['instagram', 'Instagram', 'url', 'off', 'https://instagram.com/mirefugio'],
    ['facebook', 'Facebook', 'url', 'off', 'https://facebook.com/mirefugio'],
];
const optional: Key[] = ['address', 'website', 'instagram', 'facebook'];

export default function RegisterShelter() {
    const f = useForm({
        shelter_name: '',
        city: '',
        address: '',
        phone: '',
        description: '',
        name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        website: '',
        instagram: '',
        facebook: '',
        image: null as File | null,
        image_type: 'photo' as 'photo' | 'logo',
    });
    const fileInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        const file = f.data.image;
        if (!file || !imageTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [f.data.image]);

    const showErrors = () =>
        document.getElementById('shelter-registration-errors')?.scrollIntoView({ block: 'center' });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Validación inmediata en el navegador; el servidor vuelve a validar todo.
        const errors: Partial<Record<keyof typeof f.data, string>> = {};
        if (f.data.password !== f.data.password_confirmation)
            errors.password = 'Las contraseñas no coinciden.';
        if (f.data.description.trim().length < 20)
            errors.description = 'La descripción debe tener al menos 20 caracteres.';
        const image = f.data.image;
        if (image && !imageTypes.includes(image.type))
            errors.image = 'Solo se admiten imágenes JPEG, PNG y WebP; no SVG.';
        else if (image && image.size > 5 * 1024 * 1024)
            errors.image = 'La imagen no puede superar los 5 MB.';
        f.clearErrors();
        if (Object.keys(errors).length) {
            f.setError(errors);
            setTimeout(showErrors);
            return;
        }
        f.post('/registro-refugio', {
            forceFormData: true,
            onSuccess: () => f.reset('password', 'password_confirmation'),
            onError: showErrors,
        });
    };
    const input = ([key, label, type, autoComplete, hint]: Input) => (
        <Field key={key} label={label} error={f.errors[key]}>
            <input
                type={type}
                name={key}
                autoComplete={autoComplete}
                required={!optional.includes(key)}
                minLength={type === 'password' ? 8 : undefined}
                maxLength={key === 'shelter_name' || key === 'city' ? 100 : 255}
                placeholder={type === 'url' ? hint : undefined}
                aria-describedby={hint && type !== 'url' ? `${key}-hint` : undefined}
                value={f.data[key]}
                onChange={(e) => f.setData(key, e.target.value)}
            />
            {hint && type !== 'url' && (
                <p id={`${key}-hint`} className="mt-2 text-xs font-normal text-stone-500">
                    {hint}
                </p>
            )}
        </Field>
    );

    return (
        <Shell>
            <Head title="Registrar mi refugio" />
            <div className="mx-auto w-full max-w-6xl">
                <Title
                    title="Sumá tu refugio a Huellita."
                    text="Creá el espacio de tu refugio para presentar a sus animales, recibir solicitudes de adopción y llevar sus cuidados al día. Cada refugio ve y gestiona solo su propia información."
                />
                <form className="space-y-6" onSubmit={submit}>
                    <div id="shelter-registration-errors" aria-live="polite">
                        <Errors errors={f.errors} />
                    </div>
                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <fieldset className="card min-w-0 space-y-5 sm:p-8" disabled={f.processing}>
                            <legend className="sr-only">Datos del refugio</legend>
                            <h2 className="text-xl font-semibold text-emerald-950">Tu refugio</h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {shelterFields.map(input)}
                            </div>
                            <Field label="Descripción del refugio" error={f.errors.description}>
                                <textarea
                                    name="description"
                                    required
                                    minLength={20}
                                    maxLength={5000}
                                    rows={5}
                                    aria-describedby="description-hint"
                                    value={f.data.description}
                                    onChange={(e) => f.setData('description', e.target.value)}
                                />
                                <p
                                    id="description-hint"
                                    className="mt-2 text-xs font-normal text-stone-500"
                                >
                                    Contá su historia, cómo trabajan y qué animales acompañan. Las
                                    familias lo verán en su perfil público.
                                </p>
                            </Field>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="Logo o fotografía (opcional)" error={f.errors.image}>
                                    <input
                                        ref={fileInput}
                                        className="block w-full min-w-0 max-w-full text-sm"
                                        type="file"
                                        name="image"
                                        accept="image/jpeg,image/png,image/webp"
                                        aria-describedby="image-hint"
                                        onChange={(e) => {
                                            f.clearErrors('image');
                                            f.setData('image', e.target.files?.[0] || null);
                                        }}
                                    />
                                    <p
                                        id="image-hint"
                                        className="mt-2 text-xs font-normal text-stone-500"
                                    >
                                        JPEG, PNG o WebP, hasta 5 MB.
                                    </p>
                                </Field>
                                <Field
                                    label="Presentación de la imagen"
                                    error={f.errors.image_type}
                                >
                                    <select
                                        name="image_type"
                                        value={f.data.image_type}
                                        onChange={(e) =>
                                            f.setData(
                                                'image_type',
                                                e.target.value as 'photo' | 'logo',
                                            )
                                        }
                                    >
                                        <option value="photo">Fotografía · llenar el marco</option>
                                        <option value="logo">Logo · mostrar completo</option>
                                    </select>
                                </Field>
                            </div>
                            {preview && (
                                <div className="max-w-sm">
                                    <ShelterImage
                                        src={preview}
                                        name={f.data.shelter_name || 'tu refugio'}
                                        kind={f.data.image_type}
                                    />
                                    <button
                                        type="button"
                                        className="btn-secondary mt-3"
                                        onClick={() => {
                                            f.setData('image', null);
                                            if (fileInput.current) fileInput.current.value = '';
                                        }}
                                    >
                                        Quitar imagen
                                    </button>
                                </div>
                            )}
                        </fieldset>
                        <div className="min-w-0 space-y-6">
                            <fieldset
                                className="card min-w-0 space-y-5 sm:p-8"
                                disabled={f.processing}
                            >
                                <legend className="sr-only">Persona responsable</legend>
                                <div>
                                    <h2 className="text-xl font-semibold text-emerald-950">
                                        Persona responsable
                                    </h2>
                                    <p className="mt-1 text-sm text-stone-600">
                                        Con estos datos vas a ingresar al panel del refugio.
                                    </p>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {accountFields.map(input)}
                                </div>
                            </fieldset>
                            <fieldset
                                className="card min-w-0 space-y-5 sm:p-8"
                                disabled={f.processing}
                            >
                                <legend className="sr-only">Redes sociales</legend>
                                <div>
                                    <h2 className="text-xl font-semibold text-emerald-950">
                                        Redes y sitio web{' '}
                                        <span className="text-sm font-normal text-stone-500">
                                            (opcional)
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-sm text-stone-600">
                                        Pegá el enlace completo de cada perfil.
                                    </p>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                                    {socialFields.map(input)}
                                </div>
                            </fieldset>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <button className="btn w-full sm:w-auto" disabled={f.processing}>
                            {f.processing ? 'Registrando refugio…' : 'Registrar mi refugio'}
                        </button>
                        <p className="text-sm text-stone-600">
                            ¿Ya tenés cuenta?{' '}
                            <Link className="text-emerald-800 underline" href="/login">
                                Ingresá
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </Shell>
    );
}
