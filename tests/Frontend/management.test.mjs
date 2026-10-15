import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// Component render contracts only; these tests do not exercise browser interactions.
let server;
before(async () => {
    server = await createServer({
        configFile: false,
        publicDir: false,
        appType: 'custom',
        cacheDir: `.local/e3-vite-${process.pid}`,
        optimizeDeps: { noDiscovery: true, include: [] },
        resolve: { alias: { '@': resolve('resources/js') } },
        esbuild: { jsx: 'automatic' },
        server: { middlewareMode: true, ws: false, hmr: false, watch: { ignored: ['**/*'] } },
    });
});
after(async () => {
    await server?.close();
});
async function render(component, props) {
    const module = await server.ssrLoadModule(`/resources/js/Pages/${component}.tsx`);
    return (
        await createInertiaApp({
            page: {
                component,
                props: {
                    auth: { user: { id: 1, role: 'admin', name: 'Ana', last_name: 'Prueba' } },
                    flash: {},
                    errors: {},
                    shelterName: 'Huella',
                    ...props,
                },
                url: '/superadmin/refugios?selected=3',
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
const refuge = {
    id: 3,
    slug: 'sur',
    name: 'Refugio de nombre extenso '.repeat(5),
    active: true,
    staff: [
        {
            id: 8,
            name: 'Ana',
            last_name: 'Prueba',
            email: 'ana@example.test',
            role: 'admin',
            suspended_at: '2026-10-15T00:00:00Z',
        },
    ],
};
const animal = {
    id: 21,
    name: 'Un nombre de animal extenso '.repeat(4),
    species: 'Gato',
    sex: 'Hembra',
    size: 'Mediano',
    color: 'Negro',
    description: 'Historia ficticia.',
    entry_date: '2026-10-15',
    availability_status: 'En proceso de adopción',
    photos: [{ id: 10, file_path: 'animals/photo.jpg', is_primary: true }],
};

test('selected institution exposes staff access editing and keeps refuge image management', async () => {
    const html = await render('Superadmin/Shelters', {
        shelters: [refuge],
        selectedShelter: refuge,
        filters: { q: 'Rosario', staff_state: 'suspended' },
    });
    assert.match(html, /Equipo del refugio/);
    assert.match(html, /Acceso suspendido/);
    assert.match(html, /Suspender acceso/);
    assert.match(html, /Cambiar el correo también revoca sesiones anteriores/);
    assert.match(html, /name="email"/);
    assert.match(html, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
    assert.doesNotMatch(html, /option value="(?:superadmin|veterinario)"/);
    assert.match(html, /value="Rosario"/);
    assert.match(html, /value="suspended" selected=""/);
});

test('animal edit renders protected availability, existing gallery and an initially empty file selector', async () => {
    const html = await render('Admin/AnimalForm', { animal });
    assert.match(html, /Estado actual: En proceso de adopción/);
    assert.match(html, /<select disabled=""/);
    assert.match(html, /name="photos\[\]"[^>]*type="file"[^>]*multiple=""/);
    assert.match(html, /hasta 8 por envío, 4 MB cada una/);
    assert.match(html, /src="\/storage\/animals\/photo.jpg"/);
    assert.match(html, /Imagen principal/);
    assert.doesNotMatch(html, /fotografías pendientes de guardar/);
});

test('archived search results retain identity and expose no edit or restoration action', async () => {
    const html = await render('Admin/Animals', {
        animals: { data: [{ ...animal, deleted_at: '2026-10-15' }], links: [] },
        filters: { q: 'Un nombre', species: 'Gato', archive: 'archived' },
    });
    assert.ok(html.includes(animal.name));
    assert.match(html, /value="archived" selected=""/);
    assert.match(html, /Historial conservado/);
    assert.doesNotMatch(html, /href="\/admin\/animales\/21\/edit"/);
    assert.doesNotMatch(html, />Archivar</);
    const empty = await render('Admin/Animals', { animals: { data: [], links: [] }, filters: {} });
    assert.match(empty, /No hay animales con estos criterios/);
    assert.match(empty, /Limpiar filtros/);
});

test('dashboard explains archived and clinical totals without changing their data contract', async () => {
    const html = await render('Admin/Dashboard', {
        stats: { 'Animales registrados': 4, 'Animales archivados': 2 },
        species: [],
        statuses: [],
        months: [],
        recentRequests: [],
        recentAdoptions: [],
        controls: [],
    });
    assert.match(html, /Animales sin archivar/);
    assert.match(html, /Animales archivados/);
    assert.match(html, /tratamiento/i);
    assert.match(html, /Próximos cuidados del refugio/);
});
