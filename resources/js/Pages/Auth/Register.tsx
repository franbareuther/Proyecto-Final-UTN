import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function Register() {
    const f = useForm({
        name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    return (
        <Shell>
            <Head title="Crear cuenta" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Tu próxima historia empieza acá."
                    text="Creá tu cuenta para solicitar una adopción."
                />
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/register', {
                            onFinish: () => f.reset('password', 'password_confirmation'),
                        });
                    }}
                >
                    <Errors errors={f.errors} />
                    {(
                        [
                            ['name', 'Nombre', 'text', 'given-name'],
                            ['last_name', 'Apellido', 'text', 'family-name'],
                            ['email', 'Correo electrónico', 'email', 'email'],
                            ['password', 'Contraseña', 'password', 'new-password'],
                            [
                                'password_confirmation',
                                'Confirmar contraseña',
                                'password',
                                'new-password',
                            ],
                        ] as const
                    ).map(([k, l, t, ac]) => (
                        <Field label={l} key={k} error={f.errors[k]}>
                            <input
                                type={t}
                                autoComplete={ac}
                                required
                                value={f.data[k]}
                                onChange={(e) => f.setData(k, e.target.value)}
                            />
                        </Field>
                    ))}
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Creando cuenta…' : 'Crear cuenta'}
                    </button>
                    <p className="text-center text-sm text-stone-500">
                        ¿Ya tenés cuenta?{' '}
                        <Link className="text-emerald-800 underline" href="/login">
                            Ingresá
                        </Link>
                    </p>
                </form>
            </div>
        </Shell>
    );
}
