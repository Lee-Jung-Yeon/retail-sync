import React, { useState, useRef } from 'react';
import { Mic, ChevronLeft, ChevronRight, Tags } from 'lucide-react';

const PREF_CATEGORIES = [
    { id: 'FIT', label: '핏', tags: ['오버핏', '슬림핏', '스탠다드', '와이드'] },
    { id: 'TONE', label: '톤', tags: ['쿨톤', '웜톤', '파스텔', '모노톤', '비비드'] },
    { id: 'STYLE', label: '스타일', tags: ['캐주얼', '포멀', '스트릿', '고프코어', '스포티'] },
    { id: 'TPO', label: '용도', tags: ['출근', '데이트', '운동', '여행', '하객룩'] },
];

export default function Screen3Context({ data, update, onNext, onBack }) {
    const [preferences, setPreferences] = useState(data.preferences || {});
    const [memo, setMemo] = useState(data.memo || '');
    const [isRecording, setIsRecording] = useState(false);
    const memoRef = useRef(null);

    const togglePrefTag = (categoryId, tag) => {
        setPreferences(prev => {
            const current = prev[categoryId] || [];
            const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
            return { ...prev, [categoryId]: updated };
        });
    };

    const hasPreferences = Object.values(preferences).some(arr => arr.length > 0);
    const canProceed = hasPreferences || memo.trim().length > 0;

    const handleNext = () => {
        update({ preferences, memo });
        onNext();
    };

    const handleMicClick = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            // Simulate STT appending text
            setTimeout(() => {
                setMemo(prev => prev + (prev ? ' ' : '') + '고객님이 슬림핏 바지는 불편하시다고 하셨고 약간 통이 넓은 스타일을 선호하심.');
                setIsRecording(false);
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Voice/Text Memo */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[15px] font-bold text-textPrimary flex items-center gap-1.5">
                            <MessageSquareIcon /> 자유 메모 <span className="text-textSecondary font-normal text-[13px]">(선택)</span>
                        </h3>
                        <span className="text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">AI 태그 변환</span>
                    </div>
                    <div className="relative">
                        <textarea
                            ref={memoRef}
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            placeholder="고객과의 대화나 체형 특징을 편하게 적어주세요. (예: 팔이 긴 체형, 레드 계열 선호)"
                            className="w-full h-32 p-4 bg-white border-2 border-borderGray rounded-xl text-[15px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleMicClick}
                            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${isRecording ? 'bg-accentRed text-white animate-pulse' : 'bg-primary text-white tap-active'
                                }`}
                        >
                            <Mic size={20} />
                        </button>
                    </div>
                    {isRecording && <p className="text-accentRed text-[12px] font-bold mt-2 text-center">음성 인식 중... 말씀해 주세요.</p>}
                </section>

                {/* Preference Tags */}
                <section>
                    <div className="flex items-center gap-1.5 mb-4">
                        <Tags size={18} className="text-textPrimary" />
                        <h3 className="text-[15px] font-bold text-textPrimary">고객 취향 태그 <span className="text-textSecondary font-normal text-[13px]">(선택)</span></h3>
                    </div>

                    <div className="space-y-5 bg-white p-5 rounded-2xl border border-borderGray shadow-sm">
                        {PREF_CATEGORIES.map(category => (
                            <div key={category.id}>
                                <div className="text-[13px] font-bold text-textSecondary mb-2">{category.label}</div>
                                <div className="flex flex-wrap gap-2">
                                    {category.tags.map(tag => {
                                        const isSelected = (preferences[category.id] || []).includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => togglePrefTag(category.id, tag)}
                                                className={`px-3.5 py-2 rounded-full text-[14px] font-medium transition-colors tap-active border ${isSelected ? 'bg-textPrimary text-white border-transparent' : 'bg-surface text-textPrimary border-borderGray'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom actions */}
            <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={onBack}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleNext}
                    className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-white'
                        }`}
                >
                    {canProceed ? (
                        <>다음: 고객 만족도 (VoC) <ChevronRight size={20} /></>
                    ) : (
                        <>접객 메모 건너뛰기 <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

function MessageSquareIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    );
}
