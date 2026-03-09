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
exports.VisitSession = void 0;
const typeorm_1 = require("typeorm");
const customer_entity_1 = require("./customer.entity");
const fitting_record_entity_1 = require("./fitting-record.entity");
let VisitSession = class VisitSession {
};
exports.VisitSession = VisitSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VisitSession.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VisitSession.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VisitSession.prototype, "store_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VisitSession.prototype, "staff_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VisitSession.prototype, "visit_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VisitSession.prototype, "companion_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VisitSession.prototype, "visit_purpose", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VisitSession.prototype, "session_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VisitSession.prototype, "session_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VisitSession.prototype, "duration_seconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], VisitSession.prototype, "day_of_week", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], VisitSession.prototype, "hour_of_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], VisitSession.prototype, "is_treatment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VisitSession.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, c => c.sessions),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], VisitSession.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => fitting_record_entity_1.FittingRecord, f => f.session),
    __metadata("design:type", Array)
], VisitSession.prototype, "fittings", void 0);
exports.VisitSession = VisitSession = __decorate([
    (0, typeorm_1.Entity)('visit_sessions')
], VisitSession);
//# sourceMappingURL=visit-session.entity.js.map