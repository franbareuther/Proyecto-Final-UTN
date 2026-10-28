import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    HeartHandshake,
    House,
    LayoutDashboard,
    LogOut,
    Mail,
    PanelLeftClose,
    PanelLeftOpen,
    PawPrint,
    Search,
    Settings,
    ShieldCheck,
    Stethoscope,
    X,
    type LucideIcon,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { Shared } from '@/types/shelter';

export type NavItemData = {
    id: string;
    title: string;
    href: string;
    icon: LucideIcon;
    children?: NavItemData[];
};
export type NavGroupData = { heading?: string; items: NavItemData[] };

function isActive(item: NavItemData, path: string): boolean {
    if (item.id === 'history' && path === '/veterinaria/controles') return false;
    return path === item.href || (item.href !== '/admin' && path.startsWith(item.href + '/'));
}

function NavItem({
    item,
    path,
    onNavigate,
}: {
    item: NavItemData;
    path: string;
    onNavigate: () => void;
}) {
    const active = isActive(item, path);
    const childActive = item.children?.some((child) => isActive(child, path));
    const [open, setOpen] = useState(Boolean(active || childActive));
    useEffect(() => {
        if (active || childActive) setOpen(true);
    }, [active, childActive]);
    const Icon = item.icon;
    const classes =
        'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ' +
        (active && !item.children
            ? 'bg-emerald-900/8 font-semibold text-emerald-950'
            : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-950');
    return (
        <div>
            {item.children ? (
                <button
                    type="button"
                    className={classes}
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-controls={'nav-' + item.id}
                >
                    <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronRight
                        size={14}
                        className={'transition-transform ' + (open ? 'rotate-90' : '')}
                        aria-hidden="true"
                    />
                </button>
            ) : (
                <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={classes}
                    aria-current={active ? 'page' : undefined}
                >
                    <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                    {item.title}
                </Link>
            )}
            {item.children && (
                <div
                    id={'nav-' + item.id}
                    hidden={!open}
                    className="ml-5 mt-1 space-y-1 border-l border-stone-200 pl-3"
                >
                    {item.children.map((child) => (
                        <NavItem key={child.id} item={child} path={path} onNavigate={onNavigate} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function SidebarNav({
    groups,
    path,
    workspace,
    role,
    onNavigate,
    onSearch,
    sidebarContent,
}: {
    groups: NavGroupData[];
    path: string;
    workspace: string;
    role: string;
    onNavigate: () => void;
    onSearch: () => void;
    sidebarContent?: ReactNode;
}) {
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    return (
        <div className="flex h-full w-[260px] flex-col bg-[#f8f9f6] p-3">
            <div className="mb-5 border-b border-stone-200/70 pb-3">
                <button
                    type="button"
                    className="flex min-h-14 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-stone-200/40"
                    onClick={() => setWorkspaceOpen(!workspaceOpen)}
                    aria-expanded={workspaceOpen}
                    aria-controls="workspace-details"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white">
                        <PawPrint size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-stone-900">
                            {workspace}
                        </span>
                        <span className="mt-1 block text-[11px] text-stone-500">{role}</span>
                    </span>
                    <ChevronDown
                        size={15}
                        className={
                            'shrink-0 text-stone-400 transition-transform ' +
                            (workspaceOpen ? 'rotate-180' : '')
                        }
                        aria-hidden="true"
                    />
                </button>
                {workspaceOpen && (
                    <div
                        id="workspace-details"
                        className="mt-2 rounded-lg border border-stone-200 bg-white p-2 shadow-sm"
                    >
                        <Link
                            href="/"
                            onClick={onNavigate}
                            className="flex min-h-11 items-center justify-between rounded-md px-2 text-xs hover:bg-stone-50"
                        >
                            Ir al sitio de Huella <ArrowUpRight size={15} />
                        </Link>
                        <Link
                            href={
                                role === 'Superadministrador'
                                    ? '/superadmin/refugios'
                                    : '/admin/refugio'
                            }
                            onClick={onNavigate}
                            className="flex min-h-11 items-center rounded-md px-2 text-xs hover:bg-stone-50"
                        >
                            {role === 'Superadministrador'
                                ? 'Gestionar refugios'
                                : 'Configurar mi refugio'}
                        </Link>
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={onSearch}
                className="mb-5 flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 text-[13px] text-stone-500 shadow-sm hover:border-stone-300"
            >
                <Search size={16} aria-hidden="true" />
                <span className="flex-1 text-left">Buscar sección</span>
                <kbd className="rounded border border-stone-200 px-1 text-[10px]">Ctrl K</kbd>
            </button>
            <nav
                aria-label="Panel del refugio"
                className="min-h-0 flex-1 space-y-6 overflow-y-auto"
            >
                {groups.map((group, index) => (
                    <div key={index} className="space-y-1">
                        {group.heading && (
                            <p className="mb-2 px-3 text-xs font-medium tracking-normal text-stone-500">
                                {group.heading}
                            </p>
                        )}
                        {group.items.map((item) => (
                            <NavItem
                                key={item.id}
                                item={item}
                                path={path}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                ))}
                {sidebarContent && (
                    <div
                        onClick={(event) => {
                            if ((event.target as HTMLElement).closest('button, a')) onNavigate();
                        }}
                    >
                        {sidebarContent}
                    </div>
                )}
            </nav>
            <div className="mt-5 space-y-1 border-t border-stone-200/70 pt-3">
                <NavItem
                    item={{ id: 'profile', title: 'Mi perfil', href: '/profile', icon: Settings }}
                    path={path}
                    onNavigate={onNavigate}
                />
                <Link
                    as="button"
                    href="/logout"
                    method="post"
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-stone-600 hover:bg-stone-200/50"
                    onClick={onNavigate}
                >
                    <LogOut size={17} strokeWidth={1.6} aria-hidden="true" />
                    Salir
                </Link>
                <p className="px-3 pt-4 text-[10px] tracking-wide text-stone-400">
                    HUELLA · PROYECTO UTN
                </p>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
    sidebarContent,
}: PropsWithChildren<{ sidebarContent?: ReactNode }>) {
    const {
        props: { auth, currentShelter, flash },
        url,
    } = usePage<Shared>();
    const path = url.split(/[?#]/)[0];
    const superadmin = auth.user?.role === 'superadmin';
    const workspace = superadmin ? 'Huella' : currentShelter?.name || 'Mi refugio';
    const role = superadmin ? 'Superadministrador' : 'Administrador';
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const groups: NavGroupData[] = superadmin
        ? [
              {
                  heading: 'Administración',
                  items: [
                      {
                          id: 'shelters',
                          title: 'Gestionar refugios',
                          href: '/superadmin/refugios',
                          icon: House,
                      },
                      {
                          id: 'messages',
                          title: 'Mensajes',
                          href: '/superadmin/mensajes',
                          icon: Mail,
                      },
                  ],
              },
          ]
        : [
              {
                  items: [
                      { id: 'dashboard', title: 'Resumen', href: '/admin', icon: LayoutDashboard },
                  ],
              },
              {
                  heading: 'Mi refugio',
                  items: [
                      { id: 'shelter', title: 'Mi refugio', href: '/admin/refugio', icon: House },
                      { id: 'animals', title: 'Animales', href: '/admin/animales', icon: PawPrint },
                      {
                          id: 'requests',
                          title: 'Solicitudes',
                          href: '/admin/solicitudes',
                          icon: HeartHandshake,
                      },
                      {
                          id: 'adoptions',
                          title: 'Adopciones',
                          href: '/admin/adopciones',
                          icon: ShieldCheck,
                      },
                  ],
              },
              {
                  heading: 'Bienestar animal',
                  items: [
                      {
                          id: 'health',
                          title: 'Salud y cuidados',
                          href: '/veterinaria',
                          icon: Stethoscope,
                          children: [
                              {
                                  id: 'history',
                                  title: 'Historias clínicas',
                                  href: '/veterinaria',
                                  icon: Stethoscope,
                              },
                              {
                                  id: 'controls',
                                  title: 'Próximos controles',
                                  href: '/veterinaria/controles',
                                  icon: CalendarDays,
                              },
                          ],
                      },
                  ],
              },
          ];
    const items = groups.flatMap((group) => group.items.flatMap((item) => item.children || [item]));
    const searchable = [
        ...items,
        { id: 'profile', title: 'Mi perfil', href: '/profile', icon: Settings },
    ];
    const active = searchable
        .filter((item) => isActive(item, path))
        .sort((a, b) => b.href.length - a.href.length)[0];
    const results = searchable.filter((item) =>
        item.title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(
                query
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase(),
            ),
    );
    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen((value) => !value);
            }
        };
        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, []);
    useEffect(
        () =>
            router.on('navigate', () => {
                setMobileOpen(false);
                setSearchOpen(false);
            }),
        [],
    );
    useEffect(() => {
        if (!searchOpen) setQuery('');
    }, [searchOpen]);
    const sidebar = (
        <SidebarNav
            sidebarContent={sidebarContent}
            groups={groups}
            path={path}
            workspace={workspace}
            role={role}
            onNavigate={() => setMobileOpen(false)}
            onSearch={() => {
                setMobileOpen(false);
                setSearchOpen(true);
            }}
        />
    );
    return (
        <div className="dashboard-layout min-h-screen bg-[#f5f6f3] text-stone-800">
            <a href="#main" className="skip-link">
                Saltar al contenido
            </a>
            <aside
                className={
                    'fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-stone-200/80 transition-[width] duration-300 lg:block ' +
                    (collapsed ? 'w-0 border-none' : 'w-[260px]')
                }
            >
                {!collapsed && sidebar}
            </aside>
            <Dialog open={mobileOpen} onClose={setMobileOpen} className="relative z-50 lg:hidden">
                <div className="fixed inset-0 bg-stone-950/30 backdrop-blur-sm" />
                <DialogPanel className="fixed inset-y-0 left-0 w-[min(300px,100vw)] bg-[#f8f9f6] shadow-xl">
                    <DialogTitle className="sr-only">Menú del panel</DialogTitle>
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setMobileOpen(false)}
                        className="absolute right-2 top-2 z-10 rounded-lg bg-white p-2 shadow-sm"
                    >
                        <X size={18} />
                    </button>
                    {sidebar}
                </DialogPanel>
            </Dialog>
            <div
                className={
                    'min-w-0 transition-[padding] duration-300 ' +
                    (collapsed ? '' : 'lg:pl-[260px]')
                }
            >
                <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-stone-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100 lg:block"
                            aria-label={
                                collapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'
                            }
                            aria-expanded={!collapsed}
                        >
                            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="rounded-lg p-2 text-stone-500 lg:hidden"
                            aria-label="Abrir menú"
                            aria-expanded={mobileOpen}
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                        <div className="flex min-w-0 items-center gap-2 text-xs">
                            <span className="hidden max-w-48 truncate text-stone-400 sm:block">
                                {workspace}
                            </span>
                            <span className="hidden text-stone-300 sm:block">/</span>
                            <span className="truncate font-medium text-stone-800">
                                {active?.title || 'Panel de gestión'}
                            </span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                        <Link
                            href={
                                currentShelter && !superadmin
                                    ? `/refugios/${currentShelter.slug}/animales`
                                    : '/'
                            }
                            className="hidden items-center gap-1 text-xs text-stone-500 hover:text-emerald-900 sm:flex"
                        >
                            Ver sitio público <ArrowUpRight size={14} />
                        </Link>
                        <button
                            type="button"
                            aria-label="Buscar sección"
                            onClick={() => setSearchOpen(true)}
                            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                        >
                            <Search size={18} />
                        </button>
                        <Link
                            href="/profile"
                            aria-label="Mi perfil"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/10 bg-emerald-900/8 text-xs font-semibold text-emerald-950"
                        >
                            {auth.user?.name?.slice(0, 1)}
                            {auth.user?.last_name?.slice(0, 1)}
                        </Link>
                    </div>
                </header>
                <main
                    id="main"
                    tabIndex={-1}
                    className="app-main min-w-0 px-4 py-8 sm:px-8 xl:px-10 xl:py-10"
                >
                    {flash.error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
                        >
                            {flash.error}
                        </div>
                    )}
                    {flash.success && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
                        >
                            {flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <Dialog open={searchOpen} onClose={setSearchOpen} className="relative z-[60]">
                <div className="fixed inset-0 bg-stone-950/25 backdrop-blur-sm" />
                <div className="fixed inset-0 overflow-y-auto px-4 pt-[15vh]">
                    <DialogPanel className="mx-auto max-w-lg overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
                        <DialogTitle className="sr-only">Buscar una sección del panel</DialogTitle>
                        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
                            <Search size={18} className="shrink-0 text-stone-400" />
                            <input
                                autoFocus
                                aria-label="Buscar sección"
                                placeholder="¿A dónde querés ir?"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                            <button
                                type="button"
                                aria-label="Cerrar búsqueda"
                                onClick={() => setSearchOpen(false)}
                                className="rounded-md p-2 text-stone-500 hover:bg-stone-100"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <nav
                            aria-label="Resultados de búsqueda"
                            className="max-h-80 space-y-1 overflow-y-auto p-2"
                        >
                            {results.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setSearchOpen(false)}
                                    className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-stone-100"
                                >
                                    <item.icon size={17} className="text-stone-400" />
                                    {item.title}
                                    <ChevronRight size={14} className="ml-auto text-stone-400" />
                                </Link>
                            ))}
                            {!results.length && (
                                <p className="px-3 py-8 text-center text-sm text-stone-500">
                                    No encontramos esa sección. Probá con otro nombre.
                                </p>
                            )}
                        </nav>
                        <p className="border-t border-stone-100 px-4 py-3 text-[11px] text-stone-400">
                            Navegá con Tab · Enter para abrir · Esc para cerrar
                        </p>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
