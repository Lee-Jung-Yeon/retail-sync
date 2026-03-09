import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';
import { FittingRecord } from './fitting-record.entity';

@Entity('visit_sessions')
export class VisitSession {
    @PrimaryGeneratedColumn('uuid') session_id: string;
    @Column() customer_id: string;
    @Column() store_code: string;
    @Column() staff_id: string;
    @Column() visit_type: string;
    @Column({ nullable: true }) companion_type: string;
    @Column({ nullable: true }) visit_purpose: string;
    @Column() session_start: Date;
    @Column({ nullable: true }) session_end: Date;
    @Column({ nullable: true }) duration_seconds: number;
    @Column({ type: 'smallint', nullable: true }) day_of_week: number;
    @Column({ type: 'smallint', nullable: true }) hour_of_day: number;
    @Column({ default: true }) is_treatment: boolean;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => Customer, c => c.sessions)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @OneToMany(() => FittingRecord, f => f.session)
    fittings: FittingRecord[];
}
