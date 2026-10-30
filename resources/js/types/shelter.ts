export interface Person {
    id: number;
    name: string;
    last_name: string;
    email: string;
    email_verified_at?: string;
    role: 'superadmin' | 'admin' | 'adoptante';
    shelter_id?: number | null;
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
    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    active: boolean;
    staff?: Person[];
    image_url?: string | null;
    image_type?: 'photo' | 'logo';
}
export interface Animal {
    deleted_at?: string | null;
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
    adoption?: { id: number } | null;
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
    adoption_request_id?: number;
    animal: Animal;
    user: Person;
    adoption_date: string;
}
export interface ChatMessage {
    id: number;
    type: 'message' | 'warning' | 'system';
    body: string;
    created_at: string;
    user_id: number | null;
    author: Pick<Person, 'id' | 'name' | 'last_name' | 'role'> | null;
}
type ChatAnimal = Pick<Animal, 'id' | 'name' | 'photo_url'>;
export interface ChatSummary {
    id: number;
    status: string;
    animal: ChatAnimal;
    counterpart: string;
    last: { body: string; type: ChatMessage['type']; created_at: string; mine: boolean } | null;
    unread: number;
    deadline: string | null;
}
export interface ChatConversation {
    id: number;
    status: string;
    animal: ChatAnimal;
    counterpart: string;
    requestUrl: string;
    followUpUrl: string | null;
    followUpPending: number | null;
    messages: ChatMessage[];
    open: boolean;
    preAdoption: boolean;
    deadline: string | null;
    limitHours: number;
}
export interface FollowUpCheckin {
    id: number;
    sequence: number;
    due_date: string;
    submitted_at: string | null;
    comment: string | null;
    reviewed_at: string | null;
    shelter_note: string | null;
    reviewer?: Pick<Person, 'id' | 'name' | 'last_name'> | null;
    photos: { id: number; category: string }[];
}
export interface VaccinationCertificate {
    id: number;
    vaccine_name: string;
    application_date: string;
    notes: string | null;
    reviewed_at: string | null;
    uploader?: Pick<Person, 'id' | 'name' | 'last_name'>;
    reviewer?: Pick<Person, 'id' | 'name' | 'last_name'> | null;
}
export interface MedicalRecord {
    updater?: Person;
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
