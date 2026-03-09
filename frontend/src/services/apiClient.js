// Simple API client stub for Phase 3 Data Pipeline validation
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = {
    async submitSession(data) {
        console.log('🚀 [Data Pipeline] Submitting session data:', data);
        // Using local testing staff_id/store_code context for POC
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(`${API_BASE}/sessions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const result = await res.json();
                return { success: true, session_id: result.session_id };
            }
            throw new Error('Server error');
        } catch (e) {
            console.warn('Fallback to mock', e);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({ success: true, session_id: 'mock-uuid-1234' });
                }, 800);
            });
        }
    },

    async getLatestSession(staffId) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/sessions/latest?staff_id=${staffId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async submitMemo(sessionId, memoData) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/sessions/${sessionId}/memos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(memoData)
            });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // --- Dashboard endpoints ---
    async getManagerDashboard(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/manager/${storeCode}/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    },
    async getStoreWeeklyReport(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/store/${storeCode}/weekly`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return []; }
    },
    async getNonPurchaseAnalysis(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const query = storeCode ? `?store_code=${storeCode}` : '';
            const res = await fetch(`${API_BASE}/dashboard/hq/non-purchase${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return []; }
    },
    async getVocAnalysis(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const query = storeCode ? `?store_code=${storeCode}` : '';
            const res = await fetch(`${API_BASE}/dashboard/hq/voc-analysis${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    },
    async getHqKpiSummary() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/hq/kpi-summary`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    }
};
