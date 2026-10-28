import { Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

export default function WhoWeAre() {
    return (
        <section id="sobre-huellitas" aria-labelledby="who-we-are-title" className="who-we-are">
            <header className="who-we-are-header">
                <span>Quiénes somos</span>
                <span>Proyecto final · UTN</span>
            </header>
            <div className="who-we-are-main">
                <div className="who-we-are-intro">
                    <h2 id="who-we-are-title">Somos <span>huellitas.</span></h2>
                    <p>
                        Un equipo que está construyendo una herramienta para refugios y personas
                        que quieren adoptar. El proyecto nació en la UTN, con una pregunta concreta:
                        ¿cómo reunir los animales, sus cuidados y las solicitudes en un mismo lugar?
                    </p>
                </div>
                <figure className="who-we-are-photo">
                    <div className="who-we-are-photo-crop">
                        <img
                            src="/images/demo/gato-2.jpg"
                            alt="Un gato cierra los ojos mientras una persona le acaricia el mentón"
                            width="800"
                            height="533"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <figcaption>
                        <span>Hay un refugio detrás de cada perfil.</span>
                        <span>Foto ilustrativa</span>
                    </figcaption>
                </figure>
            </div>
            <div className="who-we-are-bottom">
                <div>
                    <h3>Qué hacemos</h3>
                    <p>
                        Acercamos los animales a quienes quieren conocerlos. Para los refugios,
                        reunimos las solicitudes, las adopciones y el seguimiento de sus cuidados.
                    </p>
                </div>
                <div>
                    <h3>El refugio decide</h3>
                    <p>
                        Su equipo conoce al animal, evalúa cada solicitud y coordina la adopción.
                        Nosotros ponemos la herramienta.
                    </p>
                </div>
                <Link href="#contacto" className="who-we-are-contact">
                    <span>¿Querés sumar tu refugio<br />o contarnos una idea?</span>
                    <span className="who-we-are-contact-label">
                        Escribinos <Icon name="arrow" className="h-6 w-6" />
                    </span>
                </Link>
            </div>
        </section>
    );
}
