import { Repository } from 'typeorm';
import { DailyKpiSnapshot, VisitSession, FittingRecord, NonPurchaseReason, CustomerVoc, Store, Staff } from '../entities';
export declare class DashboardService {
    private kpiRepo;
    private sessionRepo;
    private fittingRepo;
    private reasonRepo;
    private vocRepo;
    private storeRepo;
    private staffRepo;
    constructor(kpiRepo: Repository<DailyKpiSnapshot>, sessionRepo: Repository<VisitSession>, fittingRepo: Repository<FittingRecord>, reasonRepo: Repository<NonPurchaseReason>, vocRepo: Repository<CustomerVoc>, storeRepo: Repository<Store>, staffRepo: Repository<Staff>);
    getStoreDailyKpi(storeCode: string, date: string): Promise<DailyKpiSnapshot | null>;
    getStoreWeeklyReport(storeCode: string): Promise<DailyKpiSnapshot[]>;
    getHqKpiSummary(): Promise<{
        treatment: any;
        control: any;
    }>;
    getNonPurchaseAnalysis(storeCode?: string): Promise<any[]>;
    getVocAnalysis(storeCode?: string): Promise<any>;
    getStores(): Promise<Store[]>;
    getSellerDailyStats(staffId: string): Promise<{
        today_customers_helped: number;
        today_fittings: number;
        today_purchases: number;
        conversion_rate: string;
    }>;
    getManagerDailyDashboard(storeCode: string): Promise<{
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
