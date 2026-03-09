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
exports.BaselineMetric = exports.Store = exports.Staff = exports.DailyKpiSnapshot = exports.CustomerVoc = exports.FollowUpAction = exports.InteractionMemo = exports.CustomerPreference = void 0;
const typeorm_1 = require("typeorm");
let CustomerPreference = class CustomerPreference {
};
exports.CustomerPreference = CustomerPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerPreference.prototype, "preference_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPreference.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPreference.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPreference.prototype, "pref_category", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPreference.prototype, "pref_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'MANUAL' }),
    __metadata("design:type", String)
], CustomerPreference.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CustomerPreference.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerPreference.prototype, "created_at", void 0);
exports.CustomerPreference = CustomerPreference = __decorate([
    (0, typeorm_1.Entity)('customer_preferences')
], CustomerPreference);
let InteractionMemo = class InteractionMemo {
};
exports.InteractionMemo = InteractionMemo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InteractionMemo.prototype, "memo_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InteractionMemo.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InteractionMemo.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], InteractionMemo.prototype, "fitting_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InteractionMemo.prototype, "input_type", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], InteractionMemo.prototype, "raw_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InteractionMemo.prototype, "ner_entities", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], InteractionMemo.prototype, "sentiment_level", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { array: true, nullable: true }),
    __metadata("design:type", Array)
], InteractionMemo.prototype, "intent_tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InteractionMemo.prototype, "sllm_extracted_tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InteractionMemo.prototype, "sllm_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], InteractionMemo.prototype, "staff_confirmed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InteractionMemo.prototype, "created_at", void 0);
exports.InteractionMemo = InteractionMemo = __decorate([
    (0, typeorm_1.Entity)('interaction_memos')
], InteractionMemo);
let FollowUpAction = class FollowUpAction {
};
exports.FollowUpAction = FollowUpAction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FollowUpAction.prototype, "action_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FollowUpAction.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FollowUpAction.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FollowUpAction.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'SCHEDULED' }),
    __metadata("design:type", String)
], FollowUpAction.prototype, "action_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], FollowUpAction.prototype, "scheduled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], FollowUpAction.prototype, "executed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FollowUpAction.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FollowUpAction.prototype, "message_content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FollowUpAction.prototype, "created_at", void 0);
exports.FollowUpAction = FollowUpAction = __decorate([
    (0, typeorm_1.Entity)('follow_up_actions')
], FollowUpAction);
let CustomerVoc = class CustomerVoc {
};
exports.CustomerVoc = CustomerVoc;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerVoc.prototype, "voc_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerVoc.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerVoc.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerVoc.prototype, "staff_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], CustomerVoc.prototype, "satisfaction_score", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { array: true, nullable: true }),
    __metadata("design:type", Array)
], CustomerVoc.prototype, "experience_tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomerVoc.prototype, "customer_comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'STAFF_OBS' }),
    __metadata("design:type", String)
], CustomerVoc.prototype, "voc_source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerVoc.prototype, "comment_sentiment", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { array: true, nullable: true }),
    __metadata("design:type", Array)
], CustomerVoc.prototype, "improvement_tags", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerVoc.prototype, "created_at", void 0);
exports.CustomerVoc = CustomerVoc = __decorate([
    (0, typeorm_1.Entity)('customer_voc')
], CustomerVoc);
let DailyKpiSnapshot = class DailyKpiSnapshot {
};
exports.DailyKpiSnapshot = DailyKpiSnapshot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DailyKpiSnapshot.prototype, "snapshot_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], DailyKpiSnapshot.prototype, "snapshot_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DailyKpiSnapshot.prototype, "store_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], DailyKpiSnapshot.prototype, "is_treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "total_visitors", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "new_visitors", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "revisitors", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "total_purchases", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "repurchases", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "total_revenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "new_memberships", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "loyal_customer_avg_spend", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "non_purchase_data_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "avg_satisfaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "voc_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "fitting_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "fitting_conversion_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "system_usage_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyKpiSnapshot.prototype, "staff_input_count", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DailyKpiSnapshot.prototype, "created_at", void 0);
exports.DailyKpiSnapshot = DailyKpiSnapshot = __decorate([
    (0, typeorm_1.Entity)('daily_kpi_snapshots')
], DailyKpiSnapshot);
let Staff = class Staff {
};
exports.Staff = Staff;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Staff.prototype, "staff_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Staff.prototype, "staff_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Staff.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Staff.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Staff.prototype, "store_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'SELLER' }),
    __metadata("design:type", String)
], Staff.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Staff.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Staff.prototype, "created_at", void 0);
exports.Staff = Staff = __decorate([
    (0, typeorm_1.Entity)('staff')
], Staff);
let Store = class Store {
};
exports.Store = Store;
__decorate([
    (0, typeorm_1.Column)({ primary: true }),
    __metadata("design:type", String)
], Store.prototype, "store_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Store.prototype, "store_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Store.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Store.prototype, "is_treatment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Store.prototype, "created_at", void 0);
exports.Store = Store = __decorate([
    (0, typeorm_1.Entity)('stores')
], Store);
let BaselineMetric = class BaselineMetric {
};
exports.BaselineMetric = BaselineMetric;
__decorate([
    (0, typeorm_1.Column)({ primary: true }),
    __metadata("design:type", String)
], BaselineMetric.prototype, "store_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ primary: true }),
    __metadata("design:type", String)
], BaselineMetric.prototype, "metric_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], BaselineMetric.prototype, "baseline_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BaselineMetric.prototype, "baseline_period", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BaselineMetric.prototype, "created_at", void 0);
exports.BaselineMetric = BaselineMetric = __decorate([
    (0, typeorm_1.Entity)('baseline_metrics')
], BaselineMetric);
//# sourceMappingURL=other-entities.js.map