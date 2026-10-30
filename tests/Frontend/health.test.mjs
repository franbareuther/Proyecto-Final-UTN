import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from 'vite';

let server;
before(async () => {
    server = await createServer({
        configFile: false,
        publicDir: false,
        appType: 'custom',
        cacheDir: `.local/e4-vite-${process.pid}`,
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
                    auth: { user: { id: 1, name: 'Ana', role: 'admin' } },
                    flash: {},
                    errors: {},
                    shelterName: 'Huellita',
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
const animal = {
    id: 5,
    name: 'Nombre extenso de demostración '.repeat(5),
    species: 'Gato',
    sex: 'Hembra',
    photos: [],
    consultations: [],
    vaccinations: [],
    treatments: [],
    controls: [],
};
const dose = {
    id: 8,
    animal_id: 5,
    source_vaccination_id: 2,
    scheduled_date: '2026-10-15',
    status: 'Pendiente',
    legacy_unverified: true,
    source: { id: 2, vaccine_name: 'Vacuna ficticia' },
};
const page = (data) => ({ data, total: data.length, links: [] });
test('archived history is read-only while preserving dose and audit evidence', async () => {
    const html = await render('Veterinaria/History', {
        animal,
        readOnly: true,
        doses: page([dose]),
        audits: page([
            {
                id: 1,
                record_type: 'vaccinations',
                record_id: 2,
                action: 'Corrección',
                actor: { name: 'Ana', last_name: 'Prueba' },
                created_at: '2026-10-15T12:00:00Z',
                before_values: { vaccine_name: 'Anterior' },
                after_values: { vaccine_name: 'Corregida' },
            },
        ]),
    });
    assert.match(html, /Antecedentes de solo lectura/);
    assert.match(html, /Trazabilidad interna/);
    assert.match(html, /Anterior/);
    assert.match(html, /Corregida/);
    assert.match(html, /sin cumplimiento histórico verificado/);
    assert.doesNotMatch(html, /Registrar aplicación o cancelación/);
    assert.doesNotMatch(html, /Editar \/ actualizar estado/);
    assert.doesNotMatch(html, /\+ Agregar/);
});
test('pending dose offers explicit application and cancellation but resolved doses do not', async () => {
    const pending = await render('Veterinaria/History', { animal, doses: page([dose]) });
    assert.match(pending, /Registrar aplicación o cancelación/);
    assert.match(pending, /Fecha real de aplicación/);
    assert.match(pending, /Confirmar aplicación real/);
    assert.match(pending, /Otra próxima dosis \(solo si fue indicada\)/);
    const done = await render('Veterinaria/History', {
        animal,
        doses: page([
            { ...dose, status: 'Cancelada', cancellation_reason: 'Programación revisada' },
        ]),
    });
    assert.match(done, /Programación revisada/);
    assert.doesNotMatch(done, /Confirmar aplicación real/);
});
test('agenda distinguishes today, overdue, completion and archived read-only destinations', async () => {
    const html = await render('Veterinaria/Controls', {
        controls: page([
            {
                id: 1,
                animal: { ...animal, deleted_at: '2026-10-14' },
                scheduled_date: '2026-10-15',
                status: 'Pendiente',
                control_type: 'Revisión',
            },
            {
                id: 2,
                animal,
                scheduled_date: '2026-10-14',
                status: 'Pendiente',
                control_type: 'Anterior',
            },
        ]),
        doses: page([dose]),
        today: '2026-10-15',
        filters: { bucket: 'today' },
    });
    assert.match(html, />Hoy</);
    assert.match(html, />Vencido</);
    assert.match(html, /Archivado · Solo lectura/);
    assert.match(html, /href="\/veterinaria\/5"/);
    assert.match(html, /value="today" selected=""/);
    assert.match(html, /Realizados \/ Aplicadas/);
});
test('empty agenda and archive search retain useful exits and labels', async () => {
    const html = await render('Veterinaria/Controls', {
        controls: page([]),
        doses: page([]),
        today: '2026-10-15',
    });
    assert.match(html, /No hay controles con este filtro/);
    assert.match(html, /No hay dosis con este filtro/);
    assert.match(html, /Limpiar filtro/);
    const index = await render('Veterinaria/Index', {
        animals: page([
            {
                ...animal,
                deleted_at: '2026-10-14',
                availability_status: 'Adoptado',
                size: 'Mediano',
            },
        ]),
        filters: { archive: 'archived' },
    });
    assert.match(index, /Archivados \(solo lectura\)/);
    assert.ok(index.includes(animal.name));
    assert.match(index, /value="archived" selected=""/);
});
