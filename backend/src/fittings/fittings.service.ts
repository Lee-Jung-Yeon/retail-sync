import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FittingRecord, NonPurchaseReason, Customer } from '../entities';

@Injectable()
export class FittingsService {
    constructor(
        @InjectRepository(FittingRecord) private fittingRepo: Repository<FittingRecord>,
        @InjectRepository(NonPurchaseReason) private reasonRepo: Repository<NonPurchaseReason>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    ) { }

    /** 피팅 기록 추가 */
    async addFitting(sessionId: string, data: {
        customer_id: string;
        product_code?: string;
        product_category?: string;
        fitting_size?: string;
        fitting_color?: string;
        did_try_on?: boolean;
        purchase_result: string;
        purchase_amount?: number;
    }) {
        // Validation: 구매인데 상품코드 없으면 경고
        if (data.purchase_result === 'PURCHASED' && !data.product_code) {
            throw new BadRequestException('구매 기록에는 상품코드가 필요합니다.');
        }

        const fitting = this.fittingRepo.create({
            session_id: sessionId,
            ...data,
        });
        const saved = await this.fittingRepo.save(fitting);

        // 구매 시 고객 통계 업데이트
        if (data.purchase_result === 'PURCHASED') {
            await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_count', 1);
            if (data.purchase_amount) {
                await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_amount', data.purchase_amount);
            }
        }

        return saved;
    }

    /** 미구매 사유 태그 추가 (복합 사유 허용) */
    async addReasons(fittingId: string, sessionId: string, customerId: string, reasons: {
        reason_tag: string;
        sub_tag?: string;
        is_primary?: boolean;
        source?: string;
    }[]) {
        if (!reasons || reasons.length === 0) {
            throw new BadRequestException('미구매 시 최소 1개의 사유를 선택해야 합니다.');
        }

        const entities = reasons.map(r => this.reasonRepo.create({
            fitting_id: fittingId,
            session_id: sessionId,
            customer_id: customerId,
            ...r,
        }));
        return this.reasonRepo.save(entities);
    }
}
