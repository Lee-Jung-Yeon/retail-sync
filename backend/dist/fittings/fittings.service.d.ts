import { Repository } from 'typeorm';
import { FittingRecord, NonPurchaseReason, Customer } from '../entities';
export declare class FittingsService {
    private fittingRepo;
    private reasonRepo;
    private customerRepo;
    constructor(fittingRepo: Repository<FittingRecord>, reasonRepo: Repository<NonPurchaseReason>, customerRepo: Repository<Customer>);
    addFitting(sessionId: string, data: {
        customer_id: string;
        product_code?: string;
        product_category?: string;
        fitting_size?: string;
        fitting_color?: string;
        did_try_on?: boolean;
        purchase_result: string;
        purchase_amount?: number;
    }): Promise<FittingRecord>;
    addReasons(fittingId: string, sessionId: string, customerId: string, reasons: {
        reason_tag: string;
        sub_tag?: string;
        is_primary?: boolean;
        source?: string;
    }[]): Promise<NonPurchaseReason[]>;
}
