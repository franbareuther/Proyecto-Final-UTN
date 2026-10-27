import { CSSProperties, useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import Icon from '@/Components/Icon';

const journeys = [
    {
        label: 'Quiero adoptar',
        title: 'Empezá por conocerlo.',
        intro: '',
        cta: 'Conocer a los animales',
        href: '/animales',
        note: 'Podés mirar los perfiles sin crear una cuenta.',
        steps: [
            {
                title: 'Mirá más allá de la foto',
                text: 'Explorá por especie, tamaño o refugio. En cada perfil encontrás su historia, su personalidad y los cuidados que necesita. Tomate el tiempo de pensar cómo sería convivir.',
                image: 'perro.jpg',
                alt: 'Un perro dorado sentado al aire libre, con una flor en la boca',
                caption: 'Lo que conviene saber',
                detail: 'Su carácter, sus cuidados y quién lo acompaña en el refugio.',
                tags: ['Personalidad', 'Cuidados', 'Refugio'],
                position: '50% 28%',
            },
            {
                title: 'Contá cómo es tu día a día',
                text: 'Cuando quieras solicitar una adopción, creá tu cuenta. Completá tus datos, cómo es tu vivienda y si convivís con otros animales. El refugio recibe la solicitud y la evalúa.',
                image: 'gato.jpg',
                alt: 'Un gato blanco y negro de ojos verdes mirando a la cámara',
                caption: 'Del otro lado está el refugio',
                detail: 'Tu vivienda y tu experiencia ayudan a evaluar la convivencia.',
                tags: ['Tu vivienda', 'Otros animales', 'Tu experiencia'],
                position: '50% 45%',
            },
            {
                title: 'Seguí la respuesta del refugio',
                text: 'En Mis solicitudes podés consultar el estado y el historial. Si el refugio aprueba tu solicitud, coordinan los siguientes pasos. La adopción se registra cuando se concreta.',
                image: 'perro-2.jpg',
                alt: 'Un perro fotografiado al aire libre',
                caption: 'Cada decisión queda registrada',
                detail: 'La aprobación y la adopción son momentos distintos del proceso.',
                tags: ['Solicitud', 'Evaluación', 'Adopción'],
                position: '50% 50%',
            },
        ],
    },
    {
        label: 'Soy refugio',
        title: 'El trabajo de cada día, organizado.',
        intro: 'Los animales, sus cuidados y las solicitudes tienen su lugar.',
        cta: 'Ingresar al panel',
        href: '/dashboard',
        note: 'El acceso del equipo lo habilita la administración de la red.',
        steps: [
            {
                title: 'Presentá a cada animal',
                text: 'Desde el panel cargás sus fotos, su historia, su personalidad y su disponibilidad. También podés actualizar la información del refugio que ven quienes quieren adoptar.',
                image: 'gato-2.jpg',
                alt: 'Un gato cierra los ojos mientras una persona le acaricia el mentón',
                caption: 'Un perfil que podés actualizar',
                detail: 'Fotos e información para que el adoptante pueda conocerlo.',
                tags: ['Fotos', 'Historia', 'Disponibilidad'],
                position: '50% 50%',
            },
            {
                title: 'Revisá las solicitudes',
                text: 'Leé la información de cada persona, revisá su solicitud y registrá la decisión. Una aprobación reserva al animal; cuando la adopción se concreta, la registrás desde el panel.',
                image: 'perro-2.jpg',
                alt: 'Un perro fotografiado al aire libre',
                caption: 'El refugio decide',
                detail: 'Los datos y el historial de cada solicitud quedan disponibles para el equipo.',
                tags: ['Evaluación', 'Estado', 'Historial'],
                position: '50% 50%',
            },
            {
                title: 'Llevá sus cuidados al día',
                text: 'Consultá la historia clínica y registrá controles, tratamientos y vacunas. La agenda permite revisar las dosis programadas y dejar constancia de su aplicación o cancelación.',
                image: 'perro.jpg',
                alt: 'Un perro dorado sentado al aire libre, con una flor en la boca',
                caption: 'Los cuidados también tienen historia',
                detail: 'Cada registro ayuda al equipo a continuar el seguimiento.',
                tags: ['Historia clínica', 'Controles', 'Dosis'],
                position: '50% 28%',
            },
        ],
    },
];

type Step = (typeof journeys)[number]['steps'][number];

function JourneyPhoto({ step, className = '' }: { step: Step; className?: string }) {
    return (
        <figure className={`about-photo ${className}`}>
            <div className="about-photo-frame">
                <img
                    key={step.image}
                    src={`/images/demo/${step.image}`}
                    alt={step.alt}
                    style={{ objectPosition: step.position }}
                    loading="lazy"
                    decoding="async"
                    width="1000"
                    height="1000"
                />
                <span className="about-photo-note">Fotografía ilustrativa</span>
            </div>
            <figcaption>
                <p className="about-caption-title">{step.caption}</p>
                <p className="about-caption-copy">{step.detail}</p>
                <ul className="about-photo-tags" aria-label="Información disponible">
                    {step.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                    ))}
                </ul>
            </figcaption>
        </figure>
    );
}

function Journey({
    item,
    journeyIndex,
    active,
    expanded,
    onSelect,
}: {
    item: (typeof journeys)[number];
    journeyIndex: number;
    active: number;
    expanded: boolean;
    onSelect: (index: number) => void;
}) {
    return (
        <div className="about-journey-layout">
            <div className="about-guide">
                <div className="about-guide-heading">
                    <h3>{item.title}</h3>
                    {item.intro && <p>{item.intro}</p>}
                </div>
                <div className="about-steps">
                    {item.steps.map((step, index) => {
                        const open = active === index && expanded;
                        const id = `about-${journeyIndex}-${index}`;
                        return (
                            <div key={step.title} className="about-step">
                                <h4>
                                    <button
                                        type="button"
                                        id={`${id}-trigger`}
                                        aria-expanded={open}
                                        aria-controls={`${id}-content`}
                                        onClick={() => onSelect(index)}
                                    >
                                        {step.title}
                                        <span className="about-toggle" aria-hidden="true">
                                            {open ? '−' : '+'}
                                        </span>
                                    </button>
                                </h4>
                                <div
                                    className="about-disclosure"
                                    data-open={open}
                                    id={`${id}-content`}
                                    role="region"
                                    aria-labelledby={`${id}-trigger`}
                                    aria-hidden={!open}
                                >
                                    <div>
                                        <p>{step.text}</p>
                                        {open && (
                                            <JourneyPhoto
                                                step={step}
                                                className="about-mobile-photo"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function About() {
    const track = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const scrollStep = useRef(0);
    const [journey, setJourney] = useState(0);
    const [active, setActive] = useState(0);
    const [expanded, setExpanded] = useState(true);
    const [panelHeight, setPanelHeight] = useState(0);

    useEffect(() => {
        const element = track.current;
        const content = panel.current;
        if (!element || !content) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const pinTop = parseFloat(getComputedStyle(content).top) || 0;
            const distance = element.offsetHeight - content.offsetHeight;
            if (distance <= 0) return;
            const progress = (pinTop - element.getBoundingClientRect().top) / distance;
            const next = Math.min(2, Math.max(0, Math.floor(progress * 3)));
            if (next !== scrollStep.current) {
                scrollStep.current = next;
                setActive(next);
                setExpanded(true);
            }
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const measure = () => {
            setPanelHeight(content.offsetHeight);
            schedule();
        };
        const observer = new ResizeObserver(measure);
        observer.observe(content);
        measure();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', measure);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', measure);
        };
    }, []);

    return (
        <section id="about" aria-labelledby="about-title" className="about-section">
            <div
                ref={track}
                className="about-scroll-track"
                style={{ '--about-panel-height': `${panelHeight}px` } as CSSProperties}
            >
                <div ref={panel} className="about-sticky-panel">
                    <header id="nosotros" className="about-header">
                        <h2 id="about-title">Conoce huellitas</h2>
                    </header>
                    <TabGroup
                        className="about-interactive"
                        selectedIndex={journey}
                        onChange={(index) => {
                            setJourney(index);
                            setActive(0);
                            setExpanded(true);
                            scrollStep.current = 0;
                            if (track.current && panel.current) {
                                const pinTop = parseFloat(getComputedStyle(panel.current).top) || 0;
                                window.scrollTo({
                                    top:
                                        window.scrollY +
                                        track.current.getBoundingClientRect().top -
                                        pinTop,
                                    behavior: 'instant',
                                });
                            }
                        }}
                    >
                        <div id="como-funciona" className="about-choose">
                            <TabList className="about-tabs" aria-label="Cómo funciona Huellitas">
                                {journeys.map((item, index) => (
                                    <Tab key={item.label} className="about-tab">
                                        <Icon
                                            name={index === 0 ? 'paw' : 'home'}
                                            className="h-5 w-5 shrink-0"
                                        />
                                        {item.label}
                                    </Tab>
                                ))}
                            </TabList>
                        </div>
                        <TabPanels className="about-panels">
                            {journeys.map((item, journeyIndex) => (
                                <TabPanel key={item.label} className="about-journey">
                                    <Journey
                                        item={item}
                                        journeyIndex={journeyIndex}
                                        active={active}
                                        expanded={expanded}
                                        onSelect={(index) => {
                                            setExpanded(active === index ? !expanded : true);
                                            setActive(index);
                                        }}
                                    />
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </TabGroup>
                    <JourneyPhoto
                        step={journeys[journey].steps[active]}
                        className="about-desktop-photo"
                    />
                </div>
            </div>
            <div className="about-action">
                <Link href={journeys[journey].href} className="btn rounded-full">
                    {journeys[journey].cta} <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <p>{journeys[journey].note}</p>
            </div>
        </section>
    );
}
