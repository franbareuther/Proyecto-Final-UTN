export interface Person {
    id: number;
    name: string;
    last_name: string;
    email: string;
    email_verified_at?: string;
    role: 'superadmin' | 'admin' | 'adoptante';
}
export interface Photo {
    id: number;
    file_path: string;
    is_primary: boolean;
}
export interface Refuge {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    city: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
    staff?: Person[];
}
export interface Animal {
    shelter?: Refuge;
    id: number;
    name: string;
    species: string;
    breed: string;
    sex: string;
    birth_date: string | null;
    estimated_age: number | null;
    size: string;
    color: string;
    description: string;
    personality: string;
    entry_date: string;
    availability_status: string;
    public_health_info: string;
    photo_url: string;
    photos: Photo[];
}
export interface Page<T> {
    data: T[];
    total: number;
    from?: number | null;
    to?: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}
export interface Application {
    id: number;
    animal: Animal;
    user: Person;
    status: string;
    created_at: string;
    phone: string;
    address: string;
    housing_type: string;
    has_other_pets: boolean;
    previous_experience: string;
    motivation: string;
    additional_information: string;
    history: {
        id: number;
        new_status: string;
        observations: string;
        created_at: string;
        actor: Person;
    }[];
}
export interface Adoption {
    id: number;
    animal: Animal;
    user: Person;
    adoption_date: string;
}
export interface MedicalRecord {
    id: number;
    recorded_by: number;
    practitioner_name?: string | null;
    updated_by?: number | null;
    recorder?: Person;
    animal?: Animal;
    [key: string]: unknown;
}
export type Shared = {
    auth: { user: Person | null };
    flash: { success?: string; error?: string };
    shelterName: string;
    currentShelter?: Refuge | null;
    [key: string]: unknown;
};
