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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonPurchaseReason = void 0;
const typeorm_1 = require("typeorm");
const fitting_record_entity_1 = require("./fitting-record.entity");
let NonPurchaseReason = class NonPurchaseReason {
};
exports.NonPurchaseReason = NonPurchaseReason;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "reason_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "fitting_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "reason_tag", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "sub_tag", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'MANUAL' }),
    __metadata("design:type", String)
], NonPurchaseReason.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], NonPurchaseReason.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], NonPurchaseReason.prototype, "is_primary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NonPurchaseReason.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fitting_record_entity_1.FittingRecord, f => f.reasons),
    (0, typeorm_1.JoinColumn)({ name: 'fitting_id' }),
    __metadata("design:type", fitting_record_entity_1.FittingRecord)
], NonPurchaseReason.prototype, "fitting", void 0);
exports.NonPurchaseReason = NonPurchaseReason = __decorate([
    (0, typeorm_1.Entity)('non_purchase_reasons')
], NonPurchaseReason);
//# sourceMappingURL=non-purchase-reason.entity.js.map