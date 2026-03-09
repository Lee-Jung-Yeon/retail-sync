import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VisitSession } from './visit-session.entity';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn('uuid') customer_id: string;
    @Column({ nullable: true }) phone_last4: string;
    @Column() gender: string;
    @Column() age_group: string;
    @Column({ default: 'NON_MEMBER' }) membership_status: string;
    @Column({ nullable: true }) membership_joined_at: Date;
    @Column() first_visit_at: Date;
    @Column({ default: 1 }) total_visit_count: number;
    @Column({ default: 0 }) total_purchase_count: number;
    @Column({ type: 'bigint', default: 0 }) total_purchase_amount: number;
    @CreateDateColumn() created_at: Date;
    @UpdateDateColumn() updated_at: Date;

    @OneToMany(() => VisitSession, s => s.customer)
    sessions: VisitSession[];
}
