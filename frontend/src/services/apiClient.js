// Simple API client stub for Phase 3 Data Pipeline validation
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = {
    async submitSession(data) {
        console.log('🚀 [Data Pipeline] Submitting session data:', data);

        // Simulate API call to NestJS backend
        // 1. Create Customer + Session (Deduplication happens in backend)
        // 2. Add Fitting + Non-purchase reasons
        // 3. Add Preferences + Memo
        // 4. Record VoC

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, session_id: 'mock-uuid-1234' });
            }, 800);
        });
    }
};
