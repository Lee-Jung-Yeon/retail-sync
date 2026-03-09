import { Repository } from 'typeorm';
import { CustomerVoc } from '../entities';
export declare class VocService {
    private vocRepo;
    constructor(vocRepo: Repository<CustomerVoc>);
    recordVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }): Promise<CustomerVoc[]>;
    getStoreAvgSatisfaction(storeCode: string): Promise<any>;
}
