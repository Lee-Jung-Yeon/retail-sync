import React, { useState } from 'react';
import { User, Users2, Search, ChevronRight } from 'lucide-react';

const GENDERS = ['남성', '여성'];
const AGES = ['20대', '30대', '40대', '50대', '60대+'];
const COMPANIONS = ['혼자', '커플', '친구', '가족'];
const PURPOSES = ['구경', '특정 상품', '선물', '행사'];
const CUSTOMER_TYPES = [
    { id: 'MEMBER', label: '멤버십 고객', icon: '💎', desc: '회원번호 또는 전화번호로 검색' },
    { id: 'NON_MEMBER_BUY', label: '비멤버십 구매 고객', icon: '🛍️', desc: '구매 이력이 있는 고객' },
    { id: 'NON_MEMBER_VISIT', label: '미구매 방문 고객', icon: '👤', desc: '상품만 둘러본 고객' },
];

export default function Screen1Customer({ data, update, onNext }) {
    const [custType, setCustType] = useState(data.customer_type || '');
    const [phoneLast4, setPhoneLast4] = useState(data.phone_last4 || '');
    const [gender, setGender] = useState(data.gender || '');
    const [ageGroup, setAgeGroup] = useState(data.age_group || '');
    const [companion, setCompanion] = useState(data.companion_type || '');
    const [purpose, setPurpose] = useState(data.visit_purpose || '');

    const canProceed = custType && gender && ageGroup;

    const handleNext = () => {
        update({
            customer_type: custType,
            phone_last4: phoneLast4,
            gender: gender === '남성' ? 'M' : 'F',
            age_group: ageGroup.replace('대', 's').replace('+', '+'),
            companion_type: companion || 'ALONE',
            visit_purpose: purpose || 'BROWSE',
            visit_type: custType === 'MEMBER' ? 'REVISIT' : 'NEW',
        });
        onNext();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Customer Type */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">고객 유형</h3>
                    <div className="space-y-2.5">
                        {CUSTOMER_TYPES.map(ct => (
                            <button
                                key={ct.id}
                                onClick={() => setCustType(ct.id)}
                                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all tap-active ${custType === ct.id ? 'border-primary bg-blue-50 shadow-sm' : 'border-borderGray bg-white'
                                    }`}
                            >
                                <span className="text-2xl mr-3">{ct.icon}</span>
                                <div className="text-left flex-1">
                                    <p className={`font-bold text-[15px] ${custType === ct.id ? 'text-primary' : 'text-textPrimary'}`}>{ct.label}</p>
                                    <p className="text-[12px] text-textSecondary mt-0.5">{ct.desc}</p>
                                </div>
                                {custType === ct.id && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><span className="text-white text-[12px]">✓</span></div>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Phone (for members) */}
                {custType === 'MEMBER' && (
                    <section>
                        <h3 className="text-[15px] font-bold text-textPrimary mb-3">전화번호 뒷 4자리</h3>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                maxLength={4}
                                value={phoneLast4}
                                onChange={e => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                                placeholder="0000"
                                className="flex-1 h-14 bg-white border-2 border-borderGray rounded-xl text-center text-2xl font-bold tracking-[0.3em] focus:outline-none focus:border-primary"
                            />
                            <button className="h-14 px-5 bg-primary rounded-xl text-white font-bold flex items-center gap-1 tap-active">
                                <Search size={18} /> 검색
                            </button>
                        </div>
                    </section>
                )}

                {/* Gender */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">성별</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {GENDERS.map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`h-14 rounded-xl font-bold text-[16px] transition-all tap-active ${gender === g ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Age */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">연령대</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {AGES.map(a => (
                            <button
                                key={a}
                                onClick={() => setAgeGroup(a)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${ageGroup === a ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Companion */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">동행 유형 <span className="text-textSecondary font-normal">(선택)</span></h3>
                    <div className="grid grid-cols-4 gap-2">
                        {COMPANIONS.map(c => (
                            <button
                                key={c}
                                onClick={() => setCompanion(prev => prev === c ? '' : c)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${companion === c ? 'bg-primary text-white' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Purpose */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">방문 목적 <span className="text-textSecondary font-normal">(선택)</span></h3>
                    <div className="grid grid-cols-4 gap-2">
                        {PURPOSES.map(p => (
                            <button
                                key={p}
                                onClick={() => setPurpose(prev => prev === p ? '' : p)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${purpose === p ? 'bg-primary text-white' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom action */}
            <div className="p-5 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`w-full h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    다음: 상품·결과 기록 <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
