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
exports.FittingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let FittingsService = class FittingsService {
    constructor(fittingRepo, reasonRepo, customerRepo) {
        this.fittingRepo = fittingRepo;
        this.reasonRepo = reasonRepo;
        this.customerRepo = customerRepo;
    }
    async addFitting(sessionId, data) {
        if (data.purchase_result === 'PURCHASED' && !data.product_code) {
            throw new common_1.BadRequestException('구매 기록에는 상품코드가 필요합니다.');
        }
        const fitting = this.fittingRepo.create({
            session_id: sessionId,
            ...data,
        });
        const saved = await this.fittingRepo.save(fitting);
        if (data.purchase_result === 'PURCHASED') {
            await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_count', 1);
            if (data.purchase_amount) {
                await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_amount', data.purchase_amount);
            }
        }
        return saved;
    }
    async addReasons(fittingId, sessionId, customerId, reasons) {
        if (!reasons || reasons.length === 0) {
            throw new common_1.BadRequestException('미구매 시 최소 1개의 사유를 선택해야 합니다.');
        }
        const entities = reasons.map(r => this.reasonRepo.create({
            fitting_id: fittingId,
            session_id: sessionId,
            customer_id: customerId,
            ...r,
        }));
        return this.reasonRepo.save(entities);
    }
};
exports.FittingsService = FittingsService;
exports.FittingsService = FittingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.FittingRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.NonPurchaseReason)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FittingsService);
//# sourceMappingURL=fittings.service.js.map