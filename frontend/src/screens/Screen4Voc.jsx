import React, { useState } from 'react';
import { Star, ChevronLeft, Save, Smile } from 'lucide-react';

const EXP_TAGS = [
    { id: 'STAFF_KIND', label: '직원이 친절함' },
    { id: 'STORE_CLEAN', label: '매장이 청결함' },
    { id: 'FIT_GOOD', label: '피팅룸 안내 좋음' },
    { id: 'PROD_REC', label: '상품 추천 유용함' },
    { id: 'WAIT_LONG', label: '응대 대기 길었음' },
    { id: 'SIZE_STK', label: '사이즈 재고 부족' },
];

export default function Screen4Voc({ data, update, onComplete, onBack }) {
    const [score, setScore] = useState(data.voc_score || 0);
    const [tags, setTags] = useState(data.voc_tags || []);
    const [comment, setComment] = useState(data.voc_comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTag = (tagId) => {
        setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const handleComplete = () => {
        setIsSubmitting(true);
        update({ voc_score: score, voc_tags: tags, voc_comment: comment });
        // Simulate API delay
        setTimeout(() => {
            setIsSubmitting(false);
            onComplete();
        }, 600);
    };

    const canProceed = score > 0;

    return (
        <div className="flex flex-col h-full bg-surface">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Core Satisfaction Score */}
                <section className="bg-white p-6 rounded-2xl border border-borderGray shadow-sm text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <Smile size={24} className="text-primary" />
                        </div>
                    </div>
                    <h3 className="text-[17px] font-bold text-textPrimary mb-1">고객 응대 만족도 <span className="text-accentRed">*</span></h3>
                    <p className="text-[13px] text-textSecondary mb-5">오늘 이 고객은 매장 경험에 얼마나 만족하셨나요?</p>

                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(v => (
                            <button
                                key={v}
                                onClick={() => setScore(v)}
                                className={`w-12 h-12 flex flex-col items-center justify-center rounded-full transition-all tap-active ${score >= v ? 'bg-primary text-white scale-110 shadow-md transform' : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                <Star size={22} fill={score >= v ? "currentColor" : "none"} strokeWidth={score >= v ? 0 : 2} />
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between px-2 mt-2 text-[12px] font-bold text-gray-400">
                        <span>매우 불만족</span>
                        <span>매우 만족</span>
                    </div>
                </section>

                {/* Experience Tags */}
                <section className="animate-slide-up" style={{ display: score > 0 ? 'block' : 'none' }}>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">고객 피드백 키워드 <span className="text-textSecondary font-normal text-[13px]">(선택)</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {EXP_TAGS.map(tag => {
                            const isSelected = tags.includes(tag.id);
                            // Color tags based on score context: if low score, highlight negative context tags differently
                            const isNegativeTag = ['WAIT_LONG', 'SIZE_STK'].includes(tag.id);

                            let activeClass = 'bg-textPrimary text-white border-transparent';
                            if (isSelected && isNegativeTag) activeClass = 'bg-accentRed text-white border-transparent';
                            else if (isSelected && !isNegativeTag) activeClass = 'bg-primary text-white border-transparent';

                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all tap-active border ${isSelected ? activeClass : 'bg-white text-textPrimary border-borderGray hover:bg-gray-50'
                                        }`}
                                >
                                    {tag.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Optional Comment */}
                <section className="animate-slide-up" style={{ display: score > 0 ? 'block' : 'none' }}>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">특이사항 코멘트 <span className="text-textSecondary font-normal text-[13px]">(선택)</span></h3>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="기타 고객 불만이나 칭찬 사항이 있었다면 짧게 남겨주세요."
                        className="w-full h-24 p-4 bg-white border border-borderGray rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400"
                    />
                </section>

            </div>

            {/* Bottom actions */}
            <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleComplete}
                    disabled={!canProceed || isSubmitting}
                    className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed && !isSubmitting ? 'bg-textPrimary text-white shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            저장 중...
                        </div>
                    ) : (
                        <>최종 완료 <Save size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
