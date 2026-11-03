import { Head, useForm } from '@inertiajs/react';
import { Errors, Field, Shell } from '@/Components/Shelter';
import AuthLayout from '@/Components/AuthLayout';

export default function ConfirmPassword() {
    const f = useForm({ password: '' });
    return (
        <Shell>
            <Head title="Confirmar contraseña" />
            <AuthLayout
                title="Confirmá tu contraseña."
                text="Esta sección está protegida. Por seguridad, ingresá tu contraseña para continuar."
            >
                <form
                    className="card space-y-5 sm:p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/confirm-password', { onFinish: () => f.reset('password') });
                    }}
                >
                    <Errors errors={f.errors} />
                    <Field label="Contraseña" error={f.errors.password}>
                        <input
                            type="password"
                            autoComplete="current-password"
                            required
                            autoFocus
                            value={f.data.password}
                            onChange={(e) => f.setData('password', e.target.value)}
                        />
                    </Field>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Confirmando…' : 'Confirmar'}
                    </button>
                </form>
            </AuthLayout>
        </Shell>
    );
}
