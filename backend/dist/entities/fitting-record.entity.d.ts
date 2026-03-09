import { VisitSession } from './visit-session.entity';
import { NonPurchaseReason } from './non-purchase-reason.entity';
export declare class FittingRecord {
    fitting_id: string;
    session_id: string;
    customer_id: string;
    product_code: string;
    product_category: string;
    fitting_size: string;
    fitting_color: string;
    did_try_on: boolean;
    purchase_result: string;
    purchase_amount: number;
    created_at: Date;
    session: VisitSession;
    reasons: NonPurchaseReason[];
}
