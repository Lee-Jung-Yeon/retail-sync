import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, MessageSquare, Tag, Star } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const EXP_TAGS = [
    { id: 'STAFF_KIND', label: '친절한 서비스' },
    { id: 'PROD_REC', label: '좋은 추천' },
    { id: 'WAIT_LONG', label: '대기 시간 길었음' },
    { id: 'SIZE_STK', label: '사이즈 문제' },
    { id: 'PRICE_CONCERN', label: '가격 고민' },
    { id: 'FIT_GOOD', label: '쾌적한 피팅' },
    { id: 'MORE_OPTIONS', label: '더 다양한 옵션 원함' },
];

export default function MemoScreen() {
    const [latestSession, setLatestSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [memoText, setMemoText] = useState('');
    const [customerComment, setCustomerComment] = useState('');
    const [experienceTags, setExperienceTags] = useState([]);
    const [vocScore, setVocScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const fetchLatestSession = async () => {
        setIsLoading(true);
        const staffId = localStorage.getItem('staff_id') || 'staff-uuid-placeholder';
        const session = await apiClient.getLatestSession(staffId);

        if (session && (!latestSession || session.session_id !== latestSession.session_id)) {
            setLatestSession(session);
            // Reset forms for new session
            setMemoText('');
            setCustomerComment('');
            setExperienceTags([]);
            setVocScore(0);

            // If the latest session already has VoC submitted from Tablet, we could ideally prepopulate score.
            // Since we don't have a direct deep fetch of VoC in the current API schema response, we leave it reset.
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLatestSession();
        const interval = setInterval(fetchLatestSession, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTag = (tagId) => {
        setExperienceTags(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    const handleSave = async () => {
        if (!latestSession) return;
        setIsSaving(true);
        try {
            // 1. 접객 메모 저장 (interaction_memos)
            if (memoText.trim()) {
                await apiClient.submitMemo(latestSession.session_id, {
                    customer_id: latestSession.customer?.customer_id,
                    input_type: 'TEXT',
                    raw_text: memoText,
                });
            }

            // 2. VoC 저장 (customer_voc) — 코멘트 또는 경험태그가 있을 때만
            if (customerComment.trim() || experienceTags.length > 0 || vocScore > 0) {
                // Determine staff ID (from local storage login simulation)
                const staffId = localStorage.getItem('staff_id') || 'staff-uuid-placeholder';
                await apiClient.submitVoc(latestSession.session_id, {
                    customer_id: latestSession.customer?.customer_id,
                    staff_id: staffId,
                    satisfaction_score: vocScore > 0 ? vocScore : 5, // Fallback default if forgot to set
                    experience_tags: experienceTags,
                    customer_comment: customerComment,
                    voc_source: 'STAFF_OBS',
                });
            }

            alert('메모 및 VoC 저장 완료');
            setMemoText('');
            setCustomerComment('');
            setExperienceTags([]);
            setVocScore(0);
        } catch (e) {
            alert('저장 실패. 네트워크를 확인해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1024px] flex flex-col gap-6">

                {/* Header & Session Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex gap-6 items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-bold text-textPrimary">현재 활성 세션</h2>
                            {isLoading ? (
                                <RefreshCw size={16} className="text-gray-400 animate-spin" />
                            ) : (
                                <span className="text-[12px] text-gray-400">자동 갱신됨 (5초)</span>
                            )}
                        </div>

                        {latestSession ? (
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-[13px] text-textSecondary block mb-1">고객 정보</span>
                                    <div className="font-semibold text-textPrimary">
                                        {latestSession.customer?.gender === 'M' ? '남성' : '여성'} / {latestSession.customer?.age_group}대
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[13px] text-textSecondary block mb-1">방문 목적</span>
                                    <div className="font-semibold text-textPrimary">
                                        {latestSession.visit_purpose || '미지정'}
                                    </div>
                                </div>
                                <div className="flex-1 text-right">
                                    <span className="text-[12px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                        ID: {latestSession.session_id.slice(-4).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 py-2">대기 중인 세션이 없습니다. 태블릿에서 새 접객을 시작해주세요.</p>
                        )}
                    </div>
                </div>

                {/* Main Typing Zone */}
                <div className="flex flex-col gap-6 flex-1">
                    {/* Upper: Free Text Memo (interaction_memos) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="text-[16px] font-bold text-textPrimary flex items-center gap-2 mb-4">
                            <MessageSquare size={18} /> 상세 접객 메모
                        </h3>
                        <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            disabled={!latestSession}
                            placeholder="고객 대화 맥락, 망설임 이유, 동행자 반응 등을 자유롭게 기록하세요..."
                            className="w-full min-h-[200px] p-4 bg-surface border border-borderGray rounded-xl text-[15px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Lower: VoC Options (customer_voc) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-textPrimary flex items-center gap-2">
                                <Tag size={18} /> 고객 VoC 기록
                            </h3>

                            {/* VoC Score (Star Rating) */}
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-medium text-textSecondary">만족도</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setVocScore(s)}
                                            disabled={!latestSession}
                                            className={`p-1 transition-colors ${vocScore >= s ? 'text-yellow-400' : 'text-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <Star size={24} fill={vocScore >= s ? 'currentColor' : 'none'} strokeWidth={vocScore >= s ? 0 : 2} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[14px] font-bold text-textPrimary mb-3">경험 태그</h4>
                            <div className="flex flex-wrap gap-2">
                                {EXP_TAGS.map(tag => {
                                    const isSelected = experienceTags.includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            disabled={!latestSession}
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors tap-active border disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-surface text-textPrimary border-borderGray hover:bg-gray-100'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <h4 className="text-[14px] font-bold text-textPrimary mb-3">고객 직접 코멘트</h4>
                            <textarea
                                value={customerComment}
                                onChange={(e) => setCustomerComment(e.target.value)}
                                disabled={!latestSession}
                                placeholder="고객이 남긴 칭찬/불만 코멘트 (예: 직원분 추천이 좋았어요)"
                                className="w-full min-h-[100px] p-4 bg-surface border border-borderGray rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            disabled={!latestSession || isSaving}
                            onClick={handleSave}
                            className={`w-full h-14 mt-4 rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSaving ? 'bg-gray-300 text-gray-500' : 'bg-primary text-white hover:bg-primary/90'
                                }`}
                        >
                            {isSaving ? '저장 중...' : <><Save size={20} /> 접객 통계 및 메모 등록</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
