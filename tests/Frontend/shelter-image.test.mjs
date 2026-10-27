import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

// Rendered component contracts; no browser, file selection or network events are simulated here.
let server;
before(async () => {
    server = await createServer({
        configFile: false,
        cacheDir: `.local/shelter-image-vite-${process.pid}`,
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
const refuge = {
    id: 3,
    slug: 'sur',
    name: 'Refugio de nombre extenso '.repeat(3),
    city: 'Rosario',
    active: true,
    description: 'Historia pública.',
    image_url: '/storage/shelters/logo.png',
    image_type: 'logo',
};
async function render(component, props) {
    const module = await server.ssrLoadModule(`/resources/js/Pages/${component}.tsx`);
    return (
        await createInertiaApp({
            page: {
                component,
                props: {
                    auth: { user: null },
                    flash: {},
                    errors: {},
                    shelterName: 'Huellitas',
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
    ).body;
}

test('all three public locations render the institution image, name and destination', async () => {
    for (const [component, props] of [
        ['Public/Home', { animals: [], refuges: [refuge] }],
        ['Public/Shelters', { shelters: { data: [refuge], total: 1, links: [] }, filters: {} }],
        ['Public/Shelter', { shelter: refuge }],
    ]) {
        const html = await render(component, props);
        assert.match(html, /src="\/storage\/shelters\/logo.png"/);
        assert.ok(html.includes(`alt="Logo de ${refuge.name}"`));
        assert.ok(html.includes('Rosario'));
        assert.match(html, /href="\/refugios\/sur(?:\/animales)?"/);
    }
});

test('the image component has an accessible photo label and preserves an empty presentation', async () => {
    const { default: Image } = await server.ssrLoadModule(
        '/resources/js/Components/ShelterImage.tsx',
    );
    const photo = renderToStaticMarkup(
        createElement(Image, { src: '/photo.jpg', name: 'Sur', kind: 'photo' }),
    );
    assert.match(photo, /alt="Fotografía de Sur"/);
    const empty = renderToStaticMarkup(createElement(Image, { name: 'Sur' }));
    assert.doesNotMatch(empty, /<img/);
    assert.match(empty, /Refugio de la red Huellitas/);
});

test('both management consumers expose upload, presentation and reversible removal', async () => {
    for (const component of ['Admin/ShelterProfile', 'Superadmin/Shelters']) {
        const html = await render(
            component,
            component.startsWith('Admin/') ? { shelter: refuge } : { shelters: [refuge] },
        );
        assert.match(html, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
        assert.match(html, /name="image_type"/);
        assert.match(html, /hasta 5 MB/);
        // Superadmin initially shows the create form, admin shows its existing image.
        if (component.startsWith('Admin/')) {
            assert.match(html, /Quitar imagen al guardar/);
            assert.match(html, /src="\/storage\/shelters\/logo.png"/);
        }
    }
});
