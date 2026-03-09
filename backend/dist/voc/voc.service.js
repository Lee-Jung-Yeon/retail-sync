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
exports.VocService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let VocService = class VocService {
    constructor(vocRepo) {
        this.vocRepo = vocRepo;
    }
    async recordVoc(sessionId, data) {
        if (data.satisfaction_score < 1 || data.satisfaction_score > 5) {
            throw new common_1.BadRequestException('만족도 점수는 1~5 사이여야 합니다.');
        }
        let comment_sentiment = null;
        let improvement_tags = null;
        if (data.customer_comment && data.customer_comment.length > 5) {
            const comment = data.customer_comment;
            if (comment.includes('최고') || comment.includes('좋') || comment.includes('친절')) {
                comment_sentiment = 'POSITIVE';
            }
            else if (comment.includes('불만') || comment.includes('별로') || comment.includes('안')) {
                comment_sentiment = 'NEGATIVE';
                improvement_tags = ['SERVICE', 'WAITING_TIME'];
            }
            else {
                comment_sentiment = 'NEUTRAL';
            }
        }
        const voc = this.vocRepo.create({
            session_id: sessionId,
            comment_sentiment,
            improvement_tags,
            ...data,
        });
        return this.vocRepo.save(voc);
    }
    async getStoreAvgSatisfaction(storeCode) {
        const result = await this.vocRepo
            .createQueryBuilder('v')
            .innerJoin('visit_sessions', 's', 's.session_id = v.session_id')
            .where('s.store_code = :storeCode', { storeCode })
            .select('AVG(v.satisfaction_score)', 'avg_score')
            .addSelect('COUNT(*)', 'total_count')
            .getRawOne();
        return result;
    }
};
exports.VocService = VocService;
exports.VocService = VocService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CustomerVoc)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VocService);
//# sourceMappingURL=voc.service.js.map