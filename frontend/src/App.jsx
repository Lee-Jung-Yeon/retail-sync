import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InputScreen from './screens/InputScreen';
import MemoScreen from './screens/MemoScreen';
import StoreDashboardScreen from './screens/StoreDashboardScreen';
import HqDashboardScreen from './screens/HqDashboardScreen';
import TopNavigation from './components/TopNavigation';
import StaffLoginGate from './components/StaffLoginGate';

function AppLayout() {
    const location = useLocation();
    const isInputRoute = location.pathname === '/input';

    return (
        <div className={`min-h-screen ${isInputRoute ? 'bg-[#CBD5E1]' : 'bg-surface'}`}>
            {!isInputRoute && <TopNavigation />}
            <main>
                <Routes>
                    <Route path="/input" element={<StaffLoginGate><InputScreen /></StaffLoginGate>} />
                    <Route path="/memo" element={<StaffLoginGate><MemoScreen /></StaffLoginGate>} />
                    <Route path="/store" element={<StoreDashboardScreen />} />
                    <Route path="/hq" element={<HqDashboardScreen />} />
                    <Route path="/" element={<Navigate to="/input" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}
