import { useForm } from '@inertiajs/react';
import { ArrowUpRight, Check } from 'lucide-react';
import { Field } from '@/Components/Shelter';

export default function ContactWithDog() {
    const form = useForm({ name: '', email: '', subject: 'Consulta general', message: '' });

    return (
        <section id="contacto" aria-labelledby="contact-title" className="contact-section">
            <header className="contact-heading">
                <h2 id="contact-title">Contacto</h2>
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
        </section>
    );
}
