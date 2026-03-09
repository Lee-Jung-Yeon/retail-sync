import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getStores(): Promise<import("../entities").Store[]>;
    getStoreDailyKpi(code: string, date: string): Promise<import("../entities").DailyKpiSnapshot | null>;
    getStoreWeeklyReport(code: string): Promise<import("../entities").DailyKpiSnapshot[]>;
    getHqKpiSummary(): Promise<{
        treatment: any;
        control: any;
    }>;
    getNonPurchaseAnalysis(storeCode?: string): Promise<any[]>;
    getVocAnalysis(storeCode?: string): Promise<any>;
    getSellerDailyStats(staffId: string): Promise<{
        today_customers_helped: number;
        today_fittings: number;
        today_purchases: number;
        conversion_rate: string;
    }>;
    getManagerDailyDashboard(code: string): Promise<{
        date: string;
        total_visitors: number;
        fitting_conversion_funnel: {
            visitors: number;
            fittings: number;
            purchases: number;
        };
        total_revenue: number;
    }>;
}
