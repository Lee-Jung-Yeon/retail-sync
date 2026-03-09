import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyKpiSnapshot, Store, BaselineMetric } from '../entities';

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(
        @InjectRepository(DailyKpiSnapshot) private kpiRepo: Repository<DailyKpiSnapshot>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(BaselineMetric) private baselineRepo: Repository<BaselineMetric>
    ) { }

    /** Phase 6: Daily KPI Batch Job (Mock Implementation) */
    async generateDailySnapshot(dateStr: string) {
        this.logger.log(`⏳ Starting daily KPI snapshot generation for ${dateStr}...`);

        const stores = await this.storeRepo.find();
        const snapshots: DailyKpiSnapshot[] = [];

        for (const store of stores) {
            // Check if snapshot already exists
            const existing = await this.kpiRepo.findOne({ where: { store_code: store.store_code, snapshot_date: dateStr } });
            if (existing) {
                this.logger.warn(`Snapshot for ${store.store_code} on ${dateStr} already exists. Skipping.`);
                continue;
            }

            // MOCK: Generate semi-random realistic data based on whether it's treatment or control
            const multiplier = store.is_treatment ? 1.2 : 1.0;
            const visitorCount = Math.floor((Math.random() * 50 + 100) * multiplier); // 100 ~ 150
            const purchases = Math.floor(visitorCount * 0.3); // 30% conversion

            const snapshot = this.kpiRepo.create({
                snapshot_date: dateStr,
                store_code: store.store_code,
                is_treatment: store.is_treatment,
                total_visitors: visitorCount,
                new_visitors: Math.floor(visitorCount * 0.4),
                revisitors: Math.floor(visitorCount * 0.6),
                total_purchases: purchases,
                repurchases: Math.floor(purchases * 0.5),
                total_revenue: purchases * 120000,
                new_memberships: Math.floor(purchases * 0.2),
                loyal_customer_avg_spend: Math.floor(150000 * multiplier),
                non_purchase_data_count: visitorCount - purchases,
                avg_satisfaction: parseFloat((Math.random() * 1 + 4).toFixed(2)), // 4.0 ~ 5.0
                voc_count: Math.floor(visitorCount * 0.1),
                fitting_count: Math.floor(visitorCount * 0.8),
                fitting_conversion_rate: purchases / Math.max(1, Math.floor(visitorCount * 0.8)),
                system_usage_rate: store.is_treatment ? 0.95 : 0.0,
                staff_input_count: store.is_treatment ? visitorCount * 2 : 0,
            });

            snapshots.push(snapshot);
        }

        if (snapshots.length > 0) {
            await this.kpiRepo.save(snapshots);
            this.logger.log(`✅ Generated ${snapshots.length} snapshots successfully.`);
        }

        return { message: 'Snapshot generation complete', count: snapshots.length };
    }

    /** Phase 6: DID Regression Analysis */
    async getDidAnalysis(targetMetric: string) {
        // PoC started theoretically 2 weeks ago (for mocking purposes)
        // DID Formula: (Treatment_Post - Treatment_Pre) - (Control_Post - Control_Pre)

        // 1. Get baseline (Pre-PoC) averages from BaselineMetric for treatment and control
        const baselines = await this.baselineRepo.find({ where: { metric_name: targetMetric } });

        let treatPreSum = 0, treatPreCount = 0;
        let ctrlPreSum = 0, ctrlPreCount = 0;

        // Map baselines
        const storeMap = new Map();
        const stores = await this.storeRepo.find();
        stores.forEach(s => storeMap.set(s.store_code, s.is_treatment));

        baselines.forEach(b => {
            const isTreat = storeMap.get(b.store_code);
            if (isTreat) {
                treatPreSum += Number(b.baseline_value);
                treatPreCount++;
            } else {
                ctrlPreSum += Number(b.baseline_value);
                ctrlPreCount++;
            }
        });

        // If no baselines, mock them
        const treatPre = treatPreCount > 0 ? (treatPreSum / treatPreCount) : 100;
        const ctrlPre = ctrlPreCount > 0 ? (ctrlPreSum / ctrlPreCount) : 100;

        // 2. Get Post-PoC averages from DailyKpiSnapshot
        const postData = await this.kpiRepo
            .createQueryBuilder('k')
            .select('k.is_treatment', 'is_treatment')
            .addSelect(`AVG(k.${targetMetric})`, 'avg_val')
            .groupBy('k.is_treatment')
            .getRawMany();

        let treatPost = 0;
        let ctrlPost = 0;

        postData.forEach(p => {
            if (p.is_treatment) treatPost = Number(p.avg_val);
            else ctrlPost = Number(p.avg_val);
        });

        // 3. Calculate DID
        const diffTreat = treatPost - treatPre;
        const diffCtrl = ctrlPost - ctrlPre;
        const didEstimator = diffTreat - diffCtrl;

        // Mock p-value calculation (typically requires individual level data running OLS)
        const pValue = didEstimator > 0 ? 0.03 : 0.45;

        return {
            metric: targetMetric,
            pre_poc: {
                treatment: treatPre.toFixed(2),
                control: ctrlPre.toFixed(2)
            },
            post_poc: {
                treatment: treatPost.toFixed(2),
                control: ctrlPost.toFixed(2)
            },
            did_estimator: didEstimator.toFixed(2),
            p_value: pValue,
            is_significant: pValue < 0.05
        };
    }
}
