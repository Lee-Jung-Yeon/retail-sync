import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FittingRecord, NonPurchaseReason, Customer } from '../entities';
import { FittingsService } from './fittings.service';
import { FittingsController } from './fittings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FittingRecord, NonPurchaseReason, Customer])],
    providers: [FittingsService],
    controllers: [FittingsController],
})
export class FittingsModule { }
