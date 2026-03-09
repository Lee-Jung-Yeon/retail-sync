import React, { useState, useCallback } from 'react';
import { Zap, Users, MessageCircle, BarChart3 } from 'lucide-react';
import Screen1Customer from './screens/Screen1Customer';
import Screen2Fitting from './screens/Screen2Fitting';
import Screen3Context from './screens/Screen3Context';
import Screen4Voc from './screens/Screen4Voc';
import SuccessOverlay from './components/SuccessOverlay';
import { apiClient } from './services/apiClient';

const TABS = [
    { id: 'record', label: '접객 기록', icon: Zap },
    { id: 'customers', label: '고객 목록', icon: Users },
    { id: 'messages', label: '후속 관리', icon: MessageCircle },
    { id: 'dashboard', label: '대시보드', icon: BarChart3 },
];

export default function App() {
    const [activeTab, setActiveTab] = useState('record');
    const [step, setStep] = useState(1);
    const [sessionData, setSessionData] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    const updateSession = useCallback((data) => {
        setSessionData(prev => ({ ...prev, ...data }));
    }, []);

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleComplete = async () => {
        console.log('📦 Final payload ready for backend processing:', sessionData);

        try {
            await apiClient.submitSession(sessionData);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setStep(1);
                setSessionData({});
            }, 2000);
        } catch (e) {
            console.error('Failed to submit session', e);
            alert('오프라인 저장소에 임시 저장되었습니다.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#CBD5E1]">
            {/* iPad container */}
            <div className="relative w-[768px] h-[1024px] bg-white flex flex-col overflow-hidden shadow-2xl rounded-2xl">
                {/* Header */}
                <header className="h-14 bg-primary flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-[17px] tracking-tight">Retail Sync</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white/70 text-[13px]">롯데 건대점</span>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-[13px] font-bold">JS</div>
                    </div>
                </header>

                {/* Step indicator (only for record tab) */}
                {activeTab === 'record' && (
                    <div className="h-12 bg-white border-b border-borderGray flex items-center px-5 shrink-0">
                        <div className="flex items-center gap-1 flex-1">
                            {['고객 식별', '상품·결과', '취향·메모', 'VoC'].map((label, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${step > i + 1 ? 'bg-accentGreen text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                                        }`}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className={`ml-1.5 text-[12px] font-semibold ${step === i + 1 ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
                                    {i < 3 && <div className={`w-8 h-[2px] mx-2 ${step > i + 1 ? 'bg-accentGreen' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-surface">
                    {activeTab === 'record' && step === 1 && <Screen1Customer data={sessionData} update={updateSession} onNext={nextStep} />}
                    {activeTab === 'record' && step === 2 && <Screen2Fitting data={sessionData} update={updateSession} onNext={nextStep} onBack={prevStep} />}
                    {activeTab === 'record' && step === 3 && <Screen3Context data={sessionData} update={updateSession} onNext={nextStep} onBack={prevStep} />}
                    {activeTab === 'record' && step === 4 && <Screen4Voc data={sessionData} update={updateSession} onComplete={handleComplete} onBack={prevStep} />}

                    {activeTab === 'customers' && <div className="flex items-center justify-center h-full text-textSecondary font-semibold">고객 목록 (Phase 5에서 구현)</div>}
                    {activeTab === 'messages' && <div className="flex items-center justify-center h-full text-textSecondary font-semibold">후속 관리 (Phase 5에서 구현)</div>}
                    {activeTab === 'dashboard' && <div className="flex items-center justify-center h-full text-textSecondary font-semibold">대시보드 (Phase 5에서 구현)</div>}
                </main>

                {/* Bottom navigation */}
                <nav className="h-[72px] bg-white border-t border-borderGray flex shrink-0">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); if (tab.id === 'record') setStep(1); }}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors tap-active ${active ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {showSuccess && <SuccessOverlay />}
            </div>
        </div>
    );
}
