import { FittingRecord } from './fitting-record.entity';
export declare class NonPurchaseReason {
    reason_id: string;
    fitting_id: string;
    session_id: string;
    customer_id: string;
    reason_tag: string;
    sub_tag: string;
    source: string;
    confidence_score: number;
    is_primary: boolean;
    created_at: Date;
    fitting: FittingRecord;
}
