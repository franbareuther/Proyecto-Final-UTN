import { Head, Link } from '@inertiajs/react';
import { Application, Page } from '@/types/shelter';
import { Empty, Pagination, RequestList, Shell, Title } from '@/Components/Shelter';
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
            {requests.data.length ? (
                <RequestList requests={requests.data} />
            ) : (
                <Empty>
                    <Link href="/animales" className="btn">
                        Explorar animales en adopción
                    </Link>
                </Empty>
            )}
            <Pagination page={requests} />
        </Shell>
    );
}
