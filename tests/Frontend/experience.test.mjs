import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// Renderiza los componentes reales sin navegador. No acredita responsive ni interacción.
let server;
const shelter = { id: 3, name: 'Patitas del Sur', slug: 'patitas-del-sur', city: 'Quilmes', phone: '11 5555 0000', email: 'hola@patitas.test', active: true };
const animal = {
    id: 7, name: 'Mora', species: 'Gato', breed: null, sex: 'Hembra', birth_date: null, estimated_age: 24,
    size: 'Pequeño', color: 'Marrón', description: 'Llegó al refugio en invierno.', personality: 'Tranquila',
    entry_date: '2026-05-01', availability_status: 'Disponible', public_health_info: 'Vacunas al día.',
    photo_url: '/storage/animals/mora.jpg', photos: [], shelter,
};
const emptyPage = { data: [], total: 0, links: [] };

before(async () => {
    server = await createServer({
        configFile: false,
        cacheDir: `.local/experience-vite-${process.pid}`,
        publicDir: false,
        appType: 'custom',
        resolve: { alias: { '@': resolve('resources/js') } },
        esbuild: { jsx: 'automatic' },
        server: { middlewareMode: true, hmr: false, watch: { ignored: ['**/*'] } },
    });
});
after(async () => {
    await server?.close();
});

async function renderPage(component, props, user = null, url = '/') {
    const module = await server.ssrLoadModule(`/resources/js/Pages/${component}.tsx`);
    const result = await createInertiaApp({
        page: {
            component,
            props: { auth: { user }, flash: {}, errors: {}, shelterName: 'Huellita', ...props },
            url,
            version: 'test',
            clearHistory: false,
            encryptHistory: false,
        },
        resolve: () => module.default,
        setup: ({ App, props }) => createElement(App, props),
        render: renderToString,
    });
    return result.body;
}

test('el catálogo presenta la red y se adapta al refugio elegido', async () => {
    const network = await renderPage('Public/Catalog', { animals: emptyPage, filters: {}, breeds: [] }, null, '/animales');
    assert.match(network, /Conocé a nuestros amigos (?:<!-- -->)?<span[^>]*>que buscan un hogar\.<\/span>/);
    assert.match(network, /está esperando una oportunidad para formar parte de una familia/);
    assert.match(network, /Buscar por nombre/);

    const scoped = await renderPage('Public/Catalog', { animals: emptyPage, filters: {}, breeds: [], shelter }, null, '/refugios/patitas-del-sur/animales');
    assert.match(scoped, /Conocé a los amigos de Patitas del Sur/);
    assert.match(scoped, /Animales en adopción en Quilmes/);
    assert.doesNotMatch(scoped, /de toda la red/);
});

test('Somos Huellita presenta a los cuatro integrantes sin una sección aparte', async () => {
    const { default: WhoWeAre } = await server.ssrLoadModule('/resources/js/Components/ui/WhoWeAre.tsx');
    const html = renderToStaticMarkup(createElement(WhoWeAre));
    assert.match(html, /Somos <span>Huellita\.<\/span>/);
    for (const name of ['Laureano Beltrami', 'Francisco Bareuther', 'Leon Comolli', 'Luciano Brea']) {
        assert.match(html, new RegExp(`${name}</li>`));
    }
    const home = await renderPage('Public/Home', { animals: [], refuges: [] });
    assert.doesNotMatch(home, /id="equipo"|Nuestro equipo/);
});

test('los catálogos, refugios y paneles usan el cuadriculado de la landing', async () => {
    const catalog = await renderPage('Public/Catalog', { animals: emptyPage, filters: {}, breeds: [] }, null, '/animales');
    const refuges = await renderPage('Public/Shelters', { shelters: emptyPage, filters: {} }, null, '/refugios');
    const refuge = await renderPage('Public/Shelter', { shelter }, null, '/refugios/patitas-del-sur');
    const panel = await renderPage('Admin/Dashboard', { shelter, stats: {}, species: [], statuses: [], months: [], recentRequests: [], recentAdoptions: [], controls: [] }, { id: 1, role: 'admin', shelter_id: 3 }, '/admin');
    for (const html of [catalog, refuges, refuge, panel]) assert.match(html, /class="min-h-screen [a-z-]+ grid-backdrop"/);
    const login = await renderPage('Auth/Login', {}, null, '/login');
    assert.doesNotMatch(login, /grid-backdrop/);
});

test('el panel da la bienvenida con el nombre del refugio recibido', async () => {
    const props = { shelter, stats: { 'Animales registrados': 4 }, species: [], statuses: [], months: [], recentRequests: [], recentAdoptions: [], controls: [] };
    const html = await renderPage('Admin/Dashboard', props, { id: 1, role: 'admin', shelter_id: 3, name: 'Ana', last_name: 'Gómez' }, '/admin');
    assert.match(html, /¡Bienvenido, (?:<!-- -->)?Patitas del Sur(?:<!-- -->)?!/);
    assert.match(html, /href="\/admin\/animales\/create"/);
    assert.match(html, />huellita</);
    assert.doesNotMatch(html, /huellitas|>huella</i);
});

test('el registro de refugios pide los datos obligatorios con validación nativa', async () => {
    const html = await renderPage('Auth/RegisterShelter', {}, null, '/registro-refugio');
    for (const name of ['shelter_name', 'city', 'phone', 'name', 'last_name', 'email', 'password', 'password_confirmation']) {
        assert.match(html, new RegExp(`name="${name}"[^>]*required`), `${name} debe ser obligatorio`);
    }
    assert.match(html, /<textarea[^>]*name="description"[^>]*required[^>]*minLength="20"/);
    assert.match(html, /name="instagram"[^>]*type="url"|type="url"[^>]*name="instagram"/);
    assert.match(html, /accept="image\/jpeg,image\/png,image\/webp"/);
});

test('el perfil del animal separa la salud pública de la historia clínica', async () => {
    const visitor = await renderPage('Public/Animal', { animal }, null, '/refugios/patitas-del-sur/animales/7');
    assert.match(visitor, /Mi historia/);
    assert.match(visitor, /Me cuida/);
    assert.match(visitor, /Vacunas al día\./);
    assert.match(visitor, /Sin especificar/);
    assert.doesNotMatch(visitor, /Historia clínica|Editar ficha/);

    const own = await renderPage('Public/Animal', { animal }, { id: 1, role: 'admin', shelter_id: 3 }, '/refugios/patitas-del-sur/animales/7');
    assert.match(own, /href="\/veterinaria\/7"/);
    assert.match(own, /href="\/admin\/animales\/7\/edit"/);

    const foreign = await renderPage('Public/Animal', { animal }, { id: 2, role: 'admin', shelter_id: 9 }, '/refugios/patitas-del-sur/animales/7');
    assert.doesNotMatch(foreign, /Editar ficha/);
});
