import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
// @UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('stores')
    getStores() {
        return this.dashboardService.getStores();
    }

    @Get('store/:code/daily')
    getStoreDailyKpi(@Param('code') code: string, @Query('date') date: string) {
        return this.dashboardService.getStoreDailyKpi(code, date);
    }

    @Get('store/:code/weekly')
    getStoreWeeklyReport(@Param('code') code: string) {
        return this.dashboardService.getStoreWeeklyReport(code);
    }

    @Get('hq/kpi-summary')
    getHqKpiSummary() {
        return this.dashboardService.getHqKpiSummary();
    }

    @Get('hq/non-purchase')
    getNonPurchaseAnalysis(@Query('store_code') storeCode?: string) {
        return this.dashboardService.getNonPurchaseAnalysis(storeCode);
    }

    @Get('hq/voc-analysis')
    getVocAnalysis(@Query('store_code') storeCode?: string) {
        return this.dashboardService.getVocAnalysis(storeCode);
    }

    @Get('seller/:staffId/stats')
    getSellerDailyStats(@Param('staffId') staffId: string) {
        return this.dashboardService.getSellerDailyStats(staffId);
    }

    @Get('manager/:code/dashboard')
    getManagerDailyDashboard(@Param('code') code: string) {
        return this.dashboardService.getManagerDailyDashboard(code);
    }
}
