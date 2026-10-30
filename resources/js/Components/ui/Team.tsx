import Icon from '@/Components/Icon';
import { team, TeamMember } from '@/data/team';

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

function MemberCard({ member }: { member: TeamMember }) {
    const name = member.name?.trim() || null;
    return (
        <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-emerald-800">
            <div className="flex aspect-square items-center justify-center bg-emerald-50 text-emerald-900">
                {member.photo ? (
                    <img
                        src={member.photo}
                        alt={name ? `Fotografía de ${name}` : 'Fotografía de un integrante del equipo'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="400"
                    />
                ) : name ? (
                    <span
                        aria-hidden="true"
                        className="font-display text-5xl font-semibold tracking-tight"
                    >
                        {initials(name)}
                    </span>
                ) : (
                    <Icon name="paw" className="h-12 w-12 opacity-60" />
                )}
            </div>
            <div className="min-w-0 p-5">
                <p
                    className={
                        'break-words text-lg font-semibold tracking-tight ' +
                        (name ? 'text-emerald-950' : 'text-stone-500')
                    }
                >
                    {name || 'Integrante por confirmar'}
                </p>
                {member.role && (
                    <p className="mt-1 break-words text-sm text-stone-600">{member.role}</p>
                )}
            </div>
        </li>
    );
}

export default function Team() {
    return (
        <section id="equipo" aria-labelledby="team-title" className="scroll-mt-24 py-14 sm:py-20">
            <div className="mb-8 max-w-2xl sm:mb-10">
                <p className="text-sm font-semibold text-huella-clay">Nuestro equipo</p>
                <h2 id="team-title" className="section-heading mt-3">
                    Conocé a quienes hicieron posible este proyecto.
                </h2>
                <p className="mt-4 leading-relaxed text-stone-600">
                    Somos estudiantes de la UTN. Construimos Huellita con compromiso, cariño y
                    dedicación, convencidos de que cada animal merece un hogar y de que los
                    refugios merecen buenas herramientas para lograrlo.
                </p>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {team.map((member, index) => (
                    <MemberCard key={member.name || index} member={member} />
                ))}
            </ul>
        </section>
    );
}
