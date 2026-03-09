export declare class SllmService {
    private readonly logger;
    convertSpeechToText(audioData: Buffer): Promise<string>;
    processTextPipeline(text: string): Promise<{
        raw_text: string;
        ner_entities: {
            product_attributes: string[];
            customer_attributes: string[];
            action: string[];
        };
        sentiment_level: string;
        intent_tags: string[];
        sllm_extracted_tags: {
            mismatch_reason: string;
            preference_fit: string;
            preference_tone: string;
        };
        sllm_confidence: number;
    }>;
    mergeTags(manualTags: Record<string, any>, sllmTags: Record<string, any>): {
        merged_tags: {
            [x: string]: any;
        };
        conflicts_resolved: number;
        conflict_details: any[];
    };
}
