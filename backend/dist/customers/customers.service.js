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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let CustomersService = class CustomersService {
    constructor(customerRepo, prefRepo) {
        this.customerRepo = customerRepo;
        this.prefRepo = prefRepo;
    }
    async lookup(phoneLast4, gender, ageGroup) {
        const where = { phone_last4: phoneLast4 };
        if (gender)
            where.gender = gender;
        if (ageGroup)
            where.age_group = ageGroup;
        return this.customerRepo.find({ where, order: { updated_at: 'DESC' }, take: 5 });
    }
    async findOrCreate(data) {
        if (data.phone_last4) {
            const existing = await this.customerRepo.findOne({
                where: { phone_last4: data.phone_last4, gender: data.gender, age_group: data.age_group },
            });
            if (existing) {
                existing.total_visit_count += 1;
                existing.updated_at = new Date();
                return this.customerRepo.save(existing);
            }
        }
        const customer = this.customerRepo.create({
            ...data,
            first_visit_at: new Date(),
        });
        return this.customerRepo.save(customer);
    }
    async getProfileCard(customerId) {
        const customer = await this.customerRepo.findOne({
            where: { customer_id: customerId },
            relations: ['sessions'],
        });
        if (!customer)
            throw new common_1.NotFoundException('고객을 찾을 수 없습니다.');
        const preferences = await this.prefRepo.find({
            where: { customer_id: customerId },
            order: { created_at: 'DESC' },
        });
        const prefMap = {};
        preferences.forEach(p => {
            if (!prefMap[p.pref_category])
                prefMap[p.pref_category] = [];
            if (!prefMap[p.pref_category].includes(p.pref_value)) {
                prefMap[p.pref_category].push(p.pref_value);
            }
        });
        return {
            customer_id: customer.customer_id,
            gender: customer.gender,
            age_group: customer.age_group,
            membership_status: customer.membership_status,
            total_visit_count: customer.total_visit_count,
            total_purchase_count: customer.total_purchase_count,
            total_purchase_amount: customer.total_purchase_amount,
            first_visit_at: customer.first_visit_at,
            preferences: prefMap,
            recent_sessions: (customer.sessions || []).slice(0, 3),
        };
    }
    async joinMembership(customerId) {
        const customer = await this.customerRepo.findOne({ where: { customer_id: customerId } });
        if (!customer)
            throw new common_1.NotFoundException('고객을 찾을 수 없습니다.');
        customer.membership_status = 'MEMBER';
        customer.membership_joined_at = new Date();
        return this.customerRepo.save(customer);
    }
    async getPreferences(customerId) {
        return this.prefRepo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' } });
    }
    async upsertPreferences(customerId, sessionId, prefs) {
        const entities = prefs.map(p => this.prefRepo.create({
            customer_id: customerId,
            session_id: sessionId,
            ...p,
        }));
        return this.prefRepo.save(entities);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CustomerPreference)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map