import { Head, Link, useForm } from '@inertiajs/react';
import { Animal, Page, Refuge } from '@/types/shelter';
import { AnimalCard, Empty, Errors, Field, Pagination, Shell } from '@/Components/Shelter';
import Icon from '@/Components/Icon';
import { useEffect, useRef } from 'react';

type Filters = {
    q: string;
    species: string;
    breed: string;
    size: string;
    age: string;
    status: string;
    shelter: string;
    city: string;
};
export default function Catalog({
    catalogUrl = '/animales',
    shelter,
    refuges = [],
    cities = [],
    animals,
    filters,
    breeds,
}: {
    catalogUrl?: string;
    shelter?: Refuge | null;
    refuges?: Refuge[];
    cities?: string[];
    animals: Page<Animal>;
    filters: Record<string, string>;
    breeds: string[];
}) {
    const filterPanel = useRef<HTMLDetailsElement>(null);
    const f = useForm<Filters>({
        q: filters.q || '',
        species: filters.species || '',
        breed: filters.breed || '',
        size: filters.size || '',
        age: filters.age || '',
        status: filters.status || '',
        shelter: shelter ? '' : filters.shelter || '',
        city: shelter ? '' : filters.city || '',
    });
    useEffect(() => {
        f.setData({
            q: filters.q || '',
            species: filters.species || '',
            breed: filters.breed || '',
            size: filters.size || '',
            age: filters.age || '',
            status: filters.status || '',
            shelter: shelter ? '' : filters.shelter || '',
            city: shelter ? '' : filters.city || '',
        });
    }, [filters, shelter?.id]);
    const options: [keyof Filters, string, (string | [string, string])[]][] = [
        ['species', 'Especie', ['Perro', 'Gato', 'Otro']],
        ['breed', 'Raza', breeds],
        ['size', 'Tamaño', ['Pequeño', 'Mediano', 'Grande']],
        [
            'age',
            'Edad',
            [
                ['young', 'Menos de 1 año'],
                ['adult', 'De 1 a 7 años'],
                ['senior', '8 años o más'],
            ],
        ],
        [
            'status',
            'Disponibilidad',
            ['Disponible', 'En proceso de adopción', 'Adoptado', 'No disponible temporalmente'],
        ],
    ];
    if (!shelter) {
        options.push(
            ['shelter', 'Refugio', refuges.map((s) => [s.slug, s.name])],
            ['city', 'Ciudad', cities],
        );
    }
    const labels: Record<string, string> = {
        shelter: 'Refugio',
        city: 'Ciudad',
        q: 'Nombre',
        species: 'Especie',
        breed: 'Raza',
        size: 'Tamaño',
        age: 'Edad',
        status: 'Disponibilidad',
    };
    const ageLabels: Record<string, string> = {
        young: 'Menos de 1 año',
        adult: 'De 1 a 7 años',
        senior: '8 años o más',
    };
    const applied = Object.entries(filters).filter(
        ([key, value]) => value && (key === 'q' || options.some(([option]) => option === key)),
    );
    const withoutFilter = (key: string) => {
        const query = new URLSearchParams(applied.filter(([k]) => k !== key));
        return catalogUrl + (query.size ? '?' + query.toString() : '');
    };
    useEffect(() => {
        if (Object.keys(f.errors).some((key) => key !== 'q') && filterPanel.current) {
            filterPanel.current.open = true;
        }
    }, [f.errors]);
    return (
        <Shell>
            <Head title={shelter ? `Animales de ${shelter.name}` : 'Encontrá tu compañero'} />
            <header className="catalog-heading" aria-labelledby="catalog-title">
                {shelter && (
                    <Link className="text-link mb-4 inline-flex" href={`/refugios/${shelter.slug}`}>
                        {shelter.name} · Ver refugio
                    </Link>
                )}
                <p className="catalog-heading-eyebrow">
                    {shelter
                        ? `Animales en adopción${shelter.city ? ` en ${shelter.city}` : ''}`
                        : 'Animales en adopción de toda la red'}
                </p>
                <h1 id="catalog-title">
                    {shelter ? `Conocé a los amigos de ${shelter.name} ` : 'Conocé a nuestros amigos '}
                    <span className="font-medium text-huella-clay">que buscan un hogar.</span>
                </h1>
                <p className="catalog-heading-copy">
                    {shelter
                        ? `Cada uno tiene una historia única. El equipo de ${shelter.name} los cuida mientras esperan una oportunidad para formar parte de una familia.`
                        : 'Cada uno tiene una historia única y está esperando una oportunidad para formar parte de una familia. Conocé sus perfiles y el refugio que los acompaña.'}
                </p>
            </header>
            <section aria-label="Búsqueda y filtros" className="catalog-tools">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.transform((data) =>
                            Object.fromEntries(
                                Object.entries(data).filter(
                                    ([key, value]) =>
                                        value && (!shelter || !['shelter', 'city'].includes(key)),
                                ),
                            ),
                        );
                        f.get(catalogUrl, {
                            preserveState: true,
                            preserveScroll: true,
                            onSuccess: () => {
                                if (filterPanel.current) filterPanel.current.open = false;
                            },
                        });
                    }}
                    aria-label="Buscar y filtrar animales"
                >
                    <Errors errors={f.errors} />
                    <div className="catalog-toolbar">
                        <div className="catalog-search">
                            <label className="sr-only" htmlFor="catalog-search">
                                Buscar por nombre
                            </label>
                            <input
                                id="catalog-search"
                                type="search"
                                name="q"
                                maxLength={100}
                                value={f.data.q}
                                onChange={(e) => f.setData('q', e.target.value)}
                                placeholder="Buscar por nombre…"
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                aria-label="Buscar animales"
                                disabled={f.processing}
                            >
                                <Icon name="search" className="h-4 w-4" />
                            </button>
                        </div>
                        <details
                            className="catalog-filter-dropdown"
                            ref={filterPanel}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    event.currentTarget.open = false;
                                    event.currentTarget.querySelector('summary')?.focus();
                                }
                            }}
                        >
                            <summary>
                                <Icon name="filter" className="h-4 w-4" />
                                <span>Filtros</span>
                                {applied.filter(([key]) => key !== 'q').length > 0 && (
                                    <span className="catalog-filter-count">
                                        {applied.filter(([key]) => key !== 'q').length}
                                    </span>
                                )}
                                <Icon name="chevron" className="catalog-filter-chevron h-3 w-3" />
                            </summary>
                            <div className="catalog-filter-panel">
                                <div className="filter-grid">
                                    {options.map(([key, label, values]) => (
                                        <Field key={key} label={label} error={f.errors[key]}>
                                            <select
                                                name={key}
                                                value={f.data[key]}
                                                onChange={(e) => f.setData(key, e.target.value)}
                                            >
                                                <option value="">
                                                    {key === 'breed'
                                                        ? 'Todas las razas'
                                                        : 'Todas las opciones'}
                                                </option>
                                                {f.data[key] &&
                                                    !values.some(
                                                        (value) =>
                                                            (typeof value === 'string'
                                                                ? value
                                                                : value[0]) === f.data[key],
                                                    ) && (
                                                        <option value={f.data[key]}>
                                                            {f.data[key]} (sin coincidencias)
                                                        </option>
                                                    )}
                                                {values.map((value) => (
                                                    <option
                                                        key={
                                                            typeof value === 'string'
                                                                ? value
                                                                : value[0]
                                                        }
                                                        value={
                                                            typeof value === 'string'
                                                                ? value
                                                                : value[0]
                                                        }
                                                    >
                                                        {typeof value === 'string'
                                                            ? value
                                                            : value[1]}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    ))}
                                </div>
                                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
                                    <button
                                        className="btn w-full sm:w-auto"
                                        disabled={f.processing}
                                    >
                                        <Icon name="search" className="h-4 w-4" />
                                        {f.processing ? 'Buscando…' : 'Aplicar filtros'}
                                    </button>
                                    <Link
                                        href={catalogUrl}
                                        className="btn-secondary w-full sm:w-auto"
                                    >
                                        Limpiar filtros
                                    </Link>
                                </div>
                            </div>
                        </details>
                    </div>
                </form>
            </section>
            <section aria-labelledby="results-title" aria-busy={f.processing}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2
                        id="results-title"
                        className="text-xl font-semibold tracking-tight text-emerald-950"
                        role="status"
                        aria-live="polite"
                    >
                        {animals.total === 1
                            ? '1 compañero para conocer'
                            : `${animals.total} compañeros para conocer`}
                    </h2>
                    <span className="text-sm text-stone-600">
                        {animals.from && animals.to
                            ? `Mostrando ${animals.from}–${animals.to} de ${animals.total}`
                            : 'Todos merecen un hogar.'}
                    </span>
                </div>
                {applied.length > 0 && (
                    <div aria-label="Filtros aplicados" className="mb-6 flex flex-wrap gap-2">
                        {applied.map(([key, value]) => (
                            <Link
                                key={key}
                                href={withoutFilter(key)}
                                preserveScroll
                                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 hover:border-emerald-800"
                                aria-label={`Quitar filtro ${labels[key]}: ${key === 'age' ? ageLabels[value] || value : key === 'shelter' ? refuges.find((s) => s.slug === value)?.name || value : value}`}
                            >
                                <span className="min-w-0 break-words">
                                    {labels[key]}:{' '}
                                    {key === 'age'
                                        ? ageLabels[value] || value
                                        : key === 'shelter'
                                          ? refuges.find((s) => s.slug === value)?.name || value
                                          : value}
                                </span>
                                <Icon name="close" className="h-4 w-4 shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
                {animals.data.length ? (
                    <div className="companions-grid">
                        {animals.data.map((animal) => (
                            <AnimalCard key={animal.id} animal={animal} compact />
                        ))}
                    </div>
                ) : (
                    <Empty>
                        <h3 className="text-lg font-semibold text-emerald-950">
                            Todavía no encontramos esa coincidencia.
                        </h3>
                        <p className="mt-2">
                            Probá con menos filtros o buscá por otro nombre. Hay muchas historias
                            por conocer.
                        </p>
                        <Link href={catalogUrl} className="btn-secondary mt-5">
                            Ver todos los animales
                        </Link>
                    </Empty>
                )}
                <Pagination page={animals} />
            </section>
        </Shell>
    );
}
