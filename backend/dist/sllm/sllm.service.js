"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SllmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SllmService = void 0;
const common_1 = require("@nestjs/common");
let SllmService = SllmService_1 = class SllmService {
    constructor() {
        this.logger = new common_1.Logger(SllmService_1.name);
    }
    async convertSpeechToText(audioData) {
        this.logger.log('🎙️ [STT] Processing audio data through RTZR API stub...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return "이거 입어봤는데 핏은 오버핏이라 좋은데 컬러가 제 웜톤에는 좀 안 맞는 것 같아요. 조금 더 밝은 색으로 다시 볼게요.";
    }
    async processTextPipeline(text) {
        this.logger.log(`🤖 [sLLM] Starting 3-stage processing for text: "${text}"`);
        const nerStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const ner_entities = {
            product_attributes: ['오버핏', '밝은 색'],
            customer_attributes: ['웜톤'],
            action: ['다시 보기']
        };
        this.logger.debug(`[sLLM Stage 1] NER Extraction complete (${Date.now() - nerStartTime}ms)`);
        const sentimentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200));
        const sentiment_level = text.includes('안 맞는') ? 'MIXED' : 'POSITIVE';
        this.logger.debug(`[sLLM Stage 2] Sentiment Analysis complete: ${sentiment_level} (${Date.now() - sentimentStartTime}ms)`);
        const intentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const intent_tags = ['RETRY_DIFFERENT_COLOR', 'CONSIDERING_PURCHASE'];
        this.logger.debug(`[sLLM Stage 3] Intent Classification complete (${Date.now() - intentStartTime}ms)`);
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
            sllm_confidence: parseFloat((Math.random() * (0.98 - 0.85) + 0.85).toFixed(2))
        };
    }
    mergeTags(manualTags, sllmTags) {
        this.logger.log('🔄 [sLLM] Merging manual tags with sLLM extracted tags...');
        const merged = { ...sllmTags };
        const conflicts = [];
        for (const [key, value] of Object.entries(manualTags)) {
            if (merged[key] && merged[key] !== value) {
                conflicts.push({ key, manual: value, sllm: merged[key] });
                this.logger.warn(`⚠️ Conflict on tag [${key}]: Manual=${value} vs sLLM=${merged[key]}. manual wins.`);
            }
            merged[key] = value;
        }
        return {
            merged_tags: merged,
            conflicts_resolved: conflicts.length,
            conflict_details: conflicts
        };
    }
};
exports.SllmService = SllmService;
exports.SllmService = SllmService = SllmService_1 = __decorate([
    (0, common_1.Injectable)()
], SllmService);
//# sourceMappingURL=sllm.service.js.map