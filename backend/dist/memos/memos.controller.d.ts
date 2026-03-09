import { MemosService } from './memos.service';
export declare class MemosController {
    private readonly memosService;
    constructor(memosService: MemosService);
    createMemo(sessionId: string, body: {
        customer_id: string;
        fitting_id?: string;
        input_type: 'TEXT' | 'AUDIO';
        text: string;
    }): Promise<import("../entities").InteractionMemo>;
}
