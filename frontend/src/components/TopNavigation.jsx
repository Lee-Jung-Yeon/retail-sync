import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Edit3, LayoutDashboard, Building2 } from 'lucide-react';

export default function TopNavigation() {
    return (
        <header className="h-16 bg-primary flex items-center justify-between px-8 text-white min-w-[1024px]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">Retail Sync Desk</span>
            </div>

            <nav className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <NavLink
                    to="/memo"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <Edit3 size={16} /> 노트북 메모
                </NavLink>
                <NavLink
                    to="/store"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <LayoutDashboard size={16} /> 매장 대시보드
                </NavLink>
                <NavLink
                    to="/hq"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <Building2 size={16} /> 본사 통합 대시보드
                </NavLink>
            </nav>

            <div className="flex items-center gap-3">
                <span className="text-white/70 text-[14px]">롯데 건대점</span>
                <div className="w-8 h-8 flex items-center justify-center border border-white/30 rounded-full font-bold text-[13px]">
                    JS
                </div>
            </div>
        </header>
    );
}
