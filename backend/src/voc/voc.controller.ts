import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { VocService } from './voc.service';

@Controller('sessions/:sessionId/voc')
// @UseGuards(AuthGuard('jwt'))
export class VocController {
    constructor(private vocService: VocService) { }

    @Post()
    recordVoc(@Param('sessionId') sessionId: string, @Body() body: any) {
        return this.vocService.recordVoc(sessionId, body);
    }
}
