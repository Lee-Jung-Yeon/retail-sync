export declare class CustomerPreference {
    preference_id: string;
    customer_id: string;
    session_id: string;
    pref_category: string;
    pref_value: string;
    source: string;
    confidence_score: number;
    created_at: Date;
}
export declare class InteractionMemo {
    memo_id: string;
    session_id: string;
    customer_id: string;
    fitting_id: string;
    input_type: string;
    raw_text: string;
    ner_entities: any;
    sentiment_level: string;
    intent_tags: string[];
    sllm_extracted_tags: any;
    sllm_confidence: number;
    staff_confirmed: boolean;
    created_at: Date;
}
export declare class FollowUpAction {
    action_id: string;
    session_id: string;
    customer_id: string;
    action_type: string;
    action_status: string;
    scheduled_at: Date;
    executed_at: Date;
    result: string;
    message_content: string;
    created_at: Date;
}
export declare class CustomerVoc {
    voc_id: string;
    session_id: string;
    customer_id: string;
    staff_id: string;
    satisfaction_score: number;
    experience_tags: string[];
    customer_comment: string;
    voc_source: string;
    comment_sentiment: string;
    improvement_tags: string[];
    created_at: Date;
}
export declare class DailyKpiSnapshot {
    snapshot_id: string;
    snapshot_date: string;
    store_code: string;
    is_treatment: boolean;
    total_visitors: number;
    new_visitors: number;
    revisitors: number;
    total_purchases: number;
    repurchases: number;
    total_revenue: number;
    new_memberships: number;
    loyal_customer_avg_spend: number;
    non_purchase_data_count: number;
    avg_satisfaction: number;
    voc_count: number;
    fitting_count: number;
    fitting_conversion_rate: number;
    system_usage_rate: number;
    staff_input_count: number;
    created_at: Date;
}
export declare class Staff {
    staff_id: string;
    staff_name: string;
    email: string;
    password_hash: string;
    store_code: string;
    role: string;
    is_active: boolean;
    created_at: Date;
}
export declare class Store {
    store_code: string;
    store_name: string;
    brand: string;
    location: string;
    is_treatment: boolean;
    created_at: Date;
}
export declare class BaselineMetric {
    store_code: string;
    metric_name: string;
    baseline_value: number;
    baseline_period: string;
    created_at: Date;
}
