import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// Tests of rendered contracts only; browser interaction and layout need separate evidence.
let server;
before(async () => {
    server = await createServer({
        configFile: false,
        cacheDir: `.local/public-ux-vite-${process.pid}`,
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
const shelter = { id: 1, name: 'Patitas del Sur', slug: 'sur', active: true };
const page = { data: [], total: 0, links: [] };
async function render(component, props) {
    const module = await server.ssrLoadModule(`/resources/js/Pages/Public/${component}.tsx`);
    return (
        await createInertiaApp({
            page: {
                component: `Public/${component}`,
                props: {
                    auth: { user: null },
                    errors: {},
                    flash: {},
                    shelterName: 'Huellita',
                    ...props,
                },
                url: '/animales',
                version: 'test',
                clearHistory: false,
                encryptHistory: false,
            },
            resolve: () => module.default,
            setup: ({ App, props }) => createElement(App, props),
            render: renderToString,
        })
    ).body;
}

test('institution catalog never displays or propagates network filters as applied', async () => {
    const html = await render('Catalog', {
        shelter,
        catalogUrl: '/refugios/sur/animales',
        animals: page,
        filters: { q: 'Mora', species: 'Gato', shelter: 'norte', city: 'Ajena' },
        breeds: [],
    });
    assert.doesNotMatch(html, /Quitar filtro (Ciudad|Refugio)/);
    assert.doesNotMatch(html, /name="(city|shelter)"/);
    assert.match(html, /href="\/refugios\/sur\/animales\?q=Mora"/);
    assert.doesNotMatch(html, /href="[^"]*(shelter=norte|city=Ajena)/);
});

test('unknown URL option remains selected and removable when there are no results', async () => {
    const html = await render('Catalog', {
        animals: page,
        filters: { breed: 'Raza ajena' },
        breeds: ['Mestizo'],
    });
    assert.match(
        html.replace(/<!--.*?-->/g, ''),
        /<option value="Raza ajena" selected="">Raza ajena \(sin coincidencias\)<\/option>/,
    );
    assert.match(html, /Quitar filtro Raza: Raza ajena/);
});

test('network chip uses the institution name and footer links label their destinations', async () => {
    const html = await render('Catalog', {
        animals: page,
        filters: { shelter: 'sur' },
        breeds: [],
        refuges: [shelter],
    });
    const visible = html.replace(/<!--.*?-->/g, '');
    assert.match(visible, /Refugio: Patitas del Sur/);
    const footer = visible.slice(visible.indexOf('<footer'));
    assert.match(footer, /href="\/animales"[^>]*>Animales en adopción<\/a>/);
    assert.match(footer, /href="\/refugios"[^>]*>Refugios<\/a>/);
});

test('directory search exposes its label, type, name and maximum length', async () => {
    const html = await render('Shelters', { shelters: page, filters: { q: 'Rosario' } });
    assert.match(html, /type="search" name="q" maxLength="100"/);
    assert.match(html, /value="Rosario"/);
});
