import { FittingsService } from './fittings.service';
export declare class FittingsController {
    private fittingsService;
    constructor(fittingsService: FittingsService);
    addFitting(sessionId: string, body: any): Promise<import("../entities").FittingRecord>;
    addReasons(sessionId: string, fittingId: string, body: {
        customer_id: string;
        reasons: any[];
    }): Promise<import("../entities").NonPurchaseReason[]>;
}
