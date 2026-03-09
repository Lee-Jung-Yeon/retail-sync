"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const other_entities_1 = require("../entities/other-entities");
const sllm_service_1 = require("../sllm/sllm.service");
let MemosService = class MemosService {
    constructor(memoRepo, sllmService) {
        this.memoRepo = memoRepo;
        this.sllmService = sllmService;
    }
    async createMemo(sessionId, customerId, inputType, textToProcess, fittingId) {
        let rawText = textToProcess;
        if (inputType === 'AUDIO') {
            rawText = await this.sllmService.convertSpeechToText(Buffer.from(textToProcess));
        }
        const sllmResults = await this.sllmService.processTextPipeline(rawText);
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
            staff_confirmed: false
        });
        return await this.memoRepo.save(memo);
    }
};
exports.MemosService = MemosService;
exports.MemosService = MemosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(other_entities_1.InteractionMemo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        sllm_service_1.SllmService])
], MemosService);
//# sourceMappingURL=memos.service.js.map