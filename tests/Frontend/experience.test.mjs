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

// React separa texto fijo y variables con <!-- --> al renderizar en el servidor.
const plain = async (html) => (await html).replaceAll('<!-- -->', '');

const application = {
    id: 5, status: 'Aprobada', created_at: '2026-10-20T10:00:00Z', phone: '1155551234', address: 'Calle 123', housing_type: 'Casa',
    has_other_pets: false, previous_experience: 'Sí', motivation: 'Un hogar', additional_information: null, history: [], adoption: null,
    animal, user: { id: 2, name: 'Ana', last_name: 'Gómez', email: 'ana@test', role: 'adoptante' },
};
const conversation = {
    id: 5, status: 'Aprobada', counterpart: 'Patitas del Sur', requestUrl: '/solicitudes/5', followUpUrl: null,
    animal: { id: 7, name: 'Mora', photo_url: '/storage/animals/mora.jpg' },
    open: true, preAdoption: true, limitHours: 48, deadline: '2026-10-30T12:00:00Z',
    messages: [
        { id: 1, type: 'message', body: '¿Coordinamos una visita?', created_at: '2026-10-28T12:00:00Z', user_id: 1, author: { id: 1, name: 'Equipo', last_name: 'Patitas', role: 'admin' } },
        { id: 2, type: 'warning', body: 'Aviso: el refugio está esperando tu respuesta.', created_at: '2026-10-29T12:00:00Z', user_id: null, author: null },
    ],
};

test('la burbuja de chat aparece en el panel del refugio y para adoptantes, no para visitantes ni superadmin', async () => {
    const adopter = await plain(renderPage('Public/Catalog', { animals: emptyPage, filters: {}, breeds: [] }, { id: 2, role: 'adoptante' }, '/animales'));
    assert.match(adopter, /aria-label="Abrir mensajes"/);
    const panel = await plain(renderPage('Admin/Dashboard', { shelter, stats: {}, species: [], statuses: [], months: [], recentRequests: [], recentAdoptions: [], controls: [] }, { id: 1, role: 'admin', shelter_id: 3 }, '/admin'));
    assert.match(panel, /aria-label="Abrir mensajes"/);
    const guest = await plain(renderPage('Public/Catalog', { animals: emptyPage, filters: {}, breeds: [] }, null, '/animales'));
    assert.doesNotMatch(guest, /Abrir mensajes/);
    const supervision = await plain(renderPage('Adoptante/RequestDetail', { application }, { id: 9, role: 'superadmin' }, '/superadmin/solicitudes/5'));
    assert.doesNotMatch(supervision, /Abrir mensajes|Abrir chat/);

    const detail = await plain(renderPage('Adoptante/RequestDetail', { application, chatDeadline: '2026-10-30T12:00:00Z' }, { id: 2, role: 'adoptante' }, '/solicitudes/5'));
    assert.match(detail, /Conversación con el refugio/);
    assert.match(detail, /Tenés tiempo para responder hasta el/);
    assert.match(detail, /Abrir chat/);
});

test('la conversación muestra mensajes, avisos automáticos y el plazo de respuesta', async () => {
    const { Conversation } = await server.ssrLoadModule('/resources/js/Components/ChatBubble.tsx');
    const props = { userId: 2, admin: false, sending: false, error: null, onSend: async () => true };
    const html = renderToStaticMarkup(createElement(Conversation, { ...props, conversation })).replaceAll('<!-- -->', '');
    assert.match(html, /Equipo Patitas · Refugio/);
    assert.match(html, /Aviso automático/);
    assert.match(html, /El refugio espera tu respuesta hasta el/);
    assert.match(html, /<textarea[^>]*id="chat-body"/);

    const closed = renderToStaticMarkup(createElement(Conversation, { ...props, conversation: { ...conversation, status: 'Rechazada', open: false, preAdoption: false, deadline: null } }));
    assert.match(closed, /ya no se pueden enviar mensajes/);
    assert.doesNotMatch(closed, /id="chat-body"/);
    assert.doesNotMatch(closed, /Seguimiento/);
});

test('el botón Seguimiento del chat se habilita recién con la adopción', async () => {
    const { Conversation } = await server.ssrLoadModule('/resources/js/Components/ChatBubble.tsx');
    const props = { userId: 2, admin: false, sending: false, error: null, onSend: async () => true };
    const before = renderToStaticMarkup(createElement(Conversation, { ...props, conversation: { ...conversation, followUpPending: null } }));
    assert.match(before, /<button[^>]*disabled=""[^>]*>Seguimiento<\/button>/);
    assert.match(before, /Se habilita cuando se registre la adopción/);

    const adopted = { ...conversation, status: 'Adoptado', preAdoption: false, deadline: null, followUpUrl: '/adopciones/4/seguimiento', followUpPending: 1 };
    const after = renderToStaticMarkup(createElement(Conversation, { ...props, conversation: adopted })).replaceAll('<!-- -->', '');
    assert.match(after, /<a[^>]*href="\/adopciones\/4\/seguimiento"[^>]*>Seguimiento/);
    assert.match(after, /1 control listo para cargar fotos y vacunas/);
    assert.doesNotMatch(after, /disabled=""[^>]*>Seguimiento/);
});

test('el seguimiento lista los controles y habilita la carga de las cuatro fotos', async () => {
    const checkin = (sequence, due, extra = {}) => ({ id: sequence, sequence, due_date: due, submitted_at: null, comment: null, reviewed_at: null, shelter_note: null, photos: [], ...extra });
    const adoption = {
        id: 4, adoption_request_id: 5, adoption_date: '2026-10-23', animal, user: application.user, certificates: [],
        checkins: [
            checkin(1, '2026-10-30'),
            checkin(2, '2026-10-20', { submitted_at: '2026-10-20T10:00:00Z', photos: [{ id: 11, category: 'Jugando' }] }),
            checkin(5, '2026-12-23'),
        ],
    };
    const props = { adoption, categories: ['Jugando', 'Durmiendo', 'Comiendo', 'Convivencia'], opensDaysBefore: 7, today: '2026-10-30' };
    const html = await plain(renderPage('FollowUp/Show', { ...props, canSubmit: true, canReview: false }, { id: 2, role: 'adoptante' }, '/adopciones/4/seguimiento'));
    assert.match(html, /Seguimiento de Mora/);
    assert.match(html, /Control 1 · Semana 1/);
    assert.match(html, /Control 5 · Mes 2/);
    assert.match(html, /Enviar control 1/);
    assert.doesNotMatch(html, /Enviar control 5/);
    assert.match(html, /src="\/adopciones\/4\/archivos\/fotos\/11"/);
    assert.match(html, /Foto de la hoja firmada por el veterinario/);

    const shelter = await plain(renderPage('FollowUp/Show', { ...props, canSubmit: false, canReview: true }, { id: 1, role: 'admin', shelter_id: 3 }, '/adopciones/4/seguimiento'));
    assert.match(shelter, /Marcar como revisado/);
    assert.doesNotMatch(shelter, /Enviar control/);
});
