import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FittingsService } from './fittings.service';

@Controller('sessions/:sessionId/fittings')
@UseGuards(AuthGuard('jwt'))
export class FittingsController {
    constructor(private fittingsService: FittingsService) { }

    @Post()
    addFitting(@Param('sessionId') sessionId: string, @Body() body: any) {
        return this.fittingsService.addFitting(sessionId, body);
    }

    @Post(':fittingId/reasons')
    addReasons(
        @Param('sessionId') sessionId: string,
        @Param('fittingId') fittingId: string,
        @Body() body: { customer_id: string; reasons: any[] },
    ) {
        return this.fittingsService.addReasons(fittingId, sessionId, body.customer_id, body.reasons);
    }
}
