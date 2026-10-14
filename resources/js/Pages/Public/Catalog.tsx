import { Head, Link, useForm } from '@inertiajs/react';
import { Animal, Page } from '@/types/shelter';
import { AnimalCard, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
export default function Catalog({
    animals,
    filters,
    breeds,
}: {
    animals: Page<Animal>;
    filters: Record<string, string>;
    breeds: string[];
}) {
    const f = useForm({
        q: filters.q || '',
        species: filters.species || '',
        breed: filters.breed || '',
        size: filters.size || '',
        age: filters.age || '',
        status: filters.status || '',
    });
    return (
        <Shell>
            <Head title="Encontrá tu compañero" />
            <Title
                title="Una familia empieza con un encuentro."
                text="Conocé sus historias y encontrá a quien pueda compartir la tuya."
            />
            <form
                className="card mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/animales', { preserveState: true });
                }}
            >
                <Field label="Buscar por nombre">
                    <input
                        value={f.data.q}
                        onChange={(e) => f.setData('q', e.target.value)}
                        placeholder="¿A quién estás buscando?"
                    />
                </Field>
                {(
                    [
                        ['species', 'Especie', ['Perro', 'Gato', 'Otro']],
                        ['breed', 'Raza', breeds],
                        ['size', 'Tamaño', ['Pequeño', 'Mediano', 'Grande']],
                        [
                            'age',
                            'Edad',
                            [
                                ['young', 'Menos de 1 año'],
                                ['adult', '1 a 7 años'],
                                ['senior', '8 años o más'],
                            ],
                        ],
                        [
                            'status',
                            'Disponibilidad',
                            [
                                'Disponible',
                                'En proceso de adopción',
                                'Adoptado',
                                'No disponible temporalmente',
                            ],
                        ],
                    ] as [keyof typeof f.data, string, (string | [string, string])[]][]
                ).map(([key, label, options]) => (
                    <Field key={key} label={label}>
                        <select
                            value={f.data[key]}
                            onChange={(e) => f.setData(key, e.target.value)}
                        >
                            <option value="">Todas las opciones</option>
                            {options.map((o) => (
                                <option
                                    key={typeof o === 'string' ? o : o[0]}
                                    value={typeof o === 'string' ? o : o[0]}
                                >
                                    {typeof o === 'string' ? o : o[1]}
                                </option>
                            ))}
                        </select>
                    </Field>
                ))}
                <div className="flex items-end gap-4">
                    <button className="btn" disabled={f.processing}>
                        Aplicar filtros
                    </button>
                    <Link className="text-sm underline" href="/animales">
                        Limpiar
                    </Link>
                </div>
            </form>
            <Errors errors={f.errors} />
            <p className="mb-5 text-sm text-stone-500">
                {animals.total} compañeros · Todos merecen una oportunidad
            </p>
            {animals.data.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {animals.data.map((a) => (
                        <AnimalCard key={a.id} animal={a} />
                    ))}
                </div>
            ) : (
                <Empty>No encontramos animales con esos filtros.</Empty>
            )}
            <Pagination page={animals} />
        </Shell>
    );
}
