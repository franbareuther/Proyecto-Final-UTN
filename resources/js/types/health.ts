import { Animal, MedicalRecord, Person } from './shelter';

export interface Dose {
    id: number;
    animal_id: number;
    scheduled_date: string;
    status: 'Pendiente' | 'Aplicada' | 'Cancelada';
    source_vaccination_id: number;
    application_vaccination_id: number | null;
    legacy_unverified: boolean;
    cancellation_reason: string | null;
    resolved_at: string | null;
    resolver?: Person;
    animal?: Animal & { deleted_at?: string | null };
    source: MedicalRecord;
    application?: MedicalRecord | null;
}
export interface HealthAudit {
    id: number;
    record_type: string;
    record_id: number;
    action: string;
    actor: Person;
    created_at: string;
    before_values: Record<string, unknown>;
    after_values: Record<string, unknown>;
}
