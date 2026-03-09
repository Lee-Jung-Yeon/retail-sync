import { Repository } from 'typeorm';
import { Customer, CustomerPreference } from '../entities';
export declare class CustomersService {
    private customerRepo;
    private prefRepo;
    constructor(customerRepo: Repository<Customer>, prefRepo: Repository<CustomerPreference>);
    lookup(phoneLast4: string, gender?: string, ageGroup?: string): Promise<Customer[]>;
    findOrCreate(data: {
        phone_last4?: string;
        gender: string;
        age_group: string;
    }): Promise<Customer>;
    getProfileCard(customerId: string): Promise<{
        customer_id: string;
        gender: string;
        age_group: string;
        membership_status: string;
        total_visit_count: number;
        total_purchase_count: number;
        total_purchase_amount: number;
        first_visit_at: Date;
        preferences: Record<string, string[]>;
        recent_sessions: import("../entities").VisitSession[];
    }>;
    joinMembership(customerId: string): Promise<Customer>;
    getPreferences(customerId: string): Promise<CustomerPreference[]>;
    upsertPreferences(customerId: string, sessionId: string, prefs: {
        pref_category: string;
        pref_value: string;
        source?: string;
    }[]): Promise<CustomerPreference[]>;
}
