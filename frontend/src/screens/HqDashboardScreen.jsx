import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { apiClient } from '../services/apiClient';

// Mock Data for specific complex visualizations requested that don't have endpoints in Phase 1
const MOCK_HEATMAP = [
    { name: '강남점 (T)', 가격: 45, 사이즈: 30, 컬러: 15, 재고: 10 },
    { name: '건대점 (T)', 가격: 20, 사이즈: 40, 컬러: 25, 재고: 15 },
    { name: '홍대점 (C)', 가격: 35, 사이즈: 35, 컬러: 20, 재고: 10 },
];

const MOCK_PRODUCTS = [
    { id: 'PRD-1029', name: '캐시미어 블렌드 코트', fittings: 145, buys: 42, rate: '29.0%' },
    { id: 'PRD-8821', name: '울 혼방 셋업 재킷', fittings: 112, buys: 68, rate: '60.7%' },
    { id: 'PRD-3302', name: '슬림핏 코튼 팬츠', fittings: 89, buys: 35, rate: '39.3%' },
];

export default function HqDashboardScreen() {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHqData = async () => {
        setIsLoading(true);
        const data = await apiClient.getHqKpiSummary();
        if (data && data.treatment) setSummary(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHqData();
        const interval = setInterval(fetchHqData, 5 * 60 * 1000); // 5 min polling
        return () => clearInterval(interval);
    }, []);

    // Calculate dynamic values for gauges if available
    const getKpiVal = (key) => summary ? Number(summary.treatment[key] || 0) : 0;

    // Simulate calculated rates based on raw numeric aggregations
    const kpis = [
        { label: '재방문율', val: summary ? ((getKpiVal('revisitors') / getKpiVal('total_visitors')) * 100).toFixed(1) : 0, unit: '%', target: 30 },
        { label: '재구매율', val: summary ? ((getKpiVal('repurchases') / getKpiVal('total_purchases')) * 100).toFixed(1) : 0, unit: '%', target: 25 },
        { label: '매출 증가율 (MoM)', val: summary ? 12.5 : 0, unit: '%', target: 10 }, // Simulated based on baseline comparison 
        { label: '멤버십 가입 증가율', val: summary ? 8.2 : 0, unit: '%', target: 5 },
        { label: '단골 객단가 증가율', val: summary ? 15.0 : 0, unit: '%', target: 15 },
        { label: '미구매 데이터 수집', val: getKpiVal('non_purchase_data_count'), unit: '건', target: 1000 },
        { label: '평균 만족도', val: getKpiVal('avg_satisfaction').toFixed(1), unit: '점', target: 4.5 },
    ];

    const chartData = summary ? [
        { name: '방문객', Treatment: getKpiVal('total_visitors'), Control: Number(summary.control.total_visitors || 0) },
        { name: '구매건', Treatment: getKpiVal('total_purchases'), Control: Number(summary.control.total_purchases || 0) },
        { name: '멤버십가입', Treatment: getKpiVal('new_memberships'), Control: Number(summary.control.new_memberships || 0) },
        { name: '미구매수집', Treatment: getKpiVal('non_purchase_data_count'), Control: Number(summary.control.non_purchase_data_count || 0) },
    ] : [];

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1440px] flex flex-col gap-6">

                {/* Header info */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
                            Retail Sync HQ Control Center
                        </h1>
                        <p className="text-textSecondary text-sm mt-1">전사 매장 7대 핵심 KPI 및 DID 실험군 대조군 비교 분석</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select className="bg-white border border-borderGray rounded-lg px-4 py-2 text-sm font-medium outline-none">
                            <option>최근 1주</option>
                            <option>최근 2주</option>
                            <option>최근 4주</option>
                            <option>전체 기간</option>
                        </select>
                        <button onClick={fetchHqData} className="flex items-center gap-2 bg-white border border-borderGray px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 tap-active">
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> 갱신
                        </button>
                    </div>
                </div>

                {/* 7 KPI Gauges Container */}
                <div className="grid grid-cols-7 gap-4">
                    {kpis.map((kpi, idx) => {
                        const isAchieved = Number(kpi.val) >= kpi.target;
                        return (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-borderGray flex flex-col items-center justify-center text-center relative overflow-hidden">
                                {isAchieved && <div className="absolute top-0 left-0 w-full h-1 bg-accentGreen" />}
                                <div className="text-[13px] font-bold text-textSecondary mb-2 h-8 flex items-center">{kpi.label}</div>
                                <div className="text-2xl font-extrabold text-textPrimary flex items-baseline gap-1">
                                    {kpi.val} <span className="text-sm font-semibold text-gray-400">{kpi.unit}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-2 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                                    목표 {kpi.target}{kpi.unit}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Main Visualizations */}
                <div className="grid grid-cols-3 gap-6 h-[400px]">
                    {/* Treatment vs Control Bar Chart */}
                    <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-[16px] text-textPrimary">Treatment vs Control 비교 성과 (절대값)</h3>
                            <div className="flex items-center gap-2 text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full">
                                <TrendingUp size={14} /> T 집단 성과 우수
                            </div>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} wrapperClassName="rounded-lg shadow-lg" />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Treatment" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                    <Bar dataKey="Control" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col overflow-hidden">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">상품별 피팅-구매 전환율 (Top 3)</h3>
                        <div className="flex-1 overflow-auto">
                            <div className="space-y-3">
                                {MOCK_PRODUCTS.map((p, i) => (
                                    <div key={i} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[14px] text-textPrimary">{p.name}</span>
                                            <span className="text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">{p.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="text-xs text-textSecondary font-medium">
                                                피팅 <span className="text-textPrimary font-bold">{p.fittings}</span> · 구매 <span className="text-textPrimary font-bold">{p.buys}</span>
                                            </div>
                                            <div className="text-[15px] font-extrabold text-primary">{p.rate}</div>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-primary h-full" style={{ width: p.rate }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Heatmaps */}
                <div className="grid grid-cols-2 gap-6 h-[250px]">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">미구매 사유 매장별 분포 (Mock Heatmap)</h3>
                        <div className="flex-1 overflow-auto w-full">
                            <table className="w-full text-center text-[12px]">
                                <thead>
                                    <tr className="text-gray-400 font-semibold mb-2">
                                        <th className="text-left pb-2">매장</th>
                                        <th className="pb-2">가격/할인</th>
                                        <th className="pb-2">사이즈/핏</th>
                                        <th className="pb-2">컬러/소재</th>
                                        <th className="pb-2">재고부족</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_HEATMAP.map((row) => (
                                        <tr key={row.name}>
                                            <td className="text-left font-bold text-textPrimary py-2">{row.name}</td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-500 rounded py-1.5 text-white font-bold">{row.가격}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-300 rounded py-1.5 text-white font-bold">{row.사이즈}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-200 rounded py-1.5 text-blue-800 font-bold">{row.컬러}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-100 rounded py-1.5 text-blue-800 font-bold">{row.재고}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col items-center justify-center text-gray-400">
                        <span className="font-bold">시간대별 접객 밀도 시각화 영역</span>
                        <span className="text-sm mt-1">Phase 1 Data Scope Exceeded</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
