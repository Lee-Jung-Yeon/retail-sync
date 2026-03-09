import { Repository } from 'typeorm';
import { VisitSession, InteractionMemo, FollowUpAction } from '../entities';
import { CustomersService } from '../customers/customers.service';
export declare class SessionsService {
    private sessionRepo;
    private memoRepo;
    private followUpRepo;
    private customersService;
    constructor(sessionRepo: Repository<VisitSession>, memoRepo: Repository<InteractionMemo>, followUpRepo: Repository<FollowUpAction>, customersService: CustomersService);
    createSession(data: {
        store_code: string;
        staff_id: string;
        is_treatment: boolean;
        customer: {
            phone_last4?: string;
            gender: string;
            age_group: string;
        };
        visit_type: string;
        companion_type?: string;
        visit_purpose?: string;
    }): Promise<{
        customer: import("../entities").Customer;
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
        fittings: import("../entities").FittingRecord[];
    }>;
    endSession(sessionId: string): Promise<VisitSession>;
    addMemo(sessionId: string, data: {
        customer_id: string;
        fitting_id?: string;
        input_type: string;
        raw_text: string;
    }): Promise<InteractionMemo>;
    addFollowUp(sessionId: string, data: {
        customer_id: string;
        action_type: string;
        scheduled_at?: Date;
        message_content?: string;
    }): Promise<FollowUpAction>;
    getSession(sessionId: string): Promise<VisitSession | null>;
}
