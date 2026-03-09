import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuccessOverlay() {
    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center animate-success shadow-2xl">
                <div className="w-20 h-20 bg-accentGreen rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-textPrimary mb-1">기록 완료!</h2>
                <p className="text-textSecondary text-[15px]">접객 데이터가 저장되었습니다</p>
            </div>
        </div>
    );
}
