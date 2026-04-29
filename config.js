// ============================================
// 🔑 DERIV APP CONFIGURATION
// ============================================

const APP_ID = "3301r2nWfUV4FzUj536sd";

// For demo trading (recommended to start)
const USE_DEMO = true;

// WebSocket endpoint
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Export for use in script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_ID, USE_DEMO, WS_URL };
}
