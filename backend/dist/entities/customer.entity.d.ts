import { VisitSession } from './visit-session.entity';
export declare class Customer {
    customer_id: string;
    phone_last4: string;
    gender: string;
    age_group: string;
    membership_status: string;
    membership_joined_at: Date;
    first_visit_at: Date;
    total_visit_count: number;
    total_purchase_count: number;
    total_purchase_amount: number;
    created_at: Date;
    updated_at: Date;
    sessions: VisitSession[];
}
