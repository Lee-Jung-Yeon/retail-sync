import { Repository } from 'typeorm';
import { DailyKpiSnapshot, Store, BaselineMetric } from '../entities';
export declare class KpiService {
    private kpiRepo;
    private storeRepo;
    private baselineRepo;
    private readonly logger;
    constructor(kpiRepo: Repository<DailyKpiSnapshot>, storeRepo: Repository<Store>, baselineRepo: Repository<BaselineMetric>);
    generateDailySnapshot(dateStr: string): Promise<{
        message: string;
        count: number;
    }>;
    getDidAnalysis(targetMetric: string): Promise<{
        metric: string;
        pre_poc: {
            treatment: string;
            control: string;
        };
        post_poc: {
            treatment: string;
            control: string;
        };
        did_estimator: string;
        p_value: number;
        is_significant: boolean;
    }>;
}
