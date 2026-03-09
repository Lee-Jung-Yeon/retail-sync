import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KpiService } from './kpi.service';

@Controller('api/kpi')
// @UseGuards(AuthGuard('jwt'))
export class KpiController {
    constructor(private readonly kpiService: KpiService) { }

    @Post('generate-snapshot/:dateStr')
    async generateDailySnapshot(@Param('dateStr') dateStr: string) {
        return this.kpiService.generateDailySnapshot(dateStr);
    }

    @Get('did-analysis')
    async getDidAnalysis(@Query('metric') metric: string = 'loyal_customer_avg_spend') {
        return this.kpiService.getDidAnalysis(metric);
    }
}
