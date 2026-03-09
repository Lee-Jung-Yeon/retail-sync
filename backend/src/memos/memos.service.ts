import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionMemo } from '../entities/other-entities';
import { SllmService } from '../sllm/sllm.service';

@Injectable()
export class MemosService {
    constructor(
        @InjectRepository(InteractionMemo)
        private memoRepo: Repository<InteractionMemo>,
        private sllmService: SllmService
    ) { }

    async createMemo(sessionId: string, customerId: string, inputType: 'TEXT' | 'AUDIO', textToProcess: string, fittingId?: string) {
        let rawText = textToProcess;

        if (inputType === 'AUDIO') {
            // In a real scenario, textToProcess would be base64 audio data.
            // Here we simulate the STT process.
            rawText = await this.sllmService.convertSpeechToText(Buffer.from(textToProcess));
        }

        // Run the sLLM pipeline
        const sllmResults = await this.sllmService.processTextPipeline(rawText);

        // Create and save the memo entity
        const memo = this.memoRepo.create({
            session_id: sessionId,
            customer_id: customerId,
            fitting_id: fittingId,
            input_type: inputType,
            raw_text: sllmResults.raw_text,
            ner_entities: sllmResults.ner_entities,
            sentiment_level: sllmResults.sentiment_level,
            intent_tags: sllmResults.intent_tags,
            sllm_extracted_tags: sllmResults.sllm_extracted_tags,
            sllm_confidence: sllmResults.sllm_confidence,
            staff_confirmed: false // Can be confirmed later in the UI
        });

        return await this.memoRepo.save(memo);
    }
}
