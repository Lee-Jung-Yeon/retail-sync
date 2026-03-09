import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitSession, InteractionMemo, FollowUpAction, CustomerVoc } from '../entities';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(VisitSession) private sessionRepo: Repository<VisitSession>,
        @InjectRepository(InteractionMemo) private memoRepo: Repository<InteractionMemo>,
        @InjectRepository(FollowUpAction) private followUpRepo: Repository<FollowUpAction>,
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
        private customersService: CustomersService,
    ) { }

    /** 새 접객 세션 시작 */
    async createSession(data: {
        store_code: string;
        staff_id: string;
        is_treatment: boolean;
        customer: { phone_last4?: string; gender: string; age_group: string };
        visit_type: string;
        companion_type?: string;
        visit_purpose?: string;
    }) {
        // Find or create customer (dedup)
        const customer = await this.customersService.findOrCreate(data.customer);

        const now = new Date();
        const session = this.sessionRepo.create({
            customer_id: customer.customer_id,
            store_code: data.store_code,
            staff_id: data.staff_id,
            visit_type: data.visit_type,
            companion_type: data.companion_type,
            visit_purpose: data.visit_purpose,
            session_start: now,
            day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1, // Mon=0 ... Sun=6
            hour_of_day: now.getHours(),
            is_treatment: data.is_treatment,
        });

        const saved = await this.sessionRepo.save(session);
        return { ...saved, customer };
    }

    /** 세션 종료 (duration 자동 계산) */
    async endSession(sessionId: string) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const now = new Date();
        session.session_end = now;
        session.duration_seconds = Math.floor((now.getTime() - new Date(session.session_start).getTime()) / 1000);
        return this.sessionRepo.save(session);
    }

    /** 자유 메모 추가 */
    async addMemo(sessionId: string, data: {
        customer_id: string;
        fitting_id?: string;
        input_type: string;
        raw_text: string;
    }) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const memo = this.memoRepo.create({
            session_id: sessionId,
            customer_id: data.customer_id,
            fitting_id: data.fitting_id,
            input_type: data.input_type,
            raw_text: data.raw_text,
            // sLLM processing will be triggered asynchronously in Phase 4
        });
        return this.memoRepo.save(memo);
    }

    /** VoC 관찰 기록 추가 */
    async addVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const voc = this.vocRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.vocRepo.save(voc);
    }

    /** 후속 액션 예약 */
    async addFollowUp(sessionId: string, data: {
        customer_id: string;
        action_type: string;
        scheduled_at?: Date;
        message_content?: string;
    }) {
        const followUp = this.followUpRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.followUpRepo.save(followUp);
    }

    /** 세션 조회 (with relations) */
    async getSession(sessionId: string) {
        return this.sessionRepo.findOne({
            where: { session_id: sessionId },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }

    /** 최근 활성 세션 폴링용 */
    async getLatestSession(staffId: string) {
        return this.sessionRepo.findOne({
            where: { staff_id: staffId },
            order: { session_start: 'DESC' },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }
}
