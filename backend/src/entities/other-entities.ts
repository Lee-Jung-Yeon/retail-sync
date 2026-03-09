import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_preferences')
export class CustomerPreference {
    @PrimaryGeneratedColumn('uuid') preference_id: string;
    @Column() customer_id: string;
    @Column() session_id: string;
    @Column() pref_category: string;
    @Column() pref_value: string;
    @Column({ default: 'MANUAL' }) source: string;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) confidence_score: number;
    @CreateDateColumn() created_at: Date;
}

@Entity('interaction_memos')
export class InteractionMemo {
    @PrimaryGeneratedColumn('uuid') memo_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column({ nullable: true }) fitting_id: string;
    @Column() input_type: string;
    @Column('text') raw_text: string;
    @Column({ type: 'jsonb', nullable: true }) ner_entities: any;
    @Column({ nullable: true }) sentiment_level: string;
    @Column('varchar', { array: true, nullable: true }) intent_tags: string[];
    @Column({ type: 'jsonb', nullable: true }) sllm_extracted_tags: any;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) sllm_confidence: number;
    @Column({ default: false }) staff_confirmed: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('follow_up_actions')
export class FollowUpAction {
    @PrimaryGeneratedColumn('uuid') action_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() action_type: string;
    @Column({ default: 'SCHEDULED' }) action_status: string;
    @Column({ nullable: true }) scheduled_at: Date;
    @Column({ nullable: true }) executed_at: Date;
    @Column({ nullable: true }) result: string;
    @Column({ type: 'text', nullable: true }) message_content: string;
    @CreateDateColumn() created_at: Date;
}

@Entity('customer_voc')
export class CustomerVoc {
    @PrimaryGeneratedColumn('uuid') voc_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() staff_id: string;
    @Column({ type: 'smallint' }) satisfaction_score: number;
    @Column('varchar', { array: true, nullable: true }) experience_tags: string[];
    @Column({ type: 'text', nullable: true }) customer_comment: string;
    @Column({ default: 'STAFF_OBS' }) voc_source: string;
    @Column({ nullable: true }) comment_sentiment: string;
    @Column('varchar', { array: true, nullable: true }) improvement_tags: string[];
    @CreateDateColumn() created_at: Date;
}

@Entity('daily_kpi_snapshots')
export class DailyKpiSnapshot {
    @PrimaryGeneratedColumn('uuid') snapshot_id: string;
    @Column({ type: 'date' }) snapshot_date: string;
    @Column() store_code: string;
    @Column() is_treatment: boolean;
    @Column({ default: 0 }) total_visitors: number;
    @Column({ default: 0 }) new_visitors: number;
    @Column({ default: 0 }) revisitors: number;
    @Column({ default: 0 }) total_purchases: number;
    @Column({ default: 0 }) repurchases: number;
    @Column({ type: 'bigint', default: 0 }) total_revenue: number;
    @Column({ default: 0 }) new_memberships: number;
    @Column({ type: 'bigint', default: 0 }) loyal_customer_avg_spend: number;
    @Column({ default: 0 }) non_purchase_data_count: number;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) avg_satisfaction: number;
    @Column({ default: 0 }) voc_count: number;
    @Column({ default: 0 }) fitting_count: number;
    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true }) fitting_conversion_rate: number;
    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true }) system_usage_rate: number;
    @Column({ default: 0 }) staff_input_count: number;
    @CreateDateColumn() created_at: Date;
}

@Entity('staff')
export class Staff {
    @PrimaryGeneratedColumn('uuid') staff_id: string;
    @Column() staff_name: string;
    @Column({ unique: true }) email: string;
    @Column() password_hash: string;
    @Column() store_code: string;
    @Column({ default: 'SELLER' }) role: string;
    @Column({ default: true }) is_active: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('stores')
export class Store {
    @Column({ primary: true }) store_code: string;
    @Column() store_name: string;
    @Column() brand: string;
    @Column({ nullable: true }) location: string;
    @Column({ default: true }) is_treatment: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('baseline_metrics')
export class BaselineMetric {
    @Column({ primary: true }) store_code: string;
    @Column({ primary: true }) metric_name: string;
    @Column({ type: 'bigint' }) baseline_value: number;
    @Column({ nullable: true }) baseline_period: string;
    @CreateDateColumn() created_at: Date;
}
