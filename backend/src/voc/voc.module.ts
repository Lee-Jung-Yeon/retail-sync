import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerVoc } from '../entities';
import { VocService } from './voc.service';
import { VocController } from './voc.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CustomerVoc])],
    providers: [VocService],
    controllers: [VocController],
})
export class VocModule { }
