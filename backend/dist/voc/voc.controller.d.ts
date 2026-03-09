import { VocService } from './voc.service';
export declare class VocController {
    private vocService;
    constructor(vocService: VocService);
    recordVoc(sessionId: string, body: any): Promise<import("../entities").CustomerVoc[]>;
}
