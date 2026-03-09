import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerVoc } from '../entities';

@Injectable()
export class VocService {
    constructor(
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
    ) { }

    /** 고객 만족도 VoC 기록 (KPI7) */
    async recordVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }) {
        if (data.satisfaction_score < 1 || data.satisfaction_score > 5) {
            throw new BadRequestException('만족도 점수는 1~5 사이여야 합니다.');
        }

        let comment_sentiment: string | null = null;
        let improvement_tags: string[] | null = null;

        // Phase 4: Mock VoC Sentiment Analysis
        if (data.customer_comment && data.customer_comment.length > 5) {
            const comment = data.customer_comment;
            if (comment.includes('최고') || comment.includes('좋') || comment.includes('친절')) {
                comment_sentiment = 'POSITIVE';
            } else if (comment.includes('불만') || comment.includes('별로') || comment.includes('안')) {
                comment_sentiment = 'NEGATIVE';
                improvement_tags = ['SERVICE', 'WAITING_TIME']; // mock inference
            } else {
                comment_sentiment = 'NEUTRAL';
            }
        }

        const voc = this.vocRepo.create({
            session_id: sessionId,
            comment_sentiment,
            improvement_tags,
            ...data,
        } as any);
        return this.vocRepo.save(voc);
    }

    /** 매장별 평균 만족도 조회 */
    async getStoreAvgSatisfaction(storeCode: string) {
        const result = await this.vocRepo
            .createQueryBuilder('v')
            .innerJoin('visit_sessions', 's', 's.session_id = v.session_id')
            .where('s.store_code = :storeCode', { storeCode })
            .select('AVG(v.satisfaction_score)', 'avg_score')
            .addSelect('COUNT(*)', 'total_count')
            .getRawOne();
        return result;
    }
}
