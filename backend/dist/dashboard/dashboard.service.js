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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let DashboardService = class DashboardService {
    constructor(kpiRepo, sessionRepo, fittingRepo, reasonRepo, vocRepo, storeRepo, staffRepo) {
        this.kpiRepo = kpiRepo;
        this.sessionRepo = sessionRepo;
        this.fittingRepo = fittingRepo;
        this.reasonRepo = reasonRepo;
        this.vocRepo = vocRepo;
        this.storeRepo = storeRepo;
        this.staffRepo = staffRepo;
    }
    async getStoreDailyKpi(storeCode, date) {
        return this.kpiRepo.findOne({ where: { store_code: storeCode, snapshot_date: date } });
    }
    async getStoreWeeklyReport(storeCode) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return this.kpiRepo.find({
            where: {
                store_code: storeCode,
                snapshot_date: (0, typeorm_2.Between)(weekAgo.toISOString().slice(0, 10), today.toISOString().slice(0, 10)),
            },
            order: { snapshot_date: 'ASC' },
        });
    }
    async getHqKpiSummary() {
        const treatmentKpi = await this.kpiRepo
            .createQueryBuilder('k')
            .where('k.is_treatment = :t', { t: true })
            .select([
            'SUM(k.total_visitors) as total_visitors',
            'SUM(k.revisitors) as revisitors',
            'SUM(k.total_purchases) as total_purchases',
            'SUM(k.repurchases) as repurchases',
            'SUM(k.total_revenue) as total_revenue',
            'SUM(k.new_memberships) as new_memberships',
            'AVG(k.avg_satisfaction) as avg_satisfaction',
            'SUM(k.non_purchase_data_count) as non_purchase_data_count',
        ])
            .getRawOne();
        const controlKpi = await this.kpiRepo
            .createQueryBuilder('k')
            .where('k.is_treatment = :t', { t: false })
            .select([
            'SUM(k.total_visitors) as total_visitors',
            'SUM(k.revisitors) as revisitors',
            'SUM(k.total_purchases) as total_purchases',
            'SUM(k.repurchases) as repurchases',
            'SUM(k.total_revenue) as total_revenue',
            'SUM(k.new_memberships) as new_memberships',
            'AVG(k.avg_satisfaction) as avg_satisfaction',
            'SUM(k.non_purchase_data_count) as non_purchase_data_count',
        ])
            .getRawOne();
        return { treatment: treatmentKpi, control: controlKpi };
    }
    async getNonPurchaseAnalysis(storeCode) {
        const qb = this.reasonRepo
            .createQueryBuilder('r')
            .select('r.reason_tag', 'reason_tag')
            .addSelect('COUNT(*)', 'count')
            .groupBy('r.reason_tag')
            .orderBy('count', 'DESC');
        if (storeCode) {
            qb.innerJoin('visit_sessions', 's', 's.session_id = r.session_id')
                .andWhere('s.store_code = :storeCode', { storeCode });
        }
        return qb.getRawMany();
    }
    async getVocAnalysis(storeCode) {
        const qb = this.vocRepo
            .createQueryBuilder('v')
            .select('AVG(v.satisfaction_score)', 'avg_score')
            .addSelect('COUNT(*)', 'total_count');
        if (storeCode) {
            qb.innerJoin('visit_sessions', 's', 's.session_id = v.session_id')
                .andWhere('s.store_code = :storeCode', { storeCode });
        }
        const result = await qb.getRawOne();
        return result;
    }
    async getStores() {
        return this.storeRepo.find();
    }
    async getSellerDailyStats(staffId) {
        const today = new Date().toISOString().slice(0, 10);
        const sessions = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.staff_id = :staffId', { staffId })
            .andWhere('DATE(s.session_start) = :today', { today })
            .getMany();
        const sessionIds = sessions.map(s => s.session_id);
        let fittingCount = 0;
        let purchaseCount = 0;
        if (sessionIds.length > 0) {
            const fittings = await this.fittingRepo
                .createQueryBuilder('f')
                .where('f.session_id IN (:...sessionIds)', { sessionIds })
                .getMany();
            fittingCount = fittings.length;
            purchaseCount = fittings.filter(f => f.purchase_result === 'PURCHASED').length;
        }
        return {
            today_customers_helped: sessionIds.length,
            today_fittings: fittingCount,
            today_purchases: purchaseCount,
            conversion_rate: fittingCount > 0 ? (purchaseCount / fittingCount * 100).toFixed(1) : '0.0'
        };
    }
    async getManagerDailyDashboard(storeCode) {
        const today = new Date().toISOString().slice(0, 10);
        const sessions = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.store_code = :storeCode', { storeCode })
            .andWhere('DATE(s.session_start) = :today', { today })
            .getMany();
        const sessionIds = sessions.map(s => s.session_id);
        let fittingCount = 0;
        let purchaseCount = 0;
        let revenue = 0;
        if (sessionIds.length > 0) {
            const fittings = await this.fittingRepo
                .createQueryBuilder('f')
                .where('f.session_id IN (:...sessionIds)', { sessionIds })
                .getMany();
            fittingCount = fittings.length;
            const purchasedFittings = fittings.filter(f => f.purchase_result === 'PURCHASED');
            purchaseCount = purchasedFittings.length;
            revenue = purchasedFittings.reduce((acc, curr) => acc + Number(curr.purchase_amount || 0), 0);
        }
        return {
            date: today,
            total_visitors: sessionIds.length,
            fitting_conversion_funnel: {
                visitors: sessionIds.length,
                fittings: fittingCount,
                purchases: purchaseCount
            },
            total_revenue: revenue
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.DailyKpiSnapshot)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.VisitSession)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.FittingRecord)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.NonPurchaseReason)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.CustomerVoc)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Store)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map