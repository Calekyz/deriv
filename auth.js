// Authentication Handler
class AuthManager {
    constructor() {
        this.apiToken = null;
        this.accountType = null;
        this.isAuthenticated = false;
        
        // Check if demo mode is enabled
        if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE === true) {
            console.log('🔧 DEMO MODE ENABLED - Showing UI with simulated data');
            this.demoMode = true;
            this.skipToDashboard();
            return;
        }
        
        this.init();
    }
    
    init() {
        // Check if already logged in
        const savedToken = localStorage.getItem('deriv_api_token');
        const savedType = localStorage.getItem('deriv_account_type');
        
        if (savedToken && savedType) {
            this.apiToken = savedToken;
            this.accountType = savedType;
            this.isAuthenticated = true;
            window.location.href = 'dashboard.html';
        }
        
        this.setupEventListeners();
        this.setupOAuthLogin();
    }
    
    setupOAuthLogin() {
        const oauthBtn = document.getElementById('oauthLoginBtn');
        if (oauthBtn && typeof DerivAuth !== 'undefined') {
            oauthBtn.addEventListener('click', async () => {
                try {
                    await DerivAuth.requestOidcAuthentication({
                        redirectCallbackUri: `${window.location.origin}/callback.html`,
                        clientId: 'YOUR_CLIENT_ID',  // Replace with your OAuth client ID
                    });
                } catch (error) {
                    this.showError('OAuth login failed: ' + error.message);
                }
            });
        }
    }
    
    skipToDashboard() {
        // Skip login and go straight to dashboard with demo data
        localStorage.setItem('demo_mode', 'true');
        localStorage.setItem('demo_balance', '10000');
        window.location.href = 'dashboard.html';
    }
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        const testButton = document.getElementById('testConnectionBtn');
        if (testButton) {
            testButton.addEventListener('click', () => this.testConnection());
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const apiToken = document.getElementById('apiToken').value;
        const accountType = document.getElementById('accountType').value;
        
        if (!apiToken) {
            this.showError('Please enter your API token');
            return;
        }
        
        this.showLoading('Connecting to Deriv...');
        
        const isValid = await this.testDerivConnection(apiToken);
        
        if (isValid) {
            localStorage.setItem('deriv_api_token', apiToken);
            localStorage.setItem('deriv_account_type', accountType);
            localStorage.removeItem('demo_mode');
            
            this.showSuccess('Connected successfully! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            this.showError('Invalid API token. Please check and try again.');
        }
    }
    
    async testDerivConnection(apiToken) {
        return new Promise((resolve) => {
            const ws = new WebSocket(WS_URL);
            let resolved = false;
            
            const timeout = setTimeout(() => {
                if (!resolved) {
                    ws.close();
                    resolve(false);
                }
            }, 10000);
            
            ws.onopen = () => {
                ws.send(JSON.stringify({ 
                    authorize: apiToken, 
                    req_id: 1 
                }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.authorize) {
                    clearTimeout(timeout);
                    resolved = true;
                    ws.close();
                    resolve(true);
                } else if (data.error) {
                    clearTimeout(timeout);
                    resolved = true;
                    ws.close();
                    resolve(false);
                }
            };
            
            ws.onerror = () => {
                clearTimeout(timeout);
                resolved = true;
                resolve(false);
            };
        });
    }
    
    showLoading(message) {
        const btn = document.querySelector('.btn-auth');
        if (btn) {
            btn.textContent = message;
            btn.disabled = true;
        }
    }
    
    showError(message) {
        const btn = document.querySelector('.btn-auth');
        if (btn) {
            btn.textContent = 'Connect with API Token →';
            btn.disabled = false;
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color:#ef4444;margin-top:1rem;padding:0.8rem;background:rgba(239,68,68,0.1);border-radius:8px';
        
        const form = document.querySelector('.auth-form');
        const existingError = form?.querySelector('.error-message');
        if (existingError) existingError.remove();
        if (form) form.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = 'color:#10b981;margin-top:1rem;padding:0.8rem;background:rgba(16,185,129,0.1);border-radius:8px';
        
        const form = document.querySelector('.auth-form');
        if (form) form.appendChild(successDiv);
    }
}

// Initialize auth on login page
if (window.location.pathname.includes('login.html')) {
    window.authManager = new AuthManager();
}
