import { useForm } from '@inertiajs/react';
import { ArrowUpRight, Check, Clock, MapPin } from 'lucide-react';
import { Field } from '@/Components/Shelter';

// Oficina ficticia sobre una calle real, a metros de Parque Rivadavia, para que Google Maps la ubique.
const OFFICE_ADDRESS = 'Av. Rivadavia 5000, Caballito, CABA';
const OFFICE_QUERY = encodeURIComponent(OFFICE_ADDRESS);

export default function ContactWithDog() {
    const form = useForm({ name: '', email: '', phone: '', subject: 'Consulta general', message: '' });

    return (
        <section id="contacto" aria-labelledby="contact-title" className="contact-section">
            <header className="contact-heading">
                <h2 id="contact-title">Contactanos</h2>
                <p>
                    ¿Tenés una pregunta o querés sumar tu refugio a la red? Nos encantará conocerte.
                </p>
            </header>
            <div className="contact-grid">
                <div className="contact-aside">
                    <div>
                        <h3>Estamos del otro lado.</h3>
                        <p>
                            Contanos tu idea, tu duda o cómo podemos acompañarte. Cada encuentro
                            puede ser el comienzo de algo lindo.
                        </p>
                    </div>
                    <div className="contact-dog" aria-hidden="true">
                        <div className="contact-dog-run" />
                    </div>
                </div>
                <form
                    className="contact-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/contacto', {
                            preserveScroll: true,
                            onSuccess: () => form.reset(),
                        });
                    }}
                >
                    <div>
                        <h3>Escribinos</h3>
                    </div>
                    {form.wasSuccessful && (
                        <div className="contact-success" role="status">
                            <Check size={20} aria-hidden="true" />
                            <span>¡Gracias por escribirnos! Tu consulta quedó registrada.</span>
                        </div>
                    )}
                    <div className="contact-fields">
                        <Field label="Tu nombre" error={form.errors.name}>
                            <input
                                name="name"
                                autoComplete="name"
                                required
                                maxLength={100}
                                placeholder="¿Cómo te llamás?"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                            />
                        </Field>
                        <Field label="Tu correo" error={form.errors.email}>
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                required
                                maxLength={254}
                                placeholder="vos@ejemplo.com"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Tu teléfono" error={form.errors.phone}>
                        <input
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            required
                            maxLength={32}
                            placeholder="Ej.: +54 9 11 1234 5678"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                        />
                    </Field>
                    <Field label="¿Sobre qué querés conversar?" error={form.errors.subject}>
                        <select
                            name="subject"
                            value={form.data.subject}
                            onChange={(event) => form.setData('subject', event.target.value)}
                        >
                            <option>Consulta general</option>
                            <option>Sumar mi refugio</option>
                            <option>Ayuda con la plataforma</option>
                            <option>Propuesta de colaboración</option>
                        </select>
                    </Field>
                    <Field label="Tu mensaje" error={form.errors.message}>
                        <textarea
                            name="message"
                            required
                            minLength={10}
                            maxLength={5000}
                            rows={3}
                            placeholder="Contanos un poquito más…"
                            value={form.data.message}
                            onChange={(event) => form.setData('message', event.target.value)}
                        />
                    </Field>
                    <div className="contact-submit-row">
                        <button className="btn" disabled={form.processing} type="submit">
                            {form.processing ? 'Enviando…' : 'Enviar mensaje'}
                            <ArrowUpRight size={18} aria-hidden="true" />
                        </button>
                    </div>
                </form>
            </div>
            <div className="contact-location">
                <div className="contact-location-info">
                    <h3>Dónde estamos</h3>
                    <p>
                        <MapPin size={18} aria-hidden="true" />
                        <span>{OFFICE_ADDRESS}</span>
                    </p>
                    <p>
                        <Clock size={18} aria-hidden="true" />
                        <span>Lunes a viernes, de 10 a 18 h</span>
                    </p>
                    <a
                        className="text-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${OFFICE_QUERY}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Abrir en Google Maps <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                </div>
                <iframe
                    className="contact-map"
                    title="Mapa con la ubicación de nuestra oficina"
                    src={`https://www.google.com/maps?q=${OFFICE_QUERY}&z=16&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
            </div>
        </section>
    );
}
