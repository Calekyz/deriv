// ============================================
// 🔑 DERIV APP CONFIGURATION
// ============================================

// YOUR APP ID - Replace with your own
const APP_ID = "3301r2nWfUV4FzUj536sd";

// DEMO MODE - Set to true to see UI without login
// This shows fake/simulated data for preview purposes
const DEMO_MODE = true;  // ← CHANGE TO false when ready for real trading

// WebSocket endpoint
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_ID, WS_URL, DEMO_MODE };
}
