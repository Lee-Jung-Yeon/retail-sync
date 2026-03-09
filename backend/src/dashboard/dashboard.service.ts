import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
    DailyKpiSnapshot,
    VisitSession,
    FittingRecord,
    NonPurchaseReason,
    CustomerVoc,
    Store,
    Staff,
} from '../entities';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(DailyKpiSnapshot) private kpiRepo: Repository<DailyKpiSnapshot>,
        @InjectRepository(VisitSession) private sessionRepo: Repository<VisitSession>,
        @InjectRepository(FittingRecord) private fittingRepo: Repository<FittingRecord>,
        @InjectRepository(NonPurchaseReason) private reasonRepo: Repository<NonPurchaseReason>,
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    ) { }

    /** 매장 일일 KPI */
    async getStoreDailyKpi(storeCode: string, date: string) {
        return this.kpiRepo.findOne({ where: { store_code: storeCode, snapshot_date: date } });
    }

    /** 매장 주간 리포트 */
    async getStoreWeeklyReport(storeCode: string) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return this.kpiRepo.find({
            where: {
                store_code: storeCode,
                snapshot_date: Between(weekAgo.toISOString().slice(0, 10), today.toISOString().slice(0, 10)),
            },
            order: { snapshot_date: 'ASC' },
        });
    }

    /** 본사 KPI 요약 (Treatment vs Control) */
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

    /** 미구매 사유 분석 */
    async getNonPurchaseAnalysis(storeCode?: string) {
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

    /** VoC 분석 */
    async getVocAnalysis(storeCode?: string) {
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

    /** 매장 목록 */
    async getStores() {
        return this.storeRepo.find();
    }

    /** 셀러(직원) 일일 성과 (Phase 5) */
    async getSellerDailyStats(staffId: string) {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // 오늘 해당 직원이 담당한 세션 수 (응대한 고객 수)
        const sessions = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.staff_id = :staffId', { staffId })
            .andWhere('DATE(s.session_start) = :today', { today })
            .getMany();

        const sessionIds = sessions.map(s => s.session_id);

        // 오늘 피팅 건수 및 구매 전환 건수
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

    /** 매니저 대시보드 (피팅 전환율 및 일일 핵심 지표) (Phase 5) */
    async getManagerDailyDashboard(storeCode: string) {
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
            total_visitors: sessionIds.length, // 세션 수 기반 방문자 수
            fitting_conversion_funnel: {
                visitors: sessionIds.length,
                fittings: fittingCount,
                purchases: purchaseCount
            },
            total_revenue: revenue
        };
    }
}
