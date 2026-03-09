import { CustomersService } from './customers.service';
export declare class CustomersController {
    private customersService;
    constructor(customersService: CustomersService);
    lookup(phone: string, gender?: string, age?: string): Promise<import("../entities").Customer[]>;
    getProfileCard(id: string): Promise<{
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
    getPreferences(id: string): Promise<import("../entities").CustomerPreference[]>;
    updatePreferences(id: string, body: {
        session_id: string;
        preferences: {
            pref_category: string;
            pref_value: string;
            source?: string;
        }[];
    }): Promise<import("../entities").CustomerPreference[]>;
    joinMembership(id: string): Promise<import("../entities").Customer>;
}
