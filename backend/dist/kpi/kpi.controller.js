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
exports.KpiController = void 0;
const common_1 = require("@nestjs/common");
const kpi_service_1 = require("./kpi.service");
let KpiController = class KpiController {
    constructor(kpiService) {
        this.kpiService = kpiService;
    }
    async generateDailySnapshot(dateStr) {
        return this.kpiService.generateDailySnapshot(dateStr);
    }
    async getDidAnalysis(metric = 'loyal_customer_avg_spend') {
        return this.kpiService.getDidAnalysis(metric);
    }
};
exports.KpiController = KpiController;
__decorate([
    (0, common_1.Post)('generate-snapshot/:dateStr'),
    __param(0, (0, common_1.Param)('dateStr')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KpiController.prototype, "generateDailySnapshot", null);
__decorate([
    (0, common_1.Get)('did-analysis'),
    __param(0, (0, common_1.Query)('metric')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KpiController.prototype, "getDidAnalysis", null);
exports.KpiController = KpiController = __decorate([
    (0, common_1.Controller)('kpi'),
    __metadata("design:paramtypes", [kpi_service_1.KpiService])
], KpiController);
//# sourceMappingURL=kpi.controller.js.map