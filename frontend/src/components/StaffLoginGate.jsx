import React, { useState, useEffect } from 'react';
import { Store, User, Activity, CheckCircle2 } from 'lucide-react';

const STAFF_LIST = [
    { id: 'staff-1111-1111-1111-111111111111', name: '김민수' },
    { id: 'staff-2222-2222-2222-222222222222', name: '이서연' },
    { id: 'staff-3333-3333-3333-333333333333', name: '박지훈' },
];

const STORE_INFO = {
    code: 'HYUNDAI_SHINCHON_LACOSTE',
    label: '현대백화점 신촌점 (라코스테)'
};

function StaffLoginScreen({ onLogin }) {
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [isTreatment, setIsTreatment] = useState(true);

    const handleLogin = () => {
        if (!selectedStaffId) {
            alert('판매원(직원)을 선택해주세요.');
            return;
        }

        const selectedStaff = STAFF_LIST.find(s => s.id === selectedStaffId);

        localStorage.setItem('staff_id', selectedStaff.id);
        localStorage.setItem('staff_name', selectedStaff.name);
        localStorage.setItem('store_code', STORE_INFO.code);
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
                    <h1 className="text-2xl font-bold text-textPrimary">Retail Sync 접속</h1>
                    <p className="text-[16px] font-bold text-primary mt-2">{STORE_INFO.label}</p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* 판매자 다건 선택 (클릭) */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[14px] font-bold text-textPrimary">담당자 (직원) 선택</label>
                        <div className="grid grid-cols-3 gap-3">
                            {STAFF_LIST.map(staff => (
                                <button
                                    key={staff.id}
                                    onClick={() => setSelectedStaffId(staff.id)}
                                    className={`relative flex flex-col items-center justify-center h-24 rounded-xl border-2 transition-all tap-active ${selectedStaffId === staff.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-borderGray bg-surface hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedStaffId === staff.id && (
                                        <CheckCircle2 size={16} className="absolute top-2 right-2 text-primary" fill="currentColor" strokeWidth={3} />
                                    )}
                                    <User size={24} className={`mb-2 ${selectedStaffId === staff.id ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className={`text-[15px] font-bold ${selectedStaffId === staff.id ? 'text-primary' : 'text-textPrimary'}`}>
                                        {staff.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 매장 구분 (실험군/대조군) */}
                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-[14px] font-bold text-textPrimary flex items-center gap-1">
                            <Activity size={16} /> 매장 A/B 그룹 (POC 분석용)
                        </label>
                        <div className="flex bg-surface p-1 rounded-xl border border-borderGray">
                            <button
                                onClick={() => setIsTreatment(true)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${isTreatment ? 'bg-white shadow-sm text-primary border border-gray-200' : 'text-gray-500'}`}
                            >
                                실험군 (Treatment)
                            </button>
                            <button
                                onClick={() => setIsTreatment(false)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${!isTreatment ? 'bg-white shadow-sm text-gray-800 border border-gray-200' : 'text-gray-500'}`}
                            >
                                대조군 (Control)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full h-14 bg-primary text-white font-bold text-[16px] rounded-xl mt-4 hover:bg-primary/90 transition-colors tap-active shadow-sm"
                    >
                        로그인 및 시작
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
