import { Repository } from 'typeorm';
import { InteractionMemo } from '../entities/other-entities';
import { SllmService } from '../sllm/sllm.service';
export declare class MemosService {
    private memoRepo;
    private sllmService;
    constructor(memoRepo: Repository<InteractionMemo>, sllmService: SllmService);
    createMemo(sessionId: string, customerId: string, inputType: 'TEXT' | 'AUDIO', textToProcess: string, fittingId?: string): Promise<InteractionMemo>;
}
