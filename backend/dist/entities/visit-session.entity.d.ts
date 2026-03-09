import { Customer } from './customer.entity';
import { FittingRecord } from './fitting-record.entity';
export declare class VisitSession {
    session_id: string;
    customer_id: string;
    store_code: string;
    staff_id: string;
    visit_type: string;
    companion_type: string;
    visit_purpose: string;
    session_start: Date;
    session_end: Date;
    duration_seconds: number;
    day_of_week: number;
    hour_of_day: number;
    is_treatment: boolean;
    created_at: Date;
    customer: Customer;
    fittings: FittingRecord[];
}
