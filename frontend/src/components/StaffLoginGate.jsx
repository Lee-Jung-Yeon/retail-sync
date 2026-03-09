import React, { useState, useEffect } from 'react';
import { Store, User, Activity } from 'lucide-react';

const STORE_OPTIONS = [
    { code: 'LOTTE_KONDAE', label: '롯데 건대점', group: 'TREATMENT' },
    { code: 'LOTTE_NOWON', label: '롯데 노원점', group: 'TREATMENT' },
    { code: 'LOTTE_JUNGDONG', label: '롯데 중동점', group: 'CONTROL' },
    { code: 'LOTTE_YEONGDEUNGPO', label: '롯데 영등포점', group: 'CONTROL' },
    { code: 'AK_PYEONGTAEK', label: 'AK 평택점', group: 'CONTROL' },
];

function StaffLoginScreen({ onLogin }) {
    const [storeCode, setStoreCode] = useState(STORE_OPTIONS[0].code);
    const [staffName, setStaffName] = useState('');
    const [isTreatment, setIsTreatment] = useState(true);

    const handleLogin = () => {
        if (!staffName.trim()) {
            alert('판메자 이름을 입력해주세요.');
            return;
        }

        // Generate UUID polyfill for local testing
        const staffId = crypto.randomUUID ? crypto.randomUUID() : 'staff-' + Math.random().toString(36).substring(2);

        localStorage.setItem('staff_id', staffId);
        localStorage.setItem('staff_name', staffName);
        localStorage.setItem('store_code', storeCode);
        localStorage.setItem('is_treatment', isTreatment ? 'true' : 'false');

        onLogin();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-borderGray">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <Store size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-textPrimary">Retail Sync 접속 설정</h1>
                    <p className="text-sm text-textSecondary mt-2">태블릿/노트북 현장 데이터 수집기</p>
                </div>

                <div className="flex flex-col gap-5">
                    {/* 매장 선택 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-textPrimary">소속 매장</label>
                        <select
                            value={storeCode}
                            onChange={(e) => setStoreCode(e.target.value)}
                            className="w-full h-14 px-4 bg-surface border border-borderGray rounded-xl text-[15px] font-medium focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                            {STORE_OPTIONS.map(opt => (
                                <option key={opt.code} value={opt.code}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 판매자 이름 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-textPrimary">판매자 (직원명)</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                className="w-full h-14 pl-12 pr-4 bg-surface border border-borderGray rounded-xl text-[15px] font-medium focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* 매장 구분 (실험군/대조군) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-textPrimary flex items-center gap-1">
                            <Activity size={16} /> 매장 A/B 그룹 (POC 분석용)
                        </label>
                        <div className="flex bg-surface p-1 rounded-xl border border-borderGray">
                            <button
                                onClick={() => setIsTreatment(true)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${isTreatment ? 'bg-white shadow-sm text-primary border border-gray-200' : 'text-gray-500'
                                    }`}
                            >
                                실험군 (Treatment)
                            </button>
                            <button
                                onClick={() => setIsTreatment(false)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${!isTreatment ? 'bg-white shadow-sm text-gray-800 border border-gray-200' : 'text-gray-500'
                                    }`}
                            >
                                대조군 (Control)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full h-14 bg-primary text-white font-bold text-[16px] rounded-xl mt-4 hover:bg-primary/90 transition-colors tap-active"
                    >
                        접속하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function StaffLoginGate({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Only run on client mount
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('staff_id'));
    }, []);

    if (!isLoggedIn) {
        return <StaffLoginScreen onLogin={() => setIsLoggedIn(true)} />;
    }
    return children;
}
