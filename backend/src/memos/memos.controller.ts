import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { MemosService } from './memos.service';

@Controller('memos')
// @UseGuards(AuthGuard('jwt'))
export class MemosController {
    constructor(private readonly memosService: MemosService) { }

    @Post(':sessionId')
    async createMemo(
        @Param('sessionId') sessionId: string,
        @Body() body: { customer_id: string; fitting_id?: string; input_type: 'TEXT' | 'AUDIO'; text: string }
    ) {
        return this.memosService.createMemo(
            sessionId,
            body.customer_id,
            body.input_type,
            body.text,
            body.fitting_id
        );
    }
}
