import { Repository } from 'typeorm';
import { VisitSession, InteractionMemo, FollowUpAction, CustomerVoc } from '../entities';
import { CustomersService } from '../customers/customers.service';
export declare class SessionsService {
    private sessionRepo;
    private memoRepo;
    private followUpRepo;
    private vocRepo;
    private customersService;
    constructor(sessionRepo: Repository<VisitSession>, memoRepo: Repository<InteractionMemo>, followUpRepo: Repository<FollowUpAction>, vocRepo: Repository<CustomerVoc>, customersService: CustomersService);
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
    addVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }): Promise<CustomerVoc>;
    addFollowUp(sessionId: string, data: {
        customer_id: string;
        action_type: string;
        scheduled_at?: Date;
        message_content?: string;
    }): Promise<FollowUpAction>;
    getSession(sessionId: string): Promise<VisitSession | null>;
    getLatestSession(staffId: string): Promise<VisitSession | null>;
}
