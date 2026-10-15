import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function ForgotPassword({ status }: { status?: string }) {
    const f = useForm({ email: '' });
    return (
        <Shell>
            <Head title="Recuperar contraseña" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Recuperá tu acceso"
                    text="Ingresá el correo de tu cuenta. Te enviaremos un enlace para elegir una nueva contraseña."
                />
                {status && (
                    <p role="status" className="mb-5 text-sm text-emerald-900">
                        {status}
                    </p>
                )}
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/forgot-password');
                    }}
                >
                    <Errors errors={f.errors} />
                    <Field label="Correo electrónico" error={f.errors.email}>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={f.data.email}
                            onChange={(e) => f.setData('email', e.target.value)}
                        />
                    </Field>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Enviando…' : 'Solicitar enlace de recuperación'}
                    </button>
                    <Link href="/login" className="text-link">
                        Volver a ingresar
                    </Link>
                </form>
            </div>
        </Shell>
    );
}
