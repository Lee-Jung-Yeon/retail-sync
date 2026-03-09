import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { DailyKpiSnapshot, Store, BaselineMetric } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([DailyKpiSnapshot, Store, BaselineMetric])],
  providers: [KpiService],
  controllers: [KpiController]
})
export class KpiModule { }
