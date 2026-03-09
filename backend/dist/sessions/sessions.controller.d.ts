import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    create(req: any, body: any): Promise<{
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
    end(id: string): Promise<import("../entities").VisitSession>;
    get(id: string): Promise<import("../entities").VisitSession | null>;
    addMemo(id: string, body: any): Promise<import("../entities").InteractionMemo>;
    addFollowUp(id: string, body: any): Promise<import("../entities").FollowUpAction>;
}
