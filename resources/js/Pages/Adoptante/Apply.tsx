import { Head, useForm, usePage } from '@inertiajs/react';
import { Animal, Shared } from '@/types/shelter';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function Apply({ animal }: { animal: Animal }) {
    const { auth } = usePage<Shared>().props;
    const f = useForm({
        phone: '',
        address: '',
        housing_type: 'Casa',
        has_other_pets: false,
        previous_experience: '',
        motivation: '',
        additional_information: '',
    });
    return (
        <Shell>
            <Head title={'Adoptar a ' + animal.name} />
            <div className="mx-auto max-w-3xl">
                <Title
                    title={`Una nueva historia con ${animal.name}`}
                    text="Completá la solicitud con información sincera. El refugio la evaluará y podrás seguir su estado."
                />
                <div className="card mb-6 flex items-center gap-5">
                    <img
                        src={animal.photo_url}
                        alt={animal.name}
                        className="h-20 w-20 rounded-2xl object-cover"
                    />
                    <div>
                        <h2 className="font-semibold">{animal.name}</h2>
                        {animal.shelter && (
                            <p className="text-sm text-emerald-800">{animal.shelter.name}</p>
                        )}
                        <p className="text-sm text-stone-500">
                            Solicitud de {auth.user?.name} {auth.user?.last_name} ·{' '}
                            {auth.user?.email}
                        </p>
                    </div>
                </div>
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/animales/' + animal.id + '/solicitar');
                    }}
                >
                    <Errors errors={f.errors} />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Teléfono" error={f.errors.phone}>
                            <input
                                type="tel"
                                autoComplete="tel"
                                required
                                value={f.data.phone}
                                onChange={(e) => f.setData('phone', e.target.value)}
                            />
                        </Field>
                        <Field label="Domicilio" error={f.errors.address}>
                            <input
                                autoComplete="street-address"
                                required
                                value={f.data.address}
                                onChange={(e) => f.setData('address', e.target.value)}
                            />
                        </Field>
                        <Field label="Tipo de vivienda">
                            <select
                                value={f.data.housing_type}
                                onChange={(e) => f.setData('housing_type', e.target.value)}
                            >
                                {['Casa', 'Departamento', 'Otro'].map((x) => (
                                    <option key={x}>{x}</option>
                                ))}
                            </select>
                        </Field>
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={f.data.has_other_pets}
                                onChange={(e) => f.setData('has_other_pets', e.target.checked)}
                                className="rounded text-emerald-700"
                            />
                            Convivo con otros animales
                        </label>
                    </div>
                    {(
                        [
                            ['previous_experience', 'Tu experiencia con animales'],
                            ['motivation', '¿Por qué querés adoptar? (mínimo 20 caracteres)'],
                            ['additional_information', 'Algo más que quieras contarnos (opcional)'],
                        ] as const
                    ).map(([k, label]) => (
                        <Field key={k} label={label} error={f.errors[k]}>
                            <textarea
                                rows={4}
                                maxLength={3000}
                                required={k !== 'additional_information'}
                                value={f.data[k]}
                                onChange={(e) => f.setData(k, e.target.value)}
                            />
                        </Field>
                    ))}
                    <p className="text-sm text-stone-500">
                        Usamos tus datos para evaluar esta solicitud. La aprobación se confirma
                        antes del registro definitivo de adopción.
                    </p>
                    <button disabled={f.processing} className="btn">
                        {f.processing ? 'Enviando…' : 'Enviar solicitud'}
                    </button>
                </form>
            </div>
        </Shell>
    );
}
