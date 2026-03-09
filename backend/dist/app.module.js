"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const customers_module_1 = require("./customers/customers.module");
const sessions_module_1 = require("./sessions/sessions.module");
const fittings_module_1 = require("./fittings/fittings.module");
const voc_module_1 = require("./voc/voc.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const auth_module_1 = require("./auth/auth.module");
const memos_module_1 = require("./memos/memos.module");
const sllm_service_1 = require("./sllm/sllm.service");
const kpi_module_1 = require("./kpi/kpi.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'postgres',
                    url: cfg.get('DATABASE_URL'),
                    ssl: cfg.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                    autoLoadEntities: true,
                    synchronize: true,
                }),
            }),
            auth_module_1.AuthModule,
            customers_module_1.CustomersModule,
            sessions_module_1.SessionsModule,
            fittings_module_1.FittingsModule,
            voc_module_1.VocModule,
            dashboard_module_1.DashboardModule,
            memos_module_1.MemosModule,
            kpi_module_1.KpiModule,
        ],
        providers: [sllm_service_1.SllmService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map