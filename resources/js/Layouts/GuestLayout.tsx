import { PropsWithChildren } from 'react';
import { Shell } from '@/Components/Shelter';
export default function Guest({ children }: PropsWithChildren) {
    return (
        <Shell>
            <div className="card mx-auto max-w-lg">{children}</div>
        </Shell>
    );
}
