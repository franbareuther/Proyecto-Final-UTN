import { Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

export default function PublicFooter({
    catalogUrl,
    scoped,
    signedIn,
    shelterName,
}: {
    catalogUrl: string;
    scoped: boolean;
    signedIn: boolean;
    shelterName: string;
}) {
    return (
        <footer className="illustrated-footer">
            <div className="footer-scene">
                <div className="site-gutter footer-content">
                    <div className="footer-intro">
                        <Link href="/" className="footer-brand" aria-label="Huellita, inicio">
                            <Icon name="paw" className="h-7 w-7" />
                            <span>huellita.</span>
                        </Link>
                        <p>
                            Un encuentro puede cambiar dos vidas. Acompañamos el camino hacia una
                            adopción responsable.
                        </p>
                        <div className="footer-credit">
                            <span>{shelterName} · Adopciones y refugios.</span>
                            <span>Proyecto final · UTN</span>
                        </div>
                    </div>
                    <nav aria-label="Enlaces de adopción">
                        <h2>Encontrá tu compañero</h2>
                        <Link href={catalogUrl}>
                            {scoped ? 'Animales del refugio' : 'Animales en adopción'}
                        </Link>
                        <Link href="/refugios">Refugios</Link>
                        <Link href="/#como-funciona">Cómo funciona la adopción</Link>
                    </nav>
                    <nav aria-label="Enlaces del refugio">
                        <h2>Sigamos en contacto</h2>
                        <Link href="/#contacto">Contacto</Link>
                        <Link href="/#sobre-huellitas">Sobre Huellita</Link>
                        <Link href="/creditos-fotografias">Créditos de fotografías</Link>
                        <Link href={signedIn ? '/dashboard' : '/login'}>
                            {signedIn ? 'Mi espacio' : 'Ingresar a mi cuenta'}
                        </Link>
                    </nav>
                </div>
                <div className="footer-meadow" aria-hidden="true">
                    <img
                        src="/images/footer/companeros-paisaje-v3.png"
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>
        </footer>
    );
}
