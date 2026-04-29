// ============================================
// 🔑 PUT YOUR APP ID HERE
// ============================================
// Get your App ID from: developers.deriv.com
// Default demo App ID is 16929 (for testing only)
// Replace with your own App ID for production

const APP_ID = "16929";  // <--- REPLACE THIS WITH YOUR APP ID

// For demo trading (recommended to start)
const USE_DEMO = true;    // true = demo account, false = real account

// WebSocket endpoint
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Export for use in script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_ID, USE_DEMO, WS_URL };
}
