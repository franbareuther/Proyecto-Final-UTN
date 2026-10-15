import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// SSR contract tests only: browser interaction, responsive layout and email delivery are separate evidence.
let server;
before(async () => {
    server = await createServer({
        configFile: false,
        cacheDir: resolve('.local/e2-vite-' + process.pid),
        optimizeDeps: { noDiscovery: true, include: [] },
        publicDir: false,
        appType: 'custom',
        resolve: { alias: { '@': resolve('resources/js') } },
        esbuild: { jsx: 'automatic' },
        server: { middlewareMode: true, ws: false, hmr: false, watch: { ignored: ['**/*'] } },
    });
});
after(async () => {
    await server?.close();
});
const user = {
    id: 1,
    name: 'Ana',
    last_name: 'Demo',
    email: 'ana@example.test',
    role: 'adoptante',
};
const shelter = { id: 1, name: 'Refugio DEMO', slug: 'demo', active: false };
const animal = {
    id: 1,
    name: 'Animal de nombre extenso '.repeat(3),
    photo_url: '',
    availability_status: 'En proceso de adopción',
    shelter,
};
const application = {
    id: 1,
    status: 'Aprobada',
    created_at: '2026-10-15',
    animal,
    user,
    phone: '0000000000',
    address: 'Domicilio ficticio',
    housing_type: 'Casa',
    has_other_pets: false,
    previous_experience: 'Prueba',
    motivation: 'Prueba',
    history: [
        {
            id: 1,
            new_status: 'Aprobada',
            observations: 'Coordinar los próximos pasos.',
            created_at: '2026-10-15',
            internal_notes: 'SECRETO DE PRUEBA',
        },
    ],
};
async function render(component, props = {}, actor = null) {
    const module = await server.ssrLoadModule(`/resources/js/Pages/${component}.tsx`);
    return (
        await createInertiaApp({
            page: {
                component,
                props: {
                    auth: { user: actor },
                    errors: {},
                    flash: {},
                    shelterName: 'Huella',
                    ...props,
                },
                url: '/',
                version: 'test',
                clearHistory: false,
                encryptHistory: false,
            },
            resolve: () => module.default,
            setup: ({ App, props }) => createElement(App, props),
            render: renderToString,
        })
    ).body.replace(/<!--.*?-->/g, '');
}

test('recovery and confirmation screens show Spanish labels, controls and links', async () => {
    const forgot = await render('Auth/ForgotPassword');
    assert.match(forgot, /Recuperá tu acceso/);
    assert.match(forgot, /name="email" type="email" required=""/);
    assert.match(forgot, /Volver a ingresar/);
    const reset = await render('Auth/ResetPassword', {
        token: 'fictional-token',
        email: user.email,
    });
    assert.match(reset, /Confirmar contraseña/);
    assert.match(reset, /name="password_confirmation"/);
    const confirm = await render('Auth/ConfirmPassword', {}, user);
    assert.match(confirm, /Contraseña actual/);
    assert.doesNotMatch(confirm, /This is a secure area/);
    const verify = await render('Auth/VerifyEmail', { status: 'verification-link-sent' }, user);
    assert.match(verify, /Enviamos un nuevo enlace de verificación/);
    assert.match(verify, /Cerrar sesión/);
});

test('adopter detail explains reservation, keeps inactive refuge and hides internal notes', async () => {
    const html = await render('Adoptante/RequestDetail', { application }, user);
    // Discard Inertia's serialized input props: this assertion concerns visible output only.
    const visible = html.slice(html.indexOf('<div class="min-h-screen'));
    assert.match(visible, /La adopción todavía debe concretarse/);
    assert.match(visible, /El refugio está inactivo/);
    assert.match(visible, /Coordinar los próximos pasos/);
    assert.doesNotMatch(visible, /SECRETO DE PRUEBA|Nota interna del refugio|Evaluar solicitud/);
    assert.match(visible, /src="\/images\/animal-placeholder.svg"/);
});

test('own staff sees separate public and internal fields and definitive adoption action', async () => {
    const html = await render(
        'Adoptante/RequestDetail',
        { application },
        { ...user, role: 'admin' },
    );
    assert.match(html, /Motivo \/ próximos pasos \(visible para el adoptante\)/);
    assert.match(html, /Nota interna \(opcional, solo personal del refugio\)/);
    assert.match(html, /Registrar adopción definitiva/);
    assert.match(html, /Nota interna del refugio/);
    assert.match(html, /SECRETO DE PRUEBA/);
});

test('profile retains first and last name and current/new password fields', async () => {
    const html = await render('Profile/Edit', {}, user);
    for (const label of [
        'Nombre',
        'Apellido',
        'Correo electrónico',
        'Contraseña actual',
        'Nueva contraseña',
    ])
        assert.ok(html.includes(label));
    assert.match(html, /Datos personales/);
});
