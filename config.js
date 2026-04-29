// ============================================
// 🔑 DERIV APP CONFIGURATION
// ============================================

const APP_ID = "3301r2nWfUV4FzUj536sd";

// WebSocket endpoint
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_ID, WS_URL };
}
