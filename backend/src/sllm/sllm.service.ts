import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SllmService {
    private readonly logger = new Logger(SllmService.name);

    // Phase 4: Stage 1 - Speech to Text Placeholder (RTZR API stub)
    async convertSpeechToText(audioData: Buffer): Promise<string> {
        this.logger.log('🎙️ [STT] Processing audio data through RTZR API stub...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        return "이거 입어봤는데 핏은 오버핏이라 좋은데 컬러가 제 웜톤에는 좀 안 맞는 것 같아요. 조금 더 밝은 색으로 다시 볼게요.";
    }

    // Phase 4: Stage 2 - sLLM 3-stage Processing Pipeline
    async processTextPipeline(text: string) {
        this.logger.log(`🤖 [sLLM] Starting 3-stage processing for text: "${text}"`);

        // Stage 1: NER (Named Entity Recognition) - identifying key entities
        const nerStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const ner_entities = {
            product_attributes: ['오버핏', '밝은 색'],
            customer_attributes: ['웜톤'],
            action: ['다시 보기']
        };
        this.logger.debug(`[sLLM Stage 1] NER Extraction complete (${Date.now() - nerStartTime}ms)`);

        // Stage 2: Sentiment Analysis - positive, negative, neutral
        const sentimentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200));
        // Simulated logic: text contains '안 맞는' -> slightly negative about color, but positive about fit. Overall mixed/neutral.
        const sentiment_level = text.includes('안 맞는') ? 'MIXED' : 'POSITIVE';
        this.logger.debug(`[sLLM Stage 2] Sentiment Analysis complete: ${sentiment_level} (${Date.now() - sentimentStartTime}ms)`);

        // Stage 3: Intent Classification - what does the customer want to do?
        const intentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const intent_tags = ['RETRY_DIFFERENT_COLOR', 'CONSIDERING_PURCHASE'];
        this.logger.debug(`[sLLM Stage 3] Intent Classification complete (${Date.now() - intentStartTime}ms)`);

        // Simulated Tag Extraction (mapping to system tags)
        const sllm_extracted_tags = {
            mismatch_reason: 'COLOR',
            preference_fit: 'OVERFIT',
            preference_tone: 'WARM'
        };

        return {
            raw_text: text,
            ner_entities,
            sentiment_level,
            intent_tags,
            sllm_extracted_tags,
            sllm_confidence: parseFloat((Math.random() * (0.98 - 0.85) + 0.85).toFixed(2)) // 85% ~ 98% confidence
        };
    }

    // Phase 4: Stage 3 - Tag merge logic (Manual PRIMARY + sLLM, conflict resolution)
    mergeTags(manualTags: Record<string, any>, sllmTags: Record<string, any>) {
        this.logger.log('🔄 [sLLM] Merging manual tags with sLLM extracted tags...');
        const merged = { ...sllmTags };
        const conflicts: any[] = [];

        for (const [key, value] of Object.entries(manualTags)) {
            if (merged[key] && merged[key] !== value) {
                conflicts.push({ key, manual: value, sllm: merged[key] });
                this.logger.warn(`⚠️ Conflict on tag [${key}]: Manual=${value} vs sLLM=${merged[key]}. manual wins.`);
            }
            // Manual tags always take precedence
            merged[key] = value;
        }

        return {
            merged_tags: merged,
            conflicts_resolved: conflicts.length,
            conflict_details: conflicts
        };
    }
}
