import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { SessionsModule } from './sessions/sessions.module';
import { FittingsModule } from './fittings/fittings.module';
import { VocModule } from './voc/voc.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { MemosModule } from './memos/memos.module';
import { SllmService } from './sllm/sllm.service';
import { KpiModule } from './kpi/kpi.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                type: 'postgres',
                url: cfg.get('DATABASE_URL'),
                ssl: cfg.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                autoLoadEntities: true,
                synchronize: true, // PoC 단계에서만 true. 운영 시 false로 전환
            }),
        }),
        AuthModule,
        CustomersModule,
        SessionsModule,
        FittingsModule,
        VocModule,
        DashboardModule,
        MemosModule,
        KpiModule,
    ],
    providers: [SllmService],
})
export class AppModule { }
