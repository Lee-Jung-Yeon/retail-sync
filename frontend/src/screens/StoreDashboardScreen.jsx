import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Smile, PieChart as PieChartIcon, LayoutList, Calendar, Target } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiClient } from '../services/apiClient';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9'];

// Mock data for lists since explicit endpoints for today actions were not built yet in Phase 1
const MOCK_RECORDS = [
    { time: '14:30', cust: '여성/20대', item: '울 혼방 셋업 재킷', buy: 'O', reason: '-', voc: 5 },
    { time: '15:10', cust: '남성/30대', item: '캐시미어 블렌드 코트', buy: 'X', reason: '가격 고민', voc: 4 },
    { time: '16:05', cust: '여성/30대', item: '슬림핏 코튼 팬츠', buy: 'O', reason: '-', voc: 5 },
];

const MOCK_FOLLOW_UPS = [
    { time: '내일 14:00', target: '김지연 고객님 (4920)', action: '입고 알림 문자 발송' },
    { time: '모레 10:00', target: '박민수 고객님 (1192)', action: '사이즈 교환 해피콜' },
];

export default function StoreDashboardScreen() {
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [npReasons, setNpReasons] = useState([]);
    const [vocInfo, setVocInfo] = useState({ avg_score: 0 });

    const fetchDashboard = async () => {
        const storeCode = 'KR-001'; // hardcoded for POC 롯데 건대점
        const [_mgr, _week, _np, _voc] = await Promise.all([
            apiClient.getManagerDashboard(storeCode),
            apiClient.getStoreWeeklyReport(storeCode),
            apiClient.getNonPurchaseAnalysis(storeCode),
            apiClient.getVocAnalysis(storeCode)
        ]);

        if (_mgr) setStats(_mgr);
        if (_week) {
            const formatted = _week.map(d => ({
                day: new Date(d.snapshot_date).toLocaleDateString('ko-KR', { weekday: 'short' }),
                visitors: Number(d.total_visitors)
            }));
            if (formatted.length === 0) {
                // Mock chart data if DB lacks historical batch data
                setWeeklyData([
                    { day: '월', visitors: 112 }, { day: '화', visitors: 98 },
                    { day: '수', visitors: 145 }, { day: '목', visitors: 130 },
                    { day: '금', visitors: 180 }, { day: '토', visitors: 320 },
                    { day: '일', visitors: 290 }
                ]);
            } else {
                setWeeklyData(formatted);
            }
        }
        if (_np) {
            const arr = _np.map(r => ({ name: r.reason_tag, value: Number(r.count) }));
            setNpReasons(arr.length > 0 ? arr : [{ name: '데이터 없음', value: 1 }]);
        }
        if (_voc) setVocInfo(_voc);
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const npCount = npReasons.reduce((acc, curr) => curr.name !== '데이터 없음' ? acc + curr.value : acc, 0);

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1280px] flex flex-col gap-6">

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">오늘 접객 건수</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {stats ? stats.total_visitors : '-'} <span className="text-sm font-medium text-gray-400">건</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><ShoppingBag size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">피팅→구매 전환율</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {stats && stats.fitting_conversion_funnel.fittings > 0
                                ? ((stats.fitting_conversion_funnel.purchases / stats.fitting_conversion_funnel.fittings) * 100).toFixed(1)
                                : '0.0'} <span className="text-sm font-medium text-gray-400">%</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Smile size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">평균 만족도</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {vocInfo.avg_score > 0 ? Number(vocInfo.avg_score).toFixed(1) : '-'} <span className="text-sm font-medium text-gray-400">/ 5.0</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><PieChartIcon size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">미구매 데이터 수집</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {npCount} <span className="text-sm font-medium text-gray-400">건</span>
                        </div>
                    </div>
                </div>

                {/* Central Charts */}
                <div className="grid grid-cols-2 gap-6 h-[340px]">
                    {/* Donut Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">미구매 사유 분포</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={npReasons}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {npReasons.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip wrapperClassName="rounded-lg shadow-lg" />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">최근 7일 접객 건수 추이</h3>
                        <div className="flex-1 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Lists */}
                <div className="grid grid-cols-2 gap-6 flex-1">
                    {/* Today Records */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4 flex items-center gap-2">
                            <LayoutList size={18} /> 오늘 접객 기록 (최근)
                        </h3>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-[14px]">
                                <thead className="text-gray-500 bg-gray-50 uppercase text-[12px]">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg font-semibold">시간</th>
                                        <th className="px-4 py-3 font-semibold">고객 유형</th>
                                        <th className="px-4 py-3 font-semibold">상품/구매</th>
                                        <th className="px-4 py-3 font-semibold">미구매 사유</th>
                                        <th className="px-4 py-3 rounded-tr-lg rounded-br-lg font-semibold">만족도</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_RECORDS.map((rec, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3.5 text-gray-500 font-medium">{rec.time}</td>
                                            <td className="px-4 py-3.5 font-medium">{rec.cust}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium truncate max-w-[120px]">{rec.item}</div>
                                                <div className={`text-[12px] font-bold ${rec.buy === 'O' ? 'text-accentGreen' : 'text-gray-400'}`}>
                                                    {rec.buy === 'O' ? '구매 확정' : '구매 안 함'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-accentRed font-medium text-[13px]">{rec.reason}</td>
                                            <td className="px-4 py-3.5 font-bold text-primary">{rec.voc} 점</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Follow ups */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4 flex items-center gap-2">
                            <Target size={18} /> 후속 액션 예정 리스트
                        </h3>
                        <div className="flex flex-col gap-3">
                            {MOCK_FOLLOW_UPS.map((f, i) => (
                                <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
                                    <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex flex-col justify-center flex-1">
                                        <div className="text-[13px] font-bold text-primary mb-1">{f.time}</div>
                                        <div className="font-bold text-[15px] mb-1">{f.action}</div>
                                        <div className="text-[13px] text-gray-500">{f.target}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-[13px] font-bold rounded-lg transition-colors">처리</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
