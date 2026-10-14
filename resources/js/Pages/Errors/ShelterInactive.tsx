import { Head, Link } from '@inertiajs/react';
import { Shell, Title } from '@/Components/Shelter';

export default function ShelterInactive() {
    return (
        <Shell>
            <Head title="Refugio inactivo" />
            <Title
                title="El refugio está inactivo"
                text="Contactá a la administración de Huella para revisar su habilitación. Los animales y el historial se conservan."
            />
            <Link className="btn" href="/refugios">
                Conocer otros refugios
            </Link>
        </Shell>
    );
}
