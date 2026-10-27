import { Head, Link } from '@inertiajs/react';
import { Shell, Title } from '@/Components/Shelter';
import ShelterForm from '@/Components/ShelterForm';
import { Refuge } from '@/types/shelter';

export default function ShelterProfile({ shelter }: { shelter: Refuge }) {
    return (
        <Shell internal>
            <Head title="Mi refugio" />
            <Title
                title={shelter.name}
                text="Actualizá la información que las familias ven antes de consultar por una adopción."
            >
                <Link className="btn-secondary" href={`/refugios/${shelter.slug}`}>
                    Ver perfil público
                </Link>
            </Title>
            <section className="card w-full">
                <ShelterForm shelter={shelter} admin />
            </section>
        </Shell>
    );
}
