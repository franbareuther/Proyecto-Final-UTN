import { Head, Link } from '@inertiajs/react';
import { Application, Page } from '@/types/shelter';
import { Pagination, RequestList, Shell, Title } from '@/Components/Shelter';
export default function Requests({ requests }: { requests: Page<Application> }) {
    return (
        <Shell>
            <Head title="Mis solicitudes" />
            <Title
                title="Mis solicitudes"
                text="Cada historia tiene su tiempo. Seguí acá el estado de tus solicitudes."
            >
                <Link className="btn" href="/animales">
                    Explorar animales
                </Link>
            </Title>
            <RequestList requests={requests.data} />
            <Pagination page={requests} />
        </Shell>
    );
}
