import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import {
    DailyKpiSnapshot,
    VisitSession,
    FittingRecord,
    NonPurchaseReason,
    CustomerVoc,
    Store,
    Staff
} from '../entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DailyKpiSnapshot,
            VisitSession,
            FittingRecord,
            NonPurchaseReason,
            CustomerVoc,
            Store,
            Staff
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
