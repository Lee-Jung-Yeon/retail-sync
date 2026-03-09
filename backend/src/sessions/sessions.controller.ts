import { Controller, Post, Patch, Get, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';

@Controller('sessions')
// @UseGuards(AuthGuard('jwt'))
export class SessionsController {
    constructor(private sessionsService: SessionsService) { }

    @Post()
    create(@Body() body: any) {
        return this.sessionsService.createSession({
            store_code: body.store_code,
            staff_id: body.staff_id,
            is_treatment: body.is_treatment ?? true,
            customer: body.customer,
            visit_type: body.visit_type,
            companion_type: body.companion_type,
            visit_purpose: body.visit_purpose,
        });
    }

    @Patch(':id')
    end(@Param('id') id: string) {
        return this.sessionsService.endSession(id);
    }

    @Get('latest')
    getLatest(@Query('staff_id') staffId: string) {
        return this.sessionsService.getLatestSession(staffId);
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.sessionsService.getSession(id);
    }

    @Post(':id/memos')
    addMemo(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addMemo(id, body);
    }

    @Post(':id/voc')
    addVoc(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addVoc(id, body);
    }

    @Post(':id/follow-ups')
    addFollowUp(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addFollowUp(id, body);
    }
}
