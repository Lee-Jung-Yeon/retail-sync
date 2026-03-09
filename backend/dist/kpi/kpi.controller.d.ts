import { KpiService } from './kpi.service';
export declare class KpiController {
    private readonly kpiService;
    constructor(kpiService: KpiService);
    generateDailySnapshot(dateStr: string): Promise<{
        message: string;
        count: number;
    }>;
    getDidAnalysis(metric?: string): Promise<{
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
