export type TeamMember = {
    /** Nombre visible. Dejar null hasta confirmarlo: no se publican nombres supuestos. */
    name: string | null;
    /** Rol o área en el proyecto, opcional. */
    role?: string | null;
    /** Ruta pública de la foto, por ejemplo '/images/equipo/laureano.jpg'. */
    photo?: string | null;
};

// Para cargar a un integrante, completar su nombre y, si se desea, su rol y su foto
// (guardar la imagen en public/images/equipo/). Las tarjetas sin foto muestran sus iniciales.
export const team: TeamMember[] = [
    { name: 'Laureano' },
    { name: null },
    { name: null },
    { name: null },
];
