import { Link, router, usePage } from '@inertiajs/react';
import {
    Children,
    cloneElement,
    isValidElement,
    PropsWithChildren,
    ReactNode,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Animal, Application, Page, Shared } from '@/types/shelter';
import Modal from '@/Components/Modal';
import AnimalImage from '@/Components/AnimalImage';
import Icon, { IconName } from '@/Components/Icon';
import PublicFooter from '@/Components/PublicFooter';
import ChatBubble from '@/Components/ChatBubble';

export const date = (value: string) =>
    new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR');

// Solo color de texto: los estados se leen sin recuadro. Tonos 700/800 para mantener contraste sobre el fondo claro.
const badgeStyles: Record<string, string> = {
    Disponible: 'text-emerald-800',
    'En proceso de adopción': 'text-amber-700',
    Adoptado: 'text-sky-700',
    'No disponible temporalmente': 'text-stone-600',
    Nueva: 'text-sky-700',
    'En revisión': 'text-amber-700',
    Aprobada: 'text-emerald-800',
    Rechazada: 'text-rose-700',
    Vencido: 'text-rose-700',
    Hoy: 'text-amber-800',
    Próximo: 'text-amber-700',
    Pendiente: 'text-amber-700',
    Aplicada: 'text-emerald-800',
    Realizado: 'text-emerald-800',
    Cancelada: 'text-stone-600',
    Cancelado: 'text-stone-600',
    Enviado: 'text-sky-700',
    Revisado: 'text-emerald-800',
};
/** `overlay` agrega un fondo blanco solo cuando el estado va encima de una fotografía, para que siga siendo legible. */
export function Badge({ children, overlay = false }: PropsWithChildren<{ overlay?: boolean }>) {
    const style = typeof children === 'string' ? badgeStyles[children] : undefined;
    return (
        <span
            className={
                'inline-flex max-w-full items-center gap-2 text-xs font-semibold leading-relaxed ' +
                (overlay ? 'rounded-full bg-white/95 px-3 py-1.5 shadow-sm ' : '') +
                (style || 'text-stone-700')
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
        <div className="page-title-block mb-8 flex min-w-0 flex-wrap items-end justify-between gap-5 sm:mb-10">
            <div className="min-w-0 max-w-3xl">
                <h1 className="page-heading break-words">{title}</h1>
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
            <label htmlFor={id} className="field-label mb-2 block">
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
export function AnimalCard({ animal, compact = false }: { animal: Animal; compact?: boolean }) {
    const city = animal.shelter?.city?.trim() || 'Localidad sin informar';
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
                {animal.availability_status !== 'Disponible' && (
                    <div className="absolute left-3 top-3 right-3">
                        <Badge overlay>{animal.availability_status}</Badge>
                    </div>
                )}
            </div>
            <div className="animal-card-body flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                {compact ? (
                    <>
                        <h3
                            className="truncate font-semibold tracking-tight text-emerald-950"
                            title={animal.name}
                        >
                            {animal.name}
                        </h3>
                        <p className="mt-1 truncate text-sm text-stone-600" title={animal.species}>
                            {animal.species}
                        </p>
                        {animal.shelter && (
                            <p
                                className="mt-3 truncate text-xs text-emerald-800"
                                title={animal.shelter.name}
                            >
                                {animal.shelter.name}
                            </p>
                        )}
                    </>
                ) : (
                    <>
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
                            <span className="rounded-md bg-stone-100 px-2.5 py-1.5">
                                {animal.sex}
                            </span>
                            <span className="rounded-md bg-stone-100 px-2.5 py-1.5">
                                {animal.size}
                            </span>
                        </div>
                        <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
                            {animal.birth_date
                                ? `Nació el ${date(animal.birth_date)}`
                                : animal.estimated_age !== null
                                  ? `${animal.estimated_age} meses aprox.`
                                  : 'Edad a confirmar con el refugio'}
                        </p>
                    </>
                )}
                <p
                    className="mt-1 truncate text-xs text-stone-600"
                    title={city}
                    aria-label={`Localidad: ${city}`}
                >
                    {city}
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
function MenuGlyph({ expanded = false }: { expanded?: boolean }) {
    return (
        <span className="mobile-menu-icon" data-open={expanded} aria-hidden="true">
            <span />
            <span />
        </span>
    );
}

export function Shell({
    children,
    internal = false,
    sidebar,
    backdrop = false,
}: PropsWithChildren<{ internal?: boolean; sidebar?: ReactNode; backdrop?: boolean }>) {
    const { auth, flash, shelterName, currentShelter } = usePage<Shared>().props;
    const currentPath = usePage().url.split(/[?#]/)[0];
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [menuScrollbarGap, setMenuScrollbarGap] = useState(0);
    const header = useRef<HTMLElement>(null);
    const closeMenuButton = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const admin = auth.user?.role === 'admin';
    const superadmin = auth.user?.role === 'superadmin';
    const staff = admin;
    // Burbuja de chat: en el panel del refugio para su personal y en todo el sitio para adoptantes.
    const showChat = (admin && internal) || auth.user?.role === 'adoptante';
    const catalogUrl = currentShelter ? `/refugios/${currentShelter.slug}/animales` : '/animales';
    useEffect(() => {
        setSidebarCollapsed(window.localStorage.getItem('huella-sidebar-collapsed') === 'true');
    }, []);
    useEffect(() => {
        const element = header.current;
        if (!element) return;

        const scrollRange = 96;
        let current = Math.min(window.scrollY / scrollRange, 1);
        let target = current;
        let frame = 0;

        const mix = (from: number, to: number, progress: number) =>
            Math.round(from + (to - from) * progress);
        const paint = (progress: number) => {
            const textColor = `rgb(${mix(21, 255, progress)} ${mix(62, 255, progress)} ${mix(49, 255, progress)})`;
            const buttonColor = `rgb(${mix(21, 255, progress)} ${mix(62, 255, progress)} ${mix(49, 255, progress)})`;
            const buttonText = `rgb(${mix(255, 21, progress)} ${mix(255, 62, progress)} ${mix(255, 49, progress)})`;
            const buttonHover = `rgb(${mix(22, 231, progress)} ${mix(101, 237, progress)} ${mix(52, 223, progress)})`;

            element.style.setProperty('--header-progress', progress.toFixed(3));
            element.style.setProperty('--header-offset', `${(progress - 1) * 100}%`);
            element.style.setProperty('--header-text-color', textColor);
            element.style.setProperty('--header-button-bg', buttonColor);
            element.style.setProperty('--header-button-color', buttonText);
            element.style.setProperty('--header-button-hover-bg', buttonHover);
            element.style.setProperty('--header-shadow-alpha', (progress * 0.12).toFixed(3));
        };
        const animate = () => {
            const distance = target - current;
            current = Math.abs(distance) < 0.002 ? target : current + distance * 0.18;
            paint(current);

            if (current !== target) frame = window.requestAnimationFrame(animate);
            else frame = 0;
        };
        const updateScroll = () => {
            target = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
            setScrolled(target >= 0.5);

            if (!frame) frame = window.requestAnimationFrame(animate);
        };

        paint(current);
        setScrolled(current >= 0.5);
        window.addEventListener('scroll', updateScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateScroll);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);
    useEffect(() => router.on('navigate', () => setOpen(false)), []);
    useEffect(() => {
        if (!open) return;
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => {
            if (desktop.matches) setOpen(false);
        };
        closeOnDesktop();
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, [open]);
    const navLink = (
        href: string,
        label: string,
        active = currentPath === href,
        icon?: IconName,
    ) => (
        <Link
            key={href}
            className="nav-link"
            href={href}
            aria-current={active ? 'page' : undefined}
            onClick={() => setOpen(false)}
            title={internal && sidebarCollapsed ? label : undefined}
            aria-label={label}
        >
            {icon && <Icon name={icon} className="nav-link-icon h-5 w-5 shrink-0" />}
            <span className="nav-link-label">{label}</span>
        </Link>
    );
    const primaryNavigation = (
        <>
            {internal && superadmin && (
                <>
                    {navLink('/superadmin', 'Resumen de la red', currentPath === '/superadmin', 'dashboard')}
                    {navLink('/superadmin/refugios', 'Gestionar refugios', undefined, 'building')}
                    {navLink('/superadmin/animales', 'Todos los animales', currentPath.startsWith('/superadmin/animales'), 'paw')}
                    {navLink('/superadmin/solicitudes', 'Solicitudes', currentPath.startsWith('/superadmin/solicitudes'), 'clipboard')}
                    {navLink('/superadmin/adopciones', 'Adopciones', undefined, 'heart')}
                    {navLink('/superadmin/controles', 'Controles de la red', undefined, 'medical')}
                    {navLink('/superadmin/dosis', 'Vacunas y dosis', undefined, 'calendar')}
                    {navLink('/superadmin/mensajes', 'Mensajes', undefined, 'mail')}
                </>
            )}
            {internal && admin && (
                <>
                    {navLink('/admin', 'Resumen', undefined, 'dashboard')}
                    {navLink('/admin/refugio', 'Mi refugio', undefined, 'building')}
                    {navLink(
                        '/admin/animales',
                        'Animales',
                        currentPath.startsWith('/admin/animales'),
                        'paw',
                    )}
                    {navLink('/admin/solicitudes', 'Solicitudes', undefined, 'clipboard')}
                    {navLink('/admin/adopciones', 'Adopciones', undefined, 'heart')}
                </>
            )}
            {internal && staff && (
                <>
                    {navLink(
                        '/veterinaria',
                        'Salud y cuidados',
                        currentPath.startsWith('/veterinaria') &&
                            currentPath !== '/veterinaria/controles',
                        'medical',
                    )}
                    {navLink('/veterinaria/controles', 'Próximos controles', undefined, 'calendar')}
                </>
            )}
            {!internal && (
                <>
                    {navLink('/animales', 'Animales en adopción', currentPath === '/animales')}
                    {navLink('/refugios', 'Refugios', currentPath === '/refugios')}
                    {currentShelter &&
                        navLink(catalogUrl, 'Adoptar', currentPath.startsWith(catalogUrl))}
                    {navLink('/#como-funciona', 'Cómo funciona', false)}
                    {navLink('/#contacto', 'Contacto', false)}
                </>
            )}
        </>
    );
    const logoutLink = auth.user ? (
        <Link
            as="button"
            href="/logout"
            method="post"
            className="nav-link nav-link-danger text-left"
            onClick={() => setOpen(false)}
            title={internal && sidebarCollapsed ? 'Salir' : undefined}
            aria-label="Salir"
        >
            <Icon name="logout" className="nav-link-icon h-5 w-5 shrink-0" />
            <span className="nav-link-label">Salir</span>
        </Link>
    ) : null;
    const accountNavigation = auth.user ? (
        <>
            {!internal &&
                navLink(
                    '/dashboard',
                    staff || superadmin ? 'Mi panel' : 'Mis solicitudes',
                    currentPath === '/mis-solicitudes',
                )}
            {navLink('/profile', 'Mi perfil', undefined, 'user')}
            {!internal && logoutLink}
        </>
    ) : (
        <>
            {navLink('/login', 'Ingresar')}
            <Link className="btn" href="/register" onClick={() => setOpen(false)}>
                Crear cuenta <Icon name="arrow" className="h-4 w-4" />
            </Link>
        </>
    );
    const navigation = (
        <>
            {primaryNavigation}
            {accountNavigation}
        </>
    );
    const brand = (
        <Link
            href="/"
            aria-label={`${shelterName} — Inicio`}
            className="site-brand flex shrink-0 items-center gap-2.5"
            onClick={() => setOpen(false)}
        >
            <Icon name="paw" className="h-9 w-9 shrink-0" />
            <span className="font-display text-3xl font-bold leading-none tracking-tight">
                huellita
            </span>
        </Link>
    );
    return (
        <div
            className={
                'min-h-screen ' +
                (internal ? 'internal-shell' : 'public-shell') +
                (internal || backdrop ? ' grid-backdrop' : '')
            }
        >
            <a className="skip-link" href="#main">
                Saltar al contenido
            </a>
            <header
                ref={header}
                className={`site-header sticky top-0 z-40 ${internal ? 'lg:hidden' : ''}`}
                data-scrolled={scrolled}
            >
                <div className="mobile-menu-masthead site-gutter flex w-full min-w-0 items-center justify-between gap-4">
                    {brand}
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
                        type="button"
                        className="mobile-menu-toggle lg:hidden"
                        onClick={() => {
                            setMenuScrollbarGap(
                                Math.max(
                                    0,
                                    window.innerWidth - document.documentElement.clientWidth,
                                ),
                            );
                            setOpen(true);
                        }}
                        aria-expanded={open}
                        aria-controls={menuId}
                        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                        aria-haspopup="dialog"
                    >
                        <MenuGlyph expanded={open} />
                    </button>
                </div>
            </header>
            <Dialog
                transition
                open={open}
                onClose={() => setOpen(false)}
                initialFocus={closeMenuButton}
                className="mobile-menu-layer"
            >
                <DialogPanel
                    transition
                    className="mobile-menu-panel"
                    style={{ paddingRight: menuScrollbarGap }}
                >
                    <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
                    <div className="mobile-menu-masthead site-gutter flex shrink-0 items-center justify-between gap-4">
                        {brand}
                        <button
                            ref={closeMenuButton}
                            type="button"
                            className="mobile-menu-toggle"
                            aria-label="Cerrar menú"
                            onClick={() => setOpen(false)}
                        >
                            <MenuGlyph expanded />
                        </button>
                    </div>
                    <nav
                        id={menuId}
                        aria-label="Navegación móvil"
                        className="mobile-menu-navigation site-gutter"
                    >
                        <div className="mobile-menu-items">
                            <div className="mobile-menu-primary">
                                {navLink('/', 'Inicio')}
                                {primaryNavigation}
                                {auth.user && accountNavigation}
                                {internal && sidebar && (
                                    <div onClick={(event) => {
                                        if ((event.target as HTMLElement).closest('button, a')) setOpen(false);
                                    }}>
                                        {sidebar}
                                    </div>
                                )}
                                {internal && navLink(catalogUrl, 'Ver sitio público')}
                                {internal && logoutLink}
                            </div>
                            {!auth.user && (
                                <div
                                    className="mobile-menu-account"
                                    role="group"
                                    aria-label="Acceso a tu cuenta"
                                >
                                    {accountNavigation}
                                </div>
                            )}
                        </div>
                    </nav>
                </DialogPanel>
            </Dialog>
            <div className={'app-frame ' + (internal ? 'flex min-h-screen items-start' : '')}>
                {internal && (
                    <aside
                        className={`internal-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stone-200 bg-white p-4 lg:flex ${sidebarCollapsed ? 'is-collapsed' : ''}`}
                    >
                        <div className="internal-sidebar-header flex items-center justify-between gap-2 border-b border-stone-100 pb-4">
                            {brand}
                            <button
                                type="button"
                                className="sidebar-toggle"
                                aria-label={
                                    sidebarCollapsed
                                        ? 'Expandir barra lateral'
                                        : 'Contraer barra lateral'
                                }
                                aria-expanded={!sidebarCollapsed}
                                onClick={() => {
                                    const next = !sidebarCollapsed;
                                    setSidebarCollapsed(next);
                                    window.localStorage.setItem(
                                        'huella-sidebar-collapsed',
                                        String(next),
                                    );
                                }}
                            >
                                <Icon name="sidebar" className="h-5 w-5" />
                            </button>
                        </div>
                        <nav
                            aria-label={superadmin ? 'Panel de administración' : 'Panel del refugio'}
                            className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
                        >
                            {navigation}
                            {!sidebarCollapsed && sidebar}
                        </nav>
                        <div className="sidebar-footer mt-3 flex flex-col gap-1 border-t border-stone-100 pt-3">
                            <Link href={catalogUrl} className="nav-link" aria-label="Ver sitio público" title={sidebarCollapsed ? 'Ver sitio público' : undefined}>
                                <Icon name="arrow" className="nav-link-icon h-5 w-5 shrink-0" />
                                <span className="nav-link-label">Ver sitio público</span>
                            </Link>
                            {logoutLink}
                        </div>
                    </aside>
                )}
                <div
                    className={
                        internal ? 'internal-content flex min-h-screen min-w-0 flex-1 flex-col' : ''
                    }
                >
                    <main
                        id="main"
                        tabIndex={-1}
                        className={`app-main site-gutter flex-1 ${internal ? 'py-5' : 'py-10'}`}
                    >
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
                    {internal && (
                        <footer className="site-gutter border-t border-stone-200 py-6 text-center text-sm text-stone-600">
                            {shelterName} · Proyecto académico UTN
                        </footer>
                    )}
                </div>
            </div>
            {!internal && (
                <PublicFooter catalogUrl={catalogUrl} scoped={Boolean(currentShelter)} signedIn={Boolean(auth.user)} shelterName={shelterName} />
            )}
            {showChat && <ChatBubble />}
        </div>
    );
}
