import { Head, useForm, usePage } from '@inertiajs/react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
import { Shared } from '@/types/shelter';
export default function ConfirmPassword() {
    const f = useForm({ password: '' });
    const user = usePage<Shared>().props.auth.user;
    return (
        <Shell internal={!!user && user.role !== 'adoptante'}>
            <Head title="Confirmar contraseña" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Confirmá tu contraseña"
                    text="Para continuar con esta acción, necesitamos confirmar tu identidad."
                />
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/confirm-password', { onFinish: () => f.reset('password') });
                    }}
                >
                    <Errors errors={f.errors} />
                    <Field label="Contraseña actual" error={f.errors.password}>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={f.data.password}
                            onChange={(e) => f.setData('password', e.target.value)}
                        />
                    </Field>
                    <button className="btn" disabled={f.processing}>
                        {f.processing ? 'Confirmando…' : 'Confirmar contraseña'}
                    </button>
                </form>
            </div>
        </Shell>
    );
}
