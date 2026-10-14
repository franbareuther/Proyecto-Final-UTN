import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// Renderiza los componentes reales sin navegador. No acredita responsive ni interacción.
let server;
let components;
const animal = {
    id: 7,
    name: 'Mora',
    species: 'Gato',
    breed: 'Mestizo',
    sex: 'Hembra',
    birth_date: '2024-01-10',
    estimated_age: 99,
    size: 'Pequeño',
    color: 'Marrón',
    description: 'Una historia de prueba.',
    personality: 'Tranquila',
    entry_date: '2025-01-01',
    availability_status: 'Disponible',
    public_health_info: 'Cuidados públicos de prueba.',
    photo_url: '/storage/animals/mora.jpg',
    photos: [
        { id: 1, file_path: 'animals/mora.jpg', is_primary: true },
        { id: 2, file_path: 'animals/mora-2.jpg', is_primary: false },
    ],
};
const page = (data, total = data.length) => ({
    data,
    total,
    links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '/animales?page=1', label: '1', active: true },
        { url: null, label: 'Next &raquo;', active: false },
    ],
});

before(async () => {
    server = await createServer({
        configFile: false,
        publicDir: false,
        appType: 'custom',
        resolve: { alias: { '@': resolve('resources/js') } },
        esbuild: { jsx: 'automatic' },
        server: { middlewareMode: true, hmr: false, watch: { ignored: ['**/*'] } },
    });
    components = await server.ssrLoadModule('/resources/js/Components/Shelter.tsx');
});
after(async () => {
    await server?.close();
});

async function renderPage(component, props, user = null, url = '/animales') {
    const module = await server.ssrLoadModule(`/resources/js/Pages/${component}.tsx`);
    const result = await createInertiaApp({
        page: {
            component,
            props: { auth: { user }, flash: {}, errors: {}, shelterName: 'Huella', ...props },
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

test('el campo vincula etiqueta, control y error sin perder la descripción existente', () => {
    const html = renderToStaticMarkup(
        createElement(
            components.Field,
            { label: 'Nombre', error: 'Completá tu nombre' },
            createElement('input', { id: 'nombre', 'aria-describedby': 'ayuda' }),
        ),
    );
    assert.match(html, /for="nombre"/);
    assert.match(html, /id="nombre"[^>]*aria-describedby="ayuda nombre-error"/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /id="nombre-error"/);
    const generated = renderToStaticMarkup(
        createElement(
            components.Field,
            { label: 'Especie' },
            createElement('select', null, createElement('option', null, 'Gato')),
        ),
    );
    const id = generated.match(/<select id="([^"]+)"/)[1];
    assert.ok(generated.includes(`for="${id}"`));
});

test('los badges mantienen texto y distinguen disponible, en proceso y adoptado', () => {
    const available = renderToStaticMarkup(createElement(components.Badge, null, 'Disponible'));
    const processing = renderToStaticMarkup(
        createElement(components.Badge, null, 'En proceso de adopción'),
    );
    const adopted = renderToStaticMarkup(createElement(components.Badge, null, 'Adoptado'));
    assert.match(available, /bg-emerald-50/);
    assert.match(processing, /bg-amber-50/);
    assert.match(adopted, /bg-sky-50/);
    assert.match(processing, /En proceso de adopción/);
});

test('la tarjeta conserva enlace, foto y fecha real antes de edad estimada', () => {
    const html = renderToStaticMarkup(createElement(components.AnimalCard, { animal }));
    assert.match(html, /href="\/animales\/7"/);
    assert.match(html, /src="\/storage\/animals\/mora.jpg"/);
    assert.match(html, /Nació el/);
    assert.doesNotMatch(html, /99 meses/);
});

test('el catálogo mantiene filtros al quitar uno y ofrece salida del resultado vacío', async () => {
    const html = await renderPage('Public/Catalog', {
        animals: page([]),
        filters: { q: 'Mora', species: 'Gato' },
        breeds: ['Mestizo'],
    });
    assert.match(html, /aria-label="Quitar filtro Especie: Gato"/);
    assert.match(html, /href="\/animales\?q=Mora"/);
    assert.match(html, /Todavía no encontramos esa coincidencia/);
    assert.match(html, /Ver todos los animales/);
    assert.match(html, /name="q"/);
    for (const key of ['species', 'breed', 'size', 'age', 'status'])
        assert.ok(html.includes(`name="${key}"`));
});

test('la navegación anuncia página activa, acceso al contenido y estado inicial del menú', async () => {
    const html = await renderPage('Public/Catalog', {
        animals: page([animal]),
        filters: {},
        breeds: [],
    });
    assert.match(html, /href="#main"/);
    assert.ok(
        [...html.matchAll(/<a\b[^>]*>/g)].some(
            ([tag]) => tag.includes('href="/animales"') && tag.includes('aria-current="page"'),
        ),
    );
    assert.match(html, /aria-expanded="false" aria-controls="[^"]+" aria-label="Abrir menú"/);
});

test('la paginación conserva la búsqueda en sus enlaces y anuncia la página actual', () => {
    const html = renderToStaticMarkup(
        createElement(components.Pagination, {
            page: {
                ...page([animal], 30),
                links: [
                    { url: '/animales?q=Mora&page=1', label: '1', active: true },
                    { url: '/animales?q=Mora&page=2', label: 'Next &raquo;', active: false },
                ],
            },
        }),
    );
    assert.match(html, /aria-current="page"/);
    assert.match(html, /href="\/animales\?q=Mora&amp;page=2"/);
    assert.match(html, /Siguiente →/);
    assert.equal(
        renderToStaticMarkup(createElement(components.Pagination, { page: page([]) })),
        '',
    );
});

test('el perfil conserva disponibilidad y acceso a solicitud según el rol', async () => {
    const visitor = await renderPage('Public/Animal', { animal }, null, '/animales/7');
    assert.match(visitor, /href="\/animales\/7\/solicitar"/);
    assert.match(visitor, /aria-label="Ver foto 1 de Mora" aria-pressed="true"/);
    const admin = await renderPage(
        'Public/Animal',
        { animal },
        { id: 1, name: 'Equipo', role: 'admin' },
        '/animales/7',
    );
    assert.doesNotMatch(admin, /href="\/animales\/7\/solicitar"/);
    const adopted = await renderPage('Public/Animal', {
        animal: { ...animal, availability_status: 'Adoptado' },
    });
    assert.doesNotMatch(adopted, /href="\/animales\/7\/solicitar"/);
    assert.match(adopted, /Por el momento no recibe nuevas solicitudes/);
});

test('home y perfil toleran lista vacía, ausencia de fotos y nombres extensos', async () => {
    const home = await renderPage('Public/Home', { animals: [] }, null, '/');
    assert.match(home, /Pronto vas a conocer/);
    assert.match(home, /src="\/images\/animal-placeholder.svg"/);
    const profile = await renderPage('Public/Animal', {
        animal: { ...animal, name: 'Nombre largo '.repeat(12), photo_url: '', photos: [] },
    });
    assert.match(profile, /src="\/images\/animal-placeholder.svg"/);
    assert.match(profile, /Nombre largo/);
});

test('la paleta de marca supera contraste 4.5:1 para los pares usados en texto', (context) => {
    const css = readFileSync('resources/css/app.css', 'utf8');
    const color = (name) =>
        css.match(new RegExp(`--color-huella-${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
    const luminance = (hex) =>
        hex
            .slice(1)
            .match(/../g)
            .map((value) => parseInt(value, 16) / 255)
            .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    for (const [name, foreground, background] of [
        ['bosque / marfil', color('forest'), color('paper')],
        ['terracota / marfil', color('clay'), color('paper')],
        ['blanco / bosque', '#ffffff', color('forest')],
        ['terracota / fondo hero', color('clay'), '#e7eddf'],
    ]) {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        const ratio = (values[0] + 0.05) / (values[1] + 0.05);
        assert.ok(ratio >= 4.5, `${name}: ${ratio}`);
        context.diagnostic(`${name}: ${ratio.toFixed(2)}:1`);
    }
});
