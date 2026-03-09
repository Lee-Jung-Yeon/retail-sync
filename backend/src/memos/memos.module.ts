import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemosService } from './memos.service';
import { MemosController } from './memos.controller';
import { InteractionMemo } from '../entities';
import { SllmService } from '../sllm/sllm.service';

@Module({
  imports: [TypeOrmModule.forFeature([InteractionMemo])],
  providers: [MemosService, SllmService],
  controllers: [MemosController]
})
export class MemosModule { }
