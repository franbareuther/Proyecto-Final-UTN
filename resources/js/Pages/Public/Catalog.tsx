import { Head, Link, useForm } from '@inertiajs/react';
import { Animal, Page, Refuge } from '@/types/shelter';
import { AnimalCard, Empty, Errors, Field, Pagination, Shell } from '@/Components/Shelter';
import Icon from '@/Components/Icon';

type Filters = {
    q: string;
    species: string;
    breed: string;
    size: string;
    age: string;
    status: string;
};
export default function Catalog({
    catalogUrl = '/animales',
    shelter,
    animals,
    filters,
    breeds,
}: {
    catalogUrl?: string;
    shelter?: Refuge;
    animals: Page<Animal>;
    filters: Record<string, string>;
    breeds: string[];
}) {
    const f = useForm<Filters>({
        q: filters.q || '',
        species: filters.species || '',
        breed: filters.breed || '',
        size: filters.size || '',
        age: filters.age || '',
        status: filters.status || '',
    });
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
    const labels: Record<string, string> = {
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
    const applied = Object.entries(filters).filter(([key, value]) => key in f.data && value);
    const withoutFilter = (key: string) => {
        const query = new URLSearchParams(
            Object.entries(filters).filter(([k, v]) => k !== key && k in f.data && v),
        );
        return catalogUrl + (query.size ? '?' + query.toString() : '');
    };
    return (
        <Shell>
            <Head title="Encontrá tu compañero" />
            <header className="mb-8 max-w-3xl sm:mb-10">
                {shelter && (
                    <Link className="text-link mb-4 inline-flex" href={`/refugios/${shelter.slug}`}>
                        {shelter.name} · Ver refugio
                    </Link>
                )}
                <p className="eyebrow">Cada historia merece una oportunidad</p>
                <h1 className="public-heading mt-4">
                    Tu próximo compañero
                    <br />
                    <span className="font-serif italic font-normal text-huella-clay">
                        está por acá.
                    </span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
                    Conocé a los animales del refugio. Más allá de su tamaño o edad, cada uno tiene
                    algo único para compartir.
                </p>
            </header>
            <section aria-labelledby="filters-title" className="card mb-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-5">
                    <h2
                        id="filters-title"
                        className="flex items-center gap-2 font-semibold text-emerald-950"
                    >
                        <Icon name="filter" className="h-5 w-5" />
                        Encontrá una buena compañía
                    </h2>
                    <p className="text-sm text-stone-600">Podés combinar los filtros.</p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.get(catalogUrl, { preserveState: true, preserveScroll: true });
                    }}
                    aria-label="Buscar y filtrar animales"
                >
                    <Errors errors={f.errors} />
                    <div className="filter-grid">
                        <Field label="Buscar por nombre" error={f.errors.q}>
                            <input
                                type="search"
                                name="q"
                                maxLength={100}
                                value={f.data.q}
                                onChange={(e) => f.setData('q', e.target.value)}
                                placeholder="Por ejemplo, Mora"
                                autoComplete="off"
                            />
                        </Field>
                        {options.map(([key, label, values]) => (
                            <Field key={key} label={label} error={f.errors[key]}>
                                <select
                                    name={key}
                                    value={f.data[key]}
                                    onChange={(e) => f.setData(key, e.target.value)}
                                >
                                    <option value="">
                                        {key === 'breed' ? 'Todas las razas' : 'Todas las opciones'}
                                    </option>
                                    {values.map((value) => (
                                        <option
                                            key={typeof value === 'string' ? value : value[0]}
                                            value={typeof value === 'string' ? value : value[0]}
                                        >
                                            {typeof value === 'string' ? value : value[1]}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
                        <button className="btn w-full sm:w-auto" disabled={f.processing}>
                            <Icon name="search" className="h-4 w-4" />
                            {f.processing ? 'Buscando…' : 'Buscar compañeros'}
                        </button>
                        <Link href={catalogUrl} className="btn-secondary w-full sm:w-auto">
                            Limpiar filtros
                        </Link>
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
                                aria-label={`Quitar filtro ${labels[key]}: ${key === 'age' ? ageLabels[value] || value : value}`}
                            >
                                <span className="min-w-0 break-words">
                                    {labels[key]}:{' '}
                                    {key === 'age' ? ageLabels[value] || value : value}
                                </span>
                                <Icon name="close" className="h-4 w-4 shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
                {animals.data.length ? (
                    <div className="animal-grid">
                        {animals.data.map((animal) => (
                            <AnimalCard key={animal.id} animal={animal} />
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
