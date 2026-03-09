import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitSession, InteractionMemo, FollowUpAction } from '../entities';
import { CustomersModule } from '../customers/customers.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([VisitSession, InteractionMemo, FollowUpAction]),
        CustomersModule,
    ],
    providers: [SessionsService],
    controllers: [SessionsController],
    exports: [SessionsService],
})
export class SessionsModule { }
