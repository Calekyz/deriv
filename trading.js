// Trading Engine
class TradingEngine {
    constructor() {
        this.ws = null;
        this.apiToken = localStorage.getItem('deriv_api_token');
        this.accountType = localStorage.getItem('deriv_account_type');
        this.isConnected = false;
        this.currentSymbol = 'R_75';
        this.currentPrice = 0;
        this.activeTrades = [];
        this.tradeHistory = [];
        this.init();
    }
    
    init() {
        if (!this.apiToken) {
            window.location.href = 'login.html';
            return;
        }
        
        this.connect();
        this.setupEventListeners();
        this.loadSettings();
    }
    
    connect() {
        this.ws = new WebSocket(WS_URL);
        
        this.ws.onopen = () => this.handleOpen();
        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        this.ws.onerror = (error) => this.handleError(error);
        this.ws.onclose = () => this.handleClose();
    }
    
    handleOpen() {
        console.log('Connected to Deriv');
        this.sendRequest({ authorize: this.apiToken, req_id: 1 });
    }
    
    handleMessage(data) {
        if (data.authorize) {
            this.handleAuthorization(data);
        } else if (data.balance) {
            this.updateBalance(data.balance);
        } else if (data.tick) {
            this.updatePrice(data.tick);
        } else if (data.buy) {
            this.handleTradeConfirmation(data);
        } else if (data.portfolio) {
            this.updatePortfolio(data.portfolio);
        } else if (data.proposal) {
            this.handleProposal(data);
        } else if (data.error) {
            this.handleApiError(data.error);
        }
    }
    
    handleAuthorization(data) {
        this.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Get account info
        this.sendRequest({ get_account_settings: 1, req_id: 2 });
        this.sendRequest({ balance: 1, req_id: 3 });
        
        // Subscribe to market data
        this.subscribeToSymbol(this.currentSymbol);
        
        // Get portfolio
        this.sendRequest({ portfolio: 1, req_id: 4 });
        
        // Update UI
        const accountIdElem = document.getElementById('accountId');
        if (accountIdElem) {
            accountIdElem.textContent = data.authorize.loginid;
        }
        
        const accountTypeElem = document.getElementById('accountType');
        if (accountTypeElem) {
            accountTypeElem.textContent = this.accountType === 'demo' ? 'Demo Account' : 'Real Account';
        }
        
        this.showNotification('Connected to Deriv successfully!', 'success');
    }
    
    subscribeToSymbol(symbol) {
        this.sendRequest({
            ticks: symbol,
            subscribe: 1,
            req_id: 5
        });
    }
    
    updatePrice(tickData) {
        this.currentPrice = tickData.tick.quote;
        
        const priceElem = document.getElementById('livePrice');
        if (priceElem) {
            priceElem.textContent = `$${this.currentPrice.toFixed(4)}`;
        }
        
        const updateElem = document.getElementById('lastUpdate');
        if (updateElem) {
            updateElem.textContent = new Date().toLocaleTimeString();
        }
        
        // Update price color based on movement
        if (this.lastPrice) {
            if (this.currentPrice > this.lastPrice) {
                priceElem.style.color = '#10b981';
            } else if (this.currentPrice < this.lastPrice) {
                priceElem.style.color = '#ef4444';
            }
            setTimeout(() => {
                priceElem.style.color = '#6366f1';
            }, 500);
        }
        
        this.lastPrice = this.currentPrice;
    }
    
    updateBalance(balanceData) {
        const balanceElem = document.getElementById('balanceAmount');
        if (balanceElem) {
            balanceElem.textContent = `$${balanceData.balance.toFixed(2)}`;
        }
    }
    
    placeTrade(type, amount, duration) {
        if (!this.isConnected) {
            this.showNotification('Not connected to Deriv', 'error');
            return;
        }
        
        if (amount <= 0) {
            this.showNotification('Invalid amount', 'error');
            return;
        }
        
        this.showNotification('Getting price proposal...', 'info');
        
        this.sendRequest({
            proposal: 1,
            amount: amount,
            basis: 'stake',
            contract_type: type,
            currency: 'USD',
            duration: duration,
            duration_unit: 'm',
            symbol: this.currentSymbol,
            req_id: 6
        });
    }
    
    handleProposal(data) {
        if (data.error) {
            this.showNotification(`Proposal error: ${data.error.message}`, 'error');
            return;
        }
        
        const amount = parseFloat(document.getElementById('tradeAmount')?.value || 10);
        
        this.sendRequest({
            buy: data.proposal.id,
            price: amount,
            req_id: 7
        });
    }
    
    handleTradeConfirmation(data) {
        if (data.error) {
            this.showNotification(`Trade failed: ${data.error.message}`, 'error');
            return;
        }
        
        const trade = data.buy;
        this.showNotification(`Trade placed! Contract ID: ${trade.contract_id}`, 'success');
        
        // Refresh balance and portfolio
        this.sendRequest({ balance: 1, req_id: 8 });
        this.sendRequest({ portfolio: 1, req_id: 9 });
        
        // Add to trade history
        this.tradeHistory.unshift({
            id: trade.contract_id,
            symbol: this.currentSymbol,
            type: document.getElementById('tradeType')?.value || 'CALL',
            amount: parseFloat(document.getElementById('tradeAmount')?.value || 10),
            status: 'Active',
            time: new Date()
        });
        
        this.updateTradeHistory();
    }
    
    updatePortfolio(portfolioData) {
        if (portfolioData.portfolio && portfolioData.portfolio.contracts) {
            this.activeTrades = portfolioData.portfolio.contracts;
            this.displayActivePositions();
        }
    }
    
    displayActivePositions() {
        const container = document.getElementById('activePositionsList');
        if (!container) return;
        
        if (this.activeTrades.length === 0) {
            container.innerHTML = '<p class="empty-state">No active positions</p>';
            return;
        }
        
        container.innerHTML = this.activeTrades.map(trade => `
            <div class="position-item ${trade.contract_type.includes('CALL') ? 'call' : 'put'}">
                <div>
                    <strong>${trade.symbol}</strong>
                    <small>${trade.contract_type.includes('CALL') ? 'CALL' : 'PUT'}</small>
                </div>
                <div>
                    <span>$${trade.buy_price}</span>
                    <small>ID: ${trade.contract_id}</small>
                </div>
            </div>
        `).join('');
    }
    
    updateTradeHistory() {
        const tableBody = document.getElementById('recentTradesBody');
        if (!tableBody) return;
        
        if (this.tradeHistory.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No trades yet</td></tr>';
            return;
        }
        
        tableBody.innerHTML = this.tradeHistory.slice(0, 10).map(trade => `
            <tr>
                <td>${trade.time.toLocaleTimeString()}</td>
                <td>${trade.symbol}</td>
                <td>${trade.type}</td>
                <td>$${trade.amount}</td>
                <td><span style="color: #10b981">${trade.status}</span></td>
            </tr>
        `).join('');
        
        // Update stats
        this.updateStats();
    }
    
    updateStats() {
        const totalTrades = this.tradeHistory.length;
        const totalPL = this.tradeHistory.reduce((sum, t) => sum + (t.profit || 0), 0);
        
        const totalElem = document.getElementById('totalTrades');
        const plElem = document.getElementById('totalPL');
        const activeElem = document.getElementById('activePositions');
        
        if (totalElem) totalElem.textContent = totalTrades;
        if (plElem) plElem.textContent = `$${totalPL}`;
        if (activeElem) activeElem.textContent = this.activeTrades.length;
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('connectionText');
        
        if (statusDot) {
            statusDot.className = connected ? 'status-dot' : 'status-dot disconnected';
        }
        
        if (statusText) {
            statusText.textContent = connected ? 'Connected to Deriv' : 'Disconnected';
        }
    }
    
    setupEventListeners() {
        // Symbol selector
        const symbolSelect = document.getElementById('tradeSymbol');
        if (symbolSelect) {
            symbolSelect.addEventListener('change', (e) => {
                this.currentSymbol = e.target.value;
                this.subscribeToSymbol(this.currentSymbol);
            });
        }
        
        // Trade type buttons
        const callBtn = document.querySelector('.call-btn');
        const putBtn = document.querySelector('.put-btn');
        
        if (callBtn && putBtn) {
            callBtn.addEventListener('click', () => {
                callBtn.classList.add('active');
                putBtn.classList.remove('active');
                document.getElementById('tradeType').value = 'CALL';
            });
            
            putBtn.addEventListener('click', () => {
                putBtn.classList.add('active');
                callBtn.classList.remove('active');
                document.getElementById('tradeType').value = 'PUT';
            });
        }
        
        // Execute trade button
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                const type = document.getElementById('tradeType')?.value || 'CALL';
                const amount = parseFloat(document.getElementById('tradeAmount')?.value || 10);
                const duration = parseInt(document.getElementById('tradeDuration')?.value || 5);
                this.placeTrade(type, amount, duration);
            });
        }
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
                
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
        
        // Save settings
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }
    }
    
    switchView(viewName) {
        const views = ['dashboard', 'trading', 'portfolio', 'analytics', 'settings'];
        views.forEach(view => {
            const viewElem = document.getElementById(`${view}View`);
            if (viewElem) {
                viewElem.classList.remove('active');
            }
        });
        
        const activeView = document.getElementById(`${viewName}View`);
        if (activeView) {
            activeView.classList.add('active');
        }
    }
    
    saveSettings() {
        const defaultAmount = document.getElementById('defaultAmount')?.value;
        const defaultDuration = document.getElementById('defaultDuration')?.value;
        const soundAlerts = document.getElementById('soundAlerts')?.checked;
        
        if (defaultAmount) localStorage.setItem('default_amount', defaultAmount);
        if (defaultDuration) localStorage.setItem('default_duration', defaultDuration);
        if (soundAlerts) localStorage.setItem('sound_alerts', soundAlerts);
        
        this.showNotification('Settings saved!', 'success');
    }
    
    loadSettings() {
        const defaultAmount = localStorage.getItem('default_amount');
        const defaultDuration = localStorage.getItem('default_duration');
        const soundAlerts = localStorage.getItem('sound_alerts');
        
        const amountInput = document.getElementById('defaultAmount');
        const durationInput = document.getElementById('defaultDuration');
        const soundCheckbox = document.getElementById('soundAlerts');
        const tradeAmount = document.getElementById('tradeAmount');
        const tradeDuration = document.getElementById('tradeDuration');
        
        if (defaultAmount && amountInput) amountInput.value = defaultAmount;
        if (defaultDuration && durationInput) durationInput.value = defaultDuration;
        if (soundAlerts && soundCheckbox) soundCheckbox.checked = soundAlerts === 'true';
        
        if (tradeAmount && defaultAmount) tradeAmount.value = defaultAmount;
        if (tradeDuration && defaultDuration) tradeDuration.value = defaultDuration;
    }
    
    sendRequest(request) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(request));
        }
    }
    
    handleError(error) {
        console.error('WebSocket error:', error);
        this.showNotification('Connection error', 'error');
    }
    
    handleClose() {
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.showNotification('Disconnected from Deriv. Reconnecting...', 'error');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
    }
    
    handleApiError(error) {
        console.error('API Error:', error);
        this.showNotification(`Error: ${error.message}`, 'error');
    }
    
    showNotification(message, type) {
        const resultDiv = document.getElementById('tradeResult');
        if (resultDiv) {
            resultDiv.textContent = message;
            resultDiv.className = `trade-result ${type}`;
            setTimeout(() => {
                resultDiv.className = 'trade-result';
                resultDiv.textContent = '';
            }, 5000);
        }
        
        // Also show as console log
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize trading engine on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    window.tradingEngine = new TradingEngine();
}
