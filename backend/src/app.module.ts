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
            useFactory: (cfg: ConfigService) => {
                const url = cfg.get('DATABASE_URL');
                return {
                    type: 'postgres',
                    ...(url ? { url } : {
                        host: cfg.get<string>('DB_HOST', 'localhost'),
                        port: cfg.get<number>('DB_PORT', 5432),
                        username: cfg.get<string>('DB_USERNAME', 'rs_admin'),
                        password: cfg.get<string>('DB_PASSWORD', 'rs_dev_2026'),
                        database: cfg.get<string>('DB_NAME', 'retail_sync'),
                    }),
                    autoLoadEntities: true,
                    synchronize: false,  // We use init.sql for schema
                };
            },
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
