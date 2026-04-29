// Authentication Handler
class AuthManager {
    constructor() {
        this.apiToken = null;
        this.accountType = null;
        this.isAuthenticated = false;
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
        
        // Test connection to Deriv
        const isValid = await this.testDerivConnection(apiToken);
        
        if (isValid) {
            // Save credentials
            localStorage.setItem('deriv_api_token', apiToken);
            localStorage.setItem('deriv_account_type', accountType);
            
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
        btn.textContent = message;
        btn.disabled = true;
    }
    
    showError(message) {
        const btn = document.querySelector('.btn-auth');
        btn.textContent = 'Connect to Deriv →';
        btn.disabled = false;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.marginTop = '1rem';
        errorDiv.style.padding = '0.8rem';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        errorDiv.style.borderRadius = '8px';
        
        const form = document.querySelector('.auth-form');
        const existingError = form.querySelector('.error-message');
        if (existingError) existingError.remove();
        form.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.color = '#10b981';
        successDiv.style.marginTop = '1rem';
        successDiv.style.padding = '0.8rem';
        successDiv.style.background = 'rgba(16, 185, 129, 0.1)';
        successDiv.style.borderRadius = '8px';
        
        const form = document.querySelector('.auth-form');
        form.appendChild(successDiv);
    }
}

// Initialize auth on login page
if (window.location.pathname.includes('login.html')) {
    new AuthManager();
}
