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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getStores() {
        return this.dashboardService.getStores();
    }
    getStoreDailyKpi(code, date) {
        return this.dashboardService.getStoreDailyKpi(code, date);
    }
    getStoreWeeklyReport(code) {
        return this.dashboardService.getStoreWeeklyReport(code);
    }
    getHqKpiSummary() {
        return this.dashboardService.getHqKpiSummary();
    }
    getNonPurchaseAnalysis(storeCode) {
        return this.dashboardService.getNonPurchaseAnalysis(storeCode);
    }
    getVocAnalysis(storeCode) {
        return this.dashboardService.getVocAnalysis(storeCode);
    }
    getSellerDailyStats(staffId) {
        return this.dashboardService.getSellerDailyStats(staffId);
    }
    getManagerDailyDashboard(code) {
        return this.dashboardService.getManagerDailyDashboard(code);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stores'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStores", null);
__decorate([
    (0, common_1.Get)('store/:code/daily'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStoreDailyKpi", null);
__decorate([
    (0, common_1.Get)('store/:code/weekly'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStoreWeeklyReport", null);
__decorate([
    (0, common_1.Get)('hq/kpi-summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getHqKpiSummary", null);
__decorate([
    (0, common_1.Get)('hq/non-purchase'),
    __param(0, (0, common_1.Query)('store_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getNonPurchaseAnalysis", null);
__decorate([
    (0, common_1.Get)('hq/voc-analysis'),
    __param(0, (0, common_1.Query)('store_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getVocAnalysis", null);
__decorate([
    (0, common_1.Get)('seller/:staffId/stats'),
    __param(0, (0, common_1.Param)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSellerDailyStats", null);
__decorate([
    (0, common_1.Get)('manager/:code/dashboard'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getManagerDailyDashboard", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map