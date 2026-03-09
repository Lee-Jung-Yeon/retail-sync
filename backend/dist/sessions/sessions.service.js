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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const customers_service_1 = require("../customers/customers.service");
let SessionsService = class SessionsService {
    constructor(sessionRepo, memoRepo, followUpRepo, vocRepo, customersService) {
        this.sessionRepo = sessionRepo;
        this.memoRepo = memoRepo;
        this.followUpRepo = followUpRepo;
        this.vocRepo = vocRepo;
        this.customersService = customersService;
    }
    async createSession(data) {
        const customer = await this.customersService.findOrCreate(data.customer);
        const now = new Date();
        const session = this.sessionRepo.create({
            customer_id: customer.customer_id,
            store_code: data.store_code,
            staff_id: data.staff_id,
            visit_type: data.visit_type,
            companion_type: data.companion_type,
            visit_purpose: data.visit_purpose,
            session_start: now,
            day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1,
            hour_of_day: now.getHours(),
            is_treatment: data.is_treatment,
        });
        const saved = await this.sessionRepo.save(session);
        return { ...saved, customer };
    }
    async endSession(sessionId) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('세션을 찾을 수 없습니다.');
        const now = new Date();
        session.session_end = now;
        session.duration_seconds = Math.floor((now.getTime() - new Date(session.session_start).getTime()) / 1000);
        return this.sessionRepo.save(session);
    }
    async addMemo(sessionId, data) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('세션을 찾을 수 없습니다.');
        const memo = this.memoRepo.create({
            session_id: sessionId,
            customer_id: data.customer_id,
            fitting_id: data.fitting_id,
            input_type: data.input_type,
            raw_text: data.raw_text,
        });
        return this.memoRepo.save(memo);
    }
    async addVoc(sessionId, data) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('세션을 찾을 수 없습니다.');
        const voc = this.vocRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.vocRepo.save(voc);
    }
    async addFollowUp(sessionId, data) {
        const followUp = this.followUpRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.followUpRepo.save(followUp);
    }
    async getSession(sessionId) {
        return this.sessionRepo.findOne({
            where: { session_id: sessionId },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }
    async getLatestSession(staffId) {
        return this.sessionRepo.findOne({
            where: { staff_id: staffId },
            order: { session_start: 'DESC' },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.VisitSession)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.InteractionMemo)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.FollowUpAction)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.CustomerVoc)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        customers_service_1.CustomersService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map