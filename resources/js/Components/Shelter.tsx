import { Link, router, usePage } from '@inertiajs/react';
import {
    Children,
    cloneElement,
    isValidElement,
    PropsWithChildren,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { DialogTitle } from '@headlessui/react';
import { Animal, Application, Page, Shared } from '@/types/shelter';
import Modal from '@/Components/Modal';
import AnimalImage from '@/Components/AnimalImage';
import Icon from '@/Components/Icon';

export const date = (value: string) =>
    new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR');

const badgeStyles: Record<string, string> = {
    Disponible: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    'En proceso de adopción': 'border-amber-200 bg-amber-50 text-amber-950',
    Adoptado: 'border-sky-200 bg-sky-50 text-sky-950',
    'No disponible temporalmente': 'border-stone-300 bg-stone-100 text-stone-700',
    Nueva: 'border-sky-200 bg-sky-50 text-sky-950',
    'En revisión': 'border-amber-200 bg-amber-50 text-amber-950',
    Aprobada: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    Rechazada: 'border-rose-200 bg-rose-50 text-rose-900',
    Vencido: 'border-rose-200 bg-rose-50 text-rose-900',
    Próximo: 'border-amber-200 bg-amber-50 text-amber-950',
};
export function Badge({ children }: PropsWithChildren) {
    const style = typeof children === 'string' ? badgeStyles[children] : undefined;
    return (
        <span
            className={
                'inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold leading-relaxed ' +
                (style || 'border-stone-200 bg-stone-50 text-stone-700')
            }
        >
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
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
        <div className="mb-8 flex min-w-0 flex-wrap items-end justify-between gap-5 sm:mb-10">
            <div className="min-w-0 max-w-3xl">
                <p className="eyebrow">HUELLA / RED DE REFUGIOS</p>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
                    {title}
                </h1>
                {text && (
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                        {text}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}
export function Empty({ children }: PropsWithChildren) {
    return (
        <div className="card flex flex-col items-center gap-4 py-12 text-center sm:py-16">
            <span className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                <Icon name="paw" className="h-8 w-8" />
            </span>
            <div className="max-w-md leading-relaxed text-stone-600">
                {children || 'Todavía no hay registros para mostrar.'}
            </div>
        </div>
    );
}
export function Errors({ errors }: { errors: Record<string, string> }) {
    return Object.keys(errors).length ? (
        <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-900"
        >
            <p className="mb-1 font-semibold">Revisá los datos para continuar.</p>
            <ul className="list-inside list-disc">
                {Object.entries(errors).map(([k, v]) => (
                    <li key={k}>{v}</li>
                ))}
            </ul>
        </div>
    ) : null;
}
export function Pagination({ page }: { page: Page<unknown> }) {
    if (page.links.filter((link) => link.url || link.active).length <= 1) return null;
    const label = (value: string) =>
        value
            .replace(/&laquo;|«/g, '←')
            .replace(/&raquo;|»/g, '→')
            .replace('Previous', 'Anterior')
            .replace('Next', 'Siguiente');
    return (
        <nav
            aria-label="Páginas de resultados"
            className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200 pt-6"
        >
            {page.links.map((link, index) =>
                link.url ? (
                    <Link
                        key={index}
                        href={link.url}
                        className={
                            'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ' +
                            (link.active
                                ? 'border-emerald-900 bg-emerald-900 text-white'
                                : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-800')
                        }
                        aria-current={link.active ? 'page' : undefined}
                        aria-label={/^\d+$/.test(link.label) ? `Página ${link.label}` : undefined}
                    >
                        {label(link.label)}
                    </Link>
                ) : (
                    <span
                        key={index}
                        aria-disabled="true"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-stone-200 px-3 text-sm text-stone-500"
                    >
                        {label(link.label)}
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
    const generatedId = useId();
    type Control = {
        id?: string;
        'aria-describedby'?: string;
        'aria-invalid'?: boolean | 'true' | 'false';
    };
    const control = Children.toArray(children).find(
        (child) =>
            isValidElement<Control>(child) &&
            typeof child.type === 'string' &&
            ['input', 'select', 'textarea'].includes(child.type),
    );
    const id = isValidElement<Control>(control) ? control.props.id || generatedId : generatedId;
    return (
        <div className="min-w-0 text-sm font-medium text-stone-700">
            <label htmlFor={id} className="mb-2 block">
                {label}
            </label>
            {Children.map(children, (child) =>
                isValidElement<Control>(child) &&
                typeof child.type === 'string' &&
                ['input', 'select', 'textarea'].includes(child.type)
                    ? cloneElement(child, {
                          id,
                          'aria-invalid': error ? true : child.props['aria-invalid'],
                          'aria-describedby':
                              [child.props['aria-describedby'], error ? `${id}-error` : null]
                                  .filter(Boolean)
                                  .join(' ') || undefined,
                      })
                    : child,
            )}
            {error && (
                <p id={`${id}-error`} className="mt-2 text-sm leading-relaxed text-red-800">
                    {error}
                </p>
            )}
        </div>
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
            <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => setOpen(true)}
            >
                {label}
            </button>
            <Modal show={open} closeable={!busy} onClose={() => setOpen(false)}>
                <div className="p-6 sm:p-8">
                    <DialogTitle as="h2" className="text-xl font-semibold text-emerald-950">
                        {title}
                    </DialogTitle>
                    <div className="my-5 break-words leading-relaxed text-stone-600">
                        {children}
                    </div>
                    <div className="flex flex-wrap gap-3">
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
            href={
                animal.shelter
                    ? `/refugios/${animal.shelter.slug}/animales/${animal.id}`
                    : '/animales/' + animal.id
            }
            className="animal-card group"
            aria-label={`Conocer a ${animal.name}, ${animal.availability_status.toLowerCase()}`}
        >
            <div className="relative overflow-hidden">
                <AnimalImage
                    src={animal.photo_url}
                    alt={animal.name}
                    className="animal-card-photo"
                />
                <div className="absolute left-3 top-3 right-3">
                    <Badge>{animal.availability_status}</Badge>
                </div>
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
                {animal.shelter && (
                    <p className="mb-3 text-xs font-semibold text-emerald-800">
                        {animal.shelter.name}
                    </p>
                )}
                <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-emerald-950">
                        {animal.name}
                    </h3>
                    <span className="rounded-full bg-[#f3f4ec] p-2 text-emerald-900 transition group-hover:bg-emerald-900 group-hover:text-white">
                        <Icon name="arrow" className="h-5 w-5" />
                    </span>
                </div>
                <p className="mt-2 break-words text-sm text-stone-600">
                    {animal.species} · {animal.breed || 'Raza sin especificar'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
                    <span className="rounded-md bg-stone-100 px-2.5 py-1.5">{animal.sex}</span>
                    <span className="rounded-md bg-stone-100 px-2.5 py-1.5">{animal.size}</span>
                </div>
                <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
                    {animal.birth_date
                        ? `Nació el ${date(animal.birth_date)}`
                        : animal.estimated_age !== null
                          ? `${animal.estimated_age} meses aprox.`
                          : 'Edad a confirmar con el refugio'}
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
                    <AnimalImage
                        alt=""
                        src={r.animal.photo_url}
                        className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1 basis-40">
                        <p className="break-words font-semibold">{r.animal.name}</p>
                        {r.animal.shelter && (
                            <p className="text-sm text-emerald-800">{r.animal.shelter.name}</p>
                        )}
                        <p className="break-words text-sm text-stone-600">
                            {admin ? `${r.user.name} ${r.user.last_name} · ` : ''}
                            {date(r.created_at)}
                        </p>
                    </div>
                    <Badge>{r.status}</Badge>
                    <Icon name="chevron" className="h-4 w-4" />
                </Link>
            ))}
        </div>
    ) : (
        <Empty>No hay solicitudes con estos criterios.</Empty>
    );
}
export function Shell({ children, internal = false }: PropsWithChildren<{ internal?: boolean }>) {
    const { auth, flash, shelterName, currentShelter } = usePage<Shared>().props;
    const currentPath = usePage().url.split(/[?#]/)[0];
    const [open, setOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const admin = auth.user?.role === 'admin';
    const superadmin = auth.user?.role === 'superadmin';
    const staff = admin;
    const catalogUrl = currentShelter ? `/refugios/${currentShelter.slug}/animales` : '/refugios';
    useEffect(() => router.on('navigate', () => setOpen(false)), []);
    useEffect(() => {
        if (!open) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                menuButton.current?.focus();
            }
        };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [open]);
    const navLink = (href: string, label: string, active = currentPath === href) => (
        <Link
            key={href}
            className="nav-link"
            href={href}
            aria-current={active ? 'page' : undefined}
            onClick={() => setOpen(false)}
        >
            {label}
        </Link>
    );
    const navigation = (
        <>
            {internal && superadmin && navLink('/superadmin/refugios', 'Gestionar refugios')}
            {internal && admin && (
                <>
                    {navLink('/admin', 'Resumen')}
                    {navLink('/admin/refugio', 'Mi refugio')}
                    {navLink(
                        '/admin/animales',
                        'Animales',
                        currentPath.startsWith('/admin/animales'),
                    )}
                    {navLink('/admin/solicitudes', 'Solicitudes')}
                    {navLink('/admin/adopciones', 'Adopciones')}
                </>
            )}
            {internal && staff && (
                <>
                    {navLink(
                        '/veterinaria',
                        'Salud y cuidados',
                        currentPath.startsWith('/veterinaria') &&
                            currentPath !== '/veterinaria/controles',
                    )}
                    {navLink('/veterinaria/controles', 'Próximos controles')}
                </>
            )}
            {!internal && (
                <>
                    {navLink('/animales', 'Animales en adopción', currentPath === '/animales')}
                    {navLink('/refugios', 'Refugios', currentPath === '/refugios')}
                    {currentShelter &&
                        navLink(catalogUrl, 'Adoptar', currentPath.startsWith(catalogUrl))}
                    {navLink('/#como-funciona', 'Cómo funciona', false)}
                    {navLink('/#nosotros', 'Huella', false)}
                </>
            )}
            {auth.user ? (
                <>
                    {!internal &&
                        navLink(
                            '/dashboard',
                            staff || superadmin ? 'Mi panel' : 'Mis solicitudes',
                            currentPath === '/mis-solicitudes',
                        )}
                    {navLink('/profile', 'Mi perfil')}
                    <Link as="button" href="/logout" method="post" className="nav-link text-left">
                        Salir
                    </Link>
                </>
            ) : (
                <>
                    {navLink('/login', 'Ingresar')}
                    <Link className="btn" href="/register" onClick={() => setOpen(false)}>
                        Crear cuenta <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                </>
            )}
        </>
    );
    return (
        <div className={'min-h-screen ' + (internal ? 'internal-shell' : 'public-shell')}>
            <a className="skip-link" href="#main">
                Saltar al contenido
            </a>
            <header className="relative z-20 border-b border-stone-200 bg-white/95">
                <div className="site-gutter flex w-full min-w-0 items-center justify-between gap-4 py-4">
                    <Link
                        href="/"
                        aria-label={`${shelterName} — Inicio`}
                        className="flex shrink-0 items-center gap-3 text-emerald-950"
                    >
                        <span className="rounded-xl bg-emerald-900 p-2.5 text-white">
                            <Icon name="paw" className="h-6 w-6" />
                        </span>
                        <span>
                            <span className="block text-2xl font-bold leading-none tracking-tight">
                                huella<span className="text-huella-clay">.</span>
                            </span>
                            <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em]">
                                Refugio y adopciones
                            </span>
                        </span>
                    </Link>
                    <nav
                        aria-label="Navegación principal"
                        className="hidden items-center gap-1 lg:flex"
                    >
                        {internal ? (
                            <Link href={catalogUrl} className="text-link">
                                Ver sitio público <Icon name="arrow" className="h-4 w-4" />
                            </Link>
                        ) : (
                            navigation
                        )}
                    </nav>
                    <button
                        ref={menuButton}
                        type="button"
                        className="btn-secondary lg:hidden"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-controls={menuId}
                        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                    >
                        <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
                        <span className="hidden min-[360px]:inline">Menú</span>
                    </button>
                </div>
                <nav
                    id={menuId}
                    aria-label="Navegación móvil"
                    className={
                        (open ? 'flex' : 'hidden') +
                        ' site-gutter flex-col gap-1 border-t border-stone-200 bg-white py-4 lg:hidden'
                    }
                >
                    {navigation}
                    {internal && navLink(catalogUrl, 'Ver sitio público')}
                </nav>
            </header>
            <div className={'app-frame ' + (internal ? 'flex' : '')}>
                {internal && (
                    <aside className="hidden min-h-[85vh] w-60 shrink-0 border-r border-stone-200 bg-white p-5 lg:block">
                        <p className="eyebrow mb-6 px-3">
                            {superadmin ? 'Administración de Huella' : 'Espacio del refugio'}
                        </p>
                        <nav aria-label="Panel del refugio" className="flex flex-col gap-1">
                            {navigation}
                        </nav>
                    </aside>
                )}
                <main id="main" tabIndex={-1} className="app-main site-gutter py-10">
                    {internal && currentShelter && (
                        <p className="mb-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-950">
                            {currentShelter.name}
                        </p>
                    )}
                    {flash.error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"
                        >
                            {flash.error}
                        </div>
                    )}
                    {flash.success && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950"
                        >
                            {flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            {internal ? (
                <footer className="site-gutter border-t border-stone-200 py-6 text-center text-sm text-stone-600">
                    {shelterName} · Proyecto académico UTN
                </footer>
            ) : (
                <footer className="bg-huella-forest text-white">
                    <div className="site-gutter grid min-w-0 gap-10 py-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-16">
                        <div>
                            <div className="flex items-center gap-3 text-2xl font-semibold">
                                <Icon name="paw" className="h-7 w-7" />
                                huella.
                            </div>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-emerald-100">
                                Un encuentro puede cambiar dos vidas. Acompañamos el camino hacia
                                una adopción responsable.
                            </p>
                        </div>
                        <nav aria-label="Enlaces de adopción">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                                Encontrá tu compañero
                            </p>
                            <Link
                                href={catalogUrl}
                                className="block py-2 text-sm underline-offset-4 hover:underline"
                            >
                                {currentShelter ? 'Animales del refugio' : 'Conocer los refugios'}
                            </Link>
                            <Link
                                href="/#como-funciona"
                                className="block py-2 text-sm underline-offset-4 hover:underline"
                            >
                                Cómo funciona la adopción
                            </Link>
                        </nav>
                        <nav aria-label="Enlaces del refugio">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                                Sigamos en contacto
                            </p>
                            <Link
                                href="/#nosotros"
                                className="block py-2 text-sm underline-offset-4 hover:underline"
                            >
                                Sobre Huella
                            </Link>
                            <Link
                                href={auth.user ? '/dashboard' : '/login'}
                                className="block py-2 text-sm underline-offset-4 hover:underline"
                            >
                                {auth.user ? 'Mi espacio' : 'Ingresar a mi cuenta'}
                            </Link>
                        </nav>
                    </div>
                    <div className="site-gutter flex min-w-0 flex-wrap justify-between gap-3 border-t border-white/20 py-6 text-xs leading-relaxed text-emerald-100">
                        <p>{shelterName} · Cada adopción deja una huella.</p>
                        <p>Proyecto final · UTN</p>
                    </div>
                </footer>
            )}
        </div>
    );
}
