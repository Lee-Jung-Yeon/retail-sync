import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FittingRecord } from './fitting-record.entity';

@Entity('non_purchase_reasons')
export class NonPurchaseReason {
    @PrimaryGeneratedColumn('uuid') reason_id: string;
    @Column() fitting_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() reason_tag: string;
    @Column({ nullable: true }) sub_tag: string;
    @Column({ default: 'MANUAL' }) source: string;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) confidence_score: number;
    @Column({ default: false }) is_primary: boolean;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => FittingRecord, f => f.reasons)
    @JoinColumn({ name: 'fitting_id' })
    fitting: FittingRecord;
}
