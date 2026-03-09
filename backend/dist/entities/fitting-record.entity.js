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
exports.FittingRecord = void 0;
const typeorm_1 = require("typeorm");
const visit_session_entity_1 = require("./visit-session.entity");
const non_purchase_reason_entity_1 = require("./non-purchase-reason.entity");
let FittingRecord = class FittingRecord {
};
exports.FittingRecord = FittingRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FittingRecord.prototype, "fitting_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FittingRecord.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FittingRecord.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FittingRecord.prototype, "product_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FittingRecord.prototype, "product_category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FittingRecord.prototype, "fitting_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FittingRecord.prototype, "fitting_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], FittingRecord.prototype, "did_try_on", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FittingRecord.prototype, "purchase_result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], FittingRecord.prototype, "purchase_amount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FittingRecord.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => visit_session_entity_1.VisitSession, s => s.fittings),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", visit_session_entity_1.VisitSession)
], FittingRecord.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => non_purchase_reason_entity_1.NonPurchaseReason, r => r.fitting),
    __metadata("design:type", Array)
], FittingRecord.prototype, "reasons", void 0);
exports.FittingRecord = FittingRecord = __decorate([
    (0, typeorm_1.Entity)('fitting_records')
], FittingRecord);
//# sourceMappingURL=fitting-record.entity.js.map