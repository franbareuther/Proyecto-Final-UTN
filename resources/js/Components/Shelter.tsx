import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { Animal, Application, Page, Shared } from '@/types/shelter';
import Modal from '@/Components/Modal';

export const date = (value: string) =>
    new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR');
export function Badge({ children }: PropsWithChildren) {
    return (
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {children}
        </span>
    );
}
export function Title({
    title,
    text,
    children,
}: PropsWithChildren<{ title: string; text?: string }>) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="eyebrow">HUELLA / REFUGIO Y ADOPCIONES</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                {text && <p className="mt-3 text-stone-500">{text}</p>}
            </div>
            {children}
        </div>
    );
}
export function Empty({ children }: PropsWithChildren) {
    return (
        <div className="card py-14 text-center text-stone-500">
            {children || 'Todavía no hay registros para mostrar.'}
        </div>
    );
}
export function Errors({ errors }: { errors: Record<string, string> }) {
    return Object.keys(errors).length ? (
        <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            {Object.entries(errors).map(([k, v]) => (
                <p key={k}>{v}</p>
            ))}
        </div>
    ) : null;
}
export function Pagination({ page }: { page: Page<unknown> }) {
    return (
        <nav aria-label="Paginación" className="mt-7 flex flex-wrap gap-2">
            {page.links.map((l, i) =>
                l.url ? (
                    <Link
                        key={i}
                        href={l.url}
                        className={
                            'rounded-lg border px-3 py-2 text-sm ' +
                            (l.active ? 'bg-emerald-800 text-white' : 'bg-white')
                        }
                        aria-current={l.active ? 'page' : undefined}
                    >
                        {l.label
                            .replace('&laquo;', '←')
                            .replace('&raquo;', '→')
                            .replace('Previous', 'Anterior')
                            .replace('Next', 'Siguiente')}
                    </Link>
                ) : (
                    <span key={i} className="px-3 py-2 text-sm text-stone-400">
                        {l.label
                            .replace('&laquo;', '←')
                            .replace('&raquo;', '→')
                            .replace('Previous', 'Anterior')
                            .replace('Next', 'Siguiente')}
                    </span>
                ),
            )}
        </nav>
    );
}
export function Field({
    label,
    error,
    children,
}: PropsWithChildren<{ label: string; error?: string }>) {
    return (
        <label className="block text-sm font-medium text-stone-700">
            <span className="mb-2 block">{label}</span>
            {children}
            {error && <span className="mt-1 block text-red-700">{error}</span>}
        </label>
    );
}
export function Confirm({
    title,
    children,
    onConfirm,
    busy = false,
    label = 'Confirmar',
}: PropsWithChildren<{ title: string; onConfirm: () => void; busy?: boolean; label?: string }>) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
                {label}
            </button>
            <Modal show={open} onClose={() => setOpen(false)}>
                <div className="p-7">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <div className="my-5 text-stone-600">{children}</div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn"
                            disabled={busy}
                            onClick={() => {
                                onConfirm();
                                setOpen(false);
                            }}
                        >
                            Confirmar
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
export function AnimalCard({ animal }: { animal: Animal }) {
    return (
        <Link
            href={'/animales/' + animal.id}
            className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="relative">
                <img
                    src={animal.photo_url}
                    alt={animal.name}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                />
                <span className="absolute bottom-4 left-4">
                    <Badge>{animal.availability_status}</Badge>
                </span>
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">{animal.name}</h3>
                    <span aria-hidden="true" className="text-2xl text-emerald-700">
                        ↗
                    </span>
                </div>
                <p className="mt-2 text-sm text-stone-500">
                    {animal.species} · {animal.breed || 'Raza sin especificar'}
                </p>
                <p className="mt-4 text-sm">
                    {animal.sex} · {animal.size} ·{' '}
                    {animal.estimated_age !== null
                        ? `${animal.estimated_age} meses aprox.`
                        : animal.birth_date
                          ? `Nació el ${date(animal.birth_date)}`
                          : 'Edad a confirmar'}
                </p>
            </div>
        </Link>
    );
}
export function RequestList({
    requests,
    admin = false,
}: {
    requests: Application[];
    admin?: boolean;
}) {
    return requests.length ? (
        <div className="card divide-y divide-stone-100 p-0">
            {requests.map((r) => (
                <Link
                    className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-stone-50"
                    key={r.id}
                    href={'/solicitudes/' + r.id}
                >
                    <img
                        alt=""
                        src={r.animal.photo_url}
                        className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-40 flex-1">
                        <p className="font-semibold">{r.animal.name}</p>
                        <p className="text-sm text-stone-500">
                            {admin ? `${r.user.name} ${r.user.last_name} · ` : ''}
                            {date(r.created_at)}
                        </p>
                    </div>
                    <Badge>{r.status}</Badge>
                    <span aria-hidden="true">→</span>
                </Link>
            ))}
        </div>
    ) : (
        <Empty>No hay solicitudes con estos criterios.</Empty>
    );
}
export function Shell({ children, internal = false }: PropsWithChildren<{ internal?: boolean }>) {
    const { auth, flash, shelterName } = usePage<Shared>().props;
    const [open, setOpen] = useState(false);
    const admin = auth.user?.role === 'admin';
    const staff = admin || auth.user?.role === 'veterinario';
    const nav = (
        <>
            {internal && admin && (
                <>
                    <Link href="/admin">Resumen</Link>
                    <Link href="/admin/animales">Animales</Link>
                    <Link href="/admin/solicitudes">Solicitudes</Link>
                    <Link href="/admin/adopciones">Adopciones</Link>
                </>
            )}
            {internal && staff && (
                <>
                    <Link href="/veterinaria">Veterinaria</Link>
                    <Link href="/veterinaria/controles">Próximos controles</Link>
                </>
            )}
            {!internal && (
                <>
                    <Link href="/animales">Encontrá tu compañero</Link>
                    <Link href="/#como-funciona">Cómo adoptar</Link>
                    <Link href="/#nosotros">El refugio</Link>
                </>
            )}
            {auth.user ? (
                <>
                    <Link href="/dashboard">{staff ? 'Mi panel' : 'Mis solicitudes'}</Link>
                    <Link href="/profile">Mi perfil</Link>
                    <Link as="button" href="/logout" method="post">
                        Salir
                    </Link>
                </>
            ) : (
                <>
                    <Link href="/login">Ingresar</Link>
                    <Link className="btn" href="/register">
                        Crear cuenta
                    </Link>
                </>
            )}
        </>
    );
    return (
        <div className="min-h-screen">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
                    <Link
                        href="/"
                        aria-label={shelterName}
                        className="text-2xl font-bold tracking-tight text-emerald-900"
                    >
                        ✤ huella
                        <span className="ml-2 hidden text-xs font-normal tracking-widest text-stone-400 sm:inline">
                            REFUGIO
                        </span>
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm lg:flex">
                        {!internal && nav}
                        {internal && <Link href="/animales">Ver sitio público ↗</Link>}
                    </nav>
                    <button
                        className="btn-secondary lg:hidden"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                    >
                        Menú
                    </button>
                </div>
                {open && (
                    <nav className="flex flex-col gap-4 border-t px-6 py-5 text-sm lg:hidden">
                        {nav}
                    </nav>
                )}
            </header>
            <div className={internal ? 'mx-auto flex max-w-screen-2xl' : ''}>
                {internal && (
                    <aside className="hidden min-h-[85vh] w-60 shrink-0 border-r border-stone-200 bg-white p-6 lg:block">
                        <p className="eyebrow mb-7">ESPACIO DEL REFUGIO</p>
                        <nav className="flex flex-col gap-5 text-sm">{nav}</nav>
                    </aside>
                )}
                <main
                    id="main"
                    className={
                        'mx-auto w-full max-w-7xl px-5 py-10 md:px-8 ' +
                        (internal ? 'min-w-0 lg:p-10' : '')
                    }
                >
                    {flash.success && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                        >
                            {flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <footer className="border-t border-stone-200 px-6 py-10">
                <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-sm text-stone-500">
                    <p>✤ {shelterName} · Cada adopción deja una huella.</p>
                    <Link href="/animales">Adopción responsable →</Link>
                    <p>Proyecto académico · UTN</p>
                </div>
            </footer>
        </div>
    );
}
