import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { VisitSession } from './visit-session.entity';
import { NonPurchaseReason } from './non-purchase-reason.entity';

@Entity('fitting_records')
export class FittingRecord {
    @PrimaryGeneratedColumn('uuid') fitting_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column({ nullable: true }) product_code: string;
    @Column({ nullable: true }) product_category: string;
    @Column({ nullable: true }) fitting_size: string;
    @Column({ nullable: true }) fitting_color: string;
    @Column({ default: true }) did_try_on: boolean;
    @Column() purchase_result: string;
    @Column({ type: 'bigint', nullable: true }) purchase_amount: number;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => VisitSession, s => s.fittings)
    @JoinColumn({ name: 'session_id' })
    session: VisitSession;

    @OneToMany(() => NonPurchaseReason, r => r.fitting)
    reasons: NonPurchaseReason[];
}
