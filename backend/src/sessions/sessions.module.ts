import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitSession, InteractionMemo, FollowUpAction, CustomerVoc } from '../entities';
import { CustomersModule } from '../customers/customers.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([VisitSession, InteractionMemo, FollowUpAction, CustomerVoc]),
        CustomersModule,
    ],
    providers: [SessionsService],
    controllers: [SessionsController],
    exports: [SessionsService],
})
export class SessionsModule { }
