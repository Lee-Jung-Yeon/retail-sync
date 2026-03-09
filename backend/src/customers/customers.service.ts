import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerPreference } from '../entities';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerPreference) private prefRepo: Repository<CustomerPreference>,
    ) { }

    /** 전화번호 뒷4자리로 고객 검색 (중복 방지용 fuzzy matching 포함) */
    async lookup(phoneLast4: string, gender?: string, ageGroup?: string) {
        const where: any = { phone_last4: phoneLast4 };
        if (gender) where.gender = gender;
        if (ageGroup) where.age_group = ageGroup;
        return this.customerRepo.find({ where, order: { updated_at: 'DESC' }, take: 5 });
    }

    /** 신규 고객 생성 또는 기존 고객 반환 (Deduplication) */
    async findOrCreate(data: { phone_last4?: string; gender: string; age_group: string }) {
        if (data.phone_last4) {
            const existing = await this.customerRepo.findOne({
                where: { phone_last4: data.phone_last4, gender: data.gender, age_group: data.age_group },
            });
            if (existing) {
                existing.total_visit_count += 1;
                existing.updated_at = new Date();
                return this.customerRepo.save(existing);
            }
        }
        const customer = this.customerRepo.create({
            ...data,
            first_visit_at: new Date(),
        });
        return this.customerRepo.save(customer);
    }

    /** 고객 프로필 카드 (재방문 시 표시) */
    async getProfileCard(customerId: string) {
        const customer = await this.customerRepo.findOne({
            where: { customer_id: customerId },
            relations: ['sessions'],
        });
        if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다.');

        const preferences = await this.prefRepo.find({
            where: { customer_id: customerId },
            order: { created_at: 'DESC' },
        });

        // Group preferences by category
        const prefMap: Record<string, string[]> = {};
        preferences.forEach(p => {
            if (!prefMap[p.pref_category]) prefMap[p.pref_category] = [];
            if (!prefMap[p.pref_category].includes(p.pref_value)) {
                prefMap[p.pref_category].push(p.pref_value);
            }
        });

        return {
            customer_id: customer.customer_id,
            gender: customer.gender,
            age_group: customer.age_group,
            membership_status: customer.membership_status,
            total_visit_count: customer.total_visit_count,
            total_purchase_count: customer.total_purchase_count,
            total_purchase_amount: customer.total_purchase_amount,
            first_visit_at: customer.first_visit_at,
            preferences: prefMap,
            recent_sessions: (customer.sessions || []).slice(0, 3),
        };
    }

    /** 멤버십 가입 처리 (KPI4) */
    async joinMembership(customerId: string) {
        const customer = await this.customerRepo.findOne({ where: { customer_id: customerId } });
        if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다.');
        customer.membership_status = 'MEMBER';
        customer.membership_joined_at = new Date();
        return this.customerRepo.save(customer);
    }

    /** 취향 태그 조회 */
    async getPreferences(customerId: string) {
        return this.prefRepo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' } });
    }

    /** 취향 태그 추가/업데이트 */
    async upsertPreferences(customerId: string, sessionId: string, prefs: { pref_category: string; pref_value: string; source?: string }[]) {
        const entities = prefs.map(p => this.prefRepo.create({
            customer_id: customerId,
            session_id: sessionId,
            ...p,
        }));
        return this.prefRepo.save(entities);
    }
}
