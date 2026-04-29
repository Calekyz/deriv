// Trading Engine with Demo Mode Support
class TradingEngine {
    constructor() {
        this.ws = null;
        this.apiToken = localStorage.getItem('deriv_api_token');
        this.accountType = localStorage.getItem('deriv_account_type');
        this.demoMode = localStorage.getItem('demo_mode') === 'true';
        this.isConnected = false;
        this.currentSymbol = 'R_75';
        this.currentPrice = 0;
        this.activeTrades = [];
        this.tradeHistory = [];
        this.demoBalance = parseFloat(localStorage.getItem('demo_balance') || '10000');
        this.demoPositions = [];
        
        this.init();
    }
    
    init() {
        // Demo mode - show simulated UI
        if (this.demoMode) {
            console.log('🔧 DEMO MODE ACTIVE - Using simulated trading data');
            this.startDemoSimulation();
            this.setupEventListeners();
            this.loadSettings();
            this.updateUIWithDemoData();
            this.showDemoBanner();
            return;
        }
        
        // Real mode - need API token
        if (!this.apiToken) {
            window.location.href = 'login.html';
            return;
        }
        
        this.connect();
        this.setupEventListeners();
        this.loadSettings();
    }
    
    startDemoSimulation() {
        this.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Set demo account info
        const accountIdElem = document.getElementById('accountId');
        if (accountIdElem) accountIdElem.textContent = 'DEMO_ACCOUNT';
        
        const accountTypeElem = document.getElementById('accountType');
        if (accountTypeElem) accountTypeElem.textContent = 'Demo Mode (Simulated)';
        
        // Start simulated price feed
        this.startPriceSimulation();
        
        // Start simulated portfolio updates
        this.startPortfolioSimulation();
        
        // Load demo trade history
        this.loadDemoTradeHistory();
    }
    
    startPriceSimulation() {
        this.currentPrice = 1245.75;
        this.updatePrice({ tick: { quote: this.currentPrice } });
        
        this.priceInterval = setInterval(() => {
            // Random walk price movement
            const change = (Math.random() - 0.5) * 4;
            this.currentPrice = Math.max(100, this.currentPrice + change);
            
            this.updatePrice({ tick: { quote: this.currentPrice } });
            
            // Update daily change
            const dailyChangeElem = document.getElementById('dailyChange');
            if (dailyChangeElem) {
                const changePercent = ((this.currentPrice - 1200) / 1200 * 100).toFixed(2);
                dailyChangeElem.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
                dailyChangeElem.style.color = changePercent >= 0 ? '#10b981' : '#ef4444';
            }
        }, 2000);
    }
    
    startPortfolioSimulation() {
        // Simulate active positions
        this.demoPositions = [
            { id: 1001, symbol: 'R_75', type: 'CALL', amount: 50, entryPrice: 1245.75, currentPrice: this.currentPrice, status: 'active' },
            { id: 1002, symbol: 'R_100', type: 'PUT', amount: 30, entryPrice: 3420.50, currentPrice: 3415.20, status: 'active' }
        ];
        
        this.displayActivePositions();
        
        // Update positions periodically
        setInterval(() => {
            this.demoPositions = this.demoPositions.map(pos => ({
                ...pos,
                currentPrice: pos.symbol === 'R_75' ? this.currentPrice : this.currentPrice * 2.7
            }));
            this.displayActivePositions();
        }, 3000);
    }
    
    updateUIWithDemoData() {
        // Update balance
        this.updateBalance({ balance: this.demoBalance });
        
        // Update stats
        const totalTradesElem = document.getElementById('totalTrades');
        if (totalTradesElem) totalTradesElem.textContent = '24';
        
        const winRateElem = document.getElementById('winRate');
        if (winRateElem) winRateElem.textContent = '68%';
        
        const totalPLElem = document.getElementById('totalPL');
        if (totalPLElem) {
            totalPLElem.textContent = '+$342.50';
            totalPLElem.style.color = '#10b981';
        }
        
        const activePositionsElem = document.getElementById('activePositions');
        if (activePositionsElem) activePositionsElem.textContent = '2';
    }
    
    loadDemoTradeHistory() {
        this.tradeHistory = [
            { time: new Date(Date.now() - 3600000), symbol: 'R_75', type: 'CALL', amount: 50, profit: 42.50, status: 'Won' },
            { time: new Date(Date.now() - 7200000), symbol: 'R_100', type: 'PUT', amount: 30, profit: -15.00, status: 'Lost' },
            { time: new Date(Date.now() - 10800000), symbol: 'R_50', type: 'CALL', amount: 25, profit: 21.25, status: 'Won' },
            { time: new Date(Date.now() - 14400000), symbol: 'R_75', type: 'PUT', amount: 40, profit: 38.00, status: 'Won' },
            { time: new Date(Date.now() - 18000000), symbol: 'R_100', type: 'CALL', amount: 20, profit: -10.00, status: 'Lost' }
        ];
        
        this.updateTradeHistory();
    }
    
    showDemoBanner() {
        const banner = document.createElement('div');
        banner.id = 'demoBanner';
        banner.innerHTML = `
            🔧 DEMO MODE ACTIVE - Using simulated data. 
            <a href="login.html" style="color: white; text-decoration: underline;">Click here to login</a> 
            with your real Deriv account for live trading.
        `;
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            text-align: center;
            padding: 10px;
            font-weight: bold;
            z-index: 10000;
            font-size: 14px;
            cursor: pointer;
        `;
        banner.onclick = () => {
            localStorage.removeItem('demo_mode');
            window.location.href = 'login.html';
        };
        document.body.prepend(banner);
        
        // Add padding to body to account for banner
        document.body.style.paddingTop = '40px';
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
        
        this.sendRequest({ get_account_settings: 1, req_id: 2 });
        this.sendRequest({ balance: 1, req_id: 3 });
        this.subscribeToSymbol(this.currentSymbol);
        this.sendRequest({ portfolio: 1, req_id: 4 });
        
        const accountIdElem = document.getElementById('accountId');
        if (accountIdElem) accountIdElem.textContent = data.authorize.loginid;
        
        const accountTypeElem = document.getElementById('accountType');
        if (accountTypeElem) accountTypeElem.textContent = this.accountType === 'demo' ? 'Demo Account' : 'Real Account';
        
        this.showNotification('Connected to Deriv successfully!', 'success');
    }
    
    subscribeToSymbol(symbol) {
        this.sendRequest({ ticks: symbol, subscribe: 1, req_id: 5 });
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
        
        if (this.lastPrice) {
            if (this.currentPrice > this.lastPrice) {
                priceElem.style.color = '#10b981';
            } else if (this.currentPrice < this.lastPrice) {
                priceElem.style.color = '#ef4444';
            }
            setTimeout(() => {
                if (priceElem) priceElem.style.color = '#6366f1';
            }, 500);
        }
        
        this.lastPrice = this.currentPrice;
    }
    
    updateBalance(balanceData) {
        const balanceElem = document.getElementById('balanceAmount');
        if (balanceElem) {
            balanceElem.textContent = `$${balanceData.balance.toFixed(2)}`;
        }
        
        const currencyElem = document.getElementById('balanceCurrency');
        if (currencyElem) currencyElem.textContent = 'USD';
    }
    
    placeTrade(type, amount, duration) {
        if (!this.isConnected && !this.demoMode) {
            this.showNotification('Not connected to Deriv', 'error');
            return;
        }
        
        if (amount <= 0) {
            this.showNotification('Invalid amount', 'error');
            return;
        }
        
        // Demo mode - simulate trade
        if (this.demoMode) {
            this.simulateDemoTrade(type, amount, duration);
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
    
    simulateDemoTrade(type, amount, duration) {
        // Simulate trade result
        const won = Math.random() > 0.45; // 55% win rate in demo
        const profitPercent = won ? 0.85 : -1;
        const profit = amount * profitPercent;
        
        this.demoBalance += profit;
        localStorage.setItem('demo_balance', this.demoBalance.toString());
        
        const trade = {
            id: Math.floor(Math.random() * 10000),
            symbol: this.currentSymbol,
            type: type,
            amount: amount,
            profit: profit,
            status: won ? 'Won' : 'Lost',
            time: new Date()
        };
        
        this.tradeHistory.unshift(trade);
        this.updateBalance({ balance: this.demoBalance });
        this.updateTradeHistory();
        
        const message = won 
            ? `✅ Demo Trade WON! +$${profit.toFixed(2)}` 
            : `❌ Demo Trade LOST! -$${Math.abs(profit).toFixed(2)}`;
        
        this.showNotification(message, won ? 'success' : 'error');
        
        // Update stats
        this.updateStats();
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
        
        this.sendRequest({ balance: 1, req_id: 8 });
        this.sendRequest({ portfolio: 1, req_id: 9 });
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
        
        const positions = this.demoMode ? this.demoPositions : this.activeTrades;
        
        if (positions.length === 0) {
            container.innerHTML = '<p class="empty-state">No active positions</p>';
            return;
        }
        
        container.innerHTML = positions.map(pos => {
            const pnl = pos.currentPrice ? (pos.currentPrice - pos.entryPrice) * (pos.amount / pos.entryPrice) : 0;
            
            return `
                <div class="position-item ${pos.type === 'CALL' ? 'call' : 'put'}">
                    <div>
                        <strong>${pos.symbol}</strong>
                        <small>${pos.type}</small>
                    </div>
                    <div>
                        <span>$${pos.amount}</span>
                        ${!this.demoMode ? `<small>ID: ${pos.id}</small>` : ''}
                    </div>
                    ${this.demoMode ? `<div class="pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    updateTradeHistory() {
        const tableBody = document.getElementById('recentTradesBody');
        if (!tableBody) return;
        
        if (this.tradeHistory.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No trades yet</td></tr>';
            return;
        }
        
        tableBody.innerHTML = this.tradeHistory.slice(0, 10).map(trade => `
            <tr>
                <td>${trade.time instanceof Date ? trade.time.toLocaleTimeString() : new Date(trade.time).toLocaleTimeString()}</td>
                <td>${trade.symbol}</td>
                <td>${trade.type}</td>
                <td>$${trade.amount}</td>
                <td class="${trade.profit >= 0 ? 'positive' : 'negative'}">${trade.profit >= 0 ? '+' : ''}$${trade.profit?.toFixed(2) || '0'}</td>
                <td><span class="status-badge ${trade.status === 'Won' ? 'won' : 'lost'}">${trade.status}</span></td>
            </tr>
        `).join('');
        
        this.updateStats();
    }
    
    updateStats() {
        const totalTrades = this.tradeHistory.length;
        const winningTrades = this.tradeHistory.filter(t => t.profit > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
        const totalPL = this.tradeHistory.reduce((sum, t) => sum + (t.profit || 0), 0);
        
        const totalElem = document.getElementById('totalTrades');
        const winRateElem = document.getElementById('winRate');
        const plElem = document.getElementById('totalPL');
        const activeElem = document.getElementById('activePositions');
        
        if (totalElem) totalElem.textContent = totalTrades;
        if (winRateElem) winRateElem.textContent = `${winRate}%`;
        if (plElem) {
            plElem.textContent = `${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}`;
            plElem.style.color = totalPL >= 0 ? '#10b981' : '#ef4444';
        }
        if (activeElem) activeElem.textContent = this.demoMode ? this.demoPositions.length : this.activeTrades.length;
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
        const symbolSelect = document.getElementById('tradeSymbol');
        if (symbolSelect) {
            symbolSelect.addEventListener('change', (e) => {
                this.currentSymbol = e.target.value;
                if (!this.demoMode) this.subscribeToSymbol(this.currentSymbol);
            });
        }
        
        const callBtn = document.querySelector('.call-btn');
        const putBtn = document.querySelector('.put-btn');
        
        if (callBtn && putBtn) {
            callBtn.addEventListener('click', () => {
                callBtn.classList.add('active');
                putBtn.classList.remove('active');
                const tradeTypeInput = document.getElementById('tradeType');
                if (tradeTypeInput) tradeTypeInput.value = 'CALL';
            });
            
            putBtn.addEventListener('click', () => {
                putBtn.classList.add('active');
                callBtn.classList.remove('active');
                const tradeTypeInput = document.getElementById('tradeType');
                if (tradeTypeInput) tradeTypeInput.value = 'PUT';
            });
        }
        
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                const typeElem = document.getElementById('tradeType');
                const amountElem = document.getElementById('tradeAmount');
                const durationElem = document.getElementById('tradeDuration');
                
                const type = typeElem?.value || 'CALL';
                const amount = parseFloat(amountElem?.value || 10);
                const duration = parseInt(durationElem?.value || 5);
                this.placeTrade(type, amount, duration);
            });
        }
        
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
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
        
        const saveBtn = document.getElementById('saveAllSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }
    }
    
    switchView(viewName) {
        const views = ['dashboard', 'trading', 'charts', 'portfolio', 'backtesting', 'social', 'analytics', 'settings'];
        views.forEach(view => {
            const viewElem = document.getElementById(`${view}View`);
            if (viewElem) viewElem.classList.remove('active');
        });
        
        const activeView = document.getElementById(`${viewName}View`);
        if (activeView) activeView.classList.add('active');
    }
    
    saveSettings() {
        const defaultAmount = document.getElementById('defaultAmount')?.value;
        const defaultDuration = document.getElementById('defaultDuration')?.value;
        const soundAlerts = document.getElementById('soundAlerts')?.checked;
        const dailyLossLimit = document.getElementById('dailyLossLimitSetting')?.value;
        const maxPositionSize = document.getElementById('maxPositionSize')?.value;
        
        if (defaultAmount) localStorage.setItem('default_amount', defaultAmount);
        if (defaultDuration) localStorage.setItem('default_duration', defaultDuration);
        if (soundAlerts) localStorage.setItem('sound_alerts', soundAlerts);
        if (dailyLossLimit) localStorage.setItem('daily_loss_limit', dailyLossLimit);
        if (maxPositionSize) localStorage.setItem('max_position_size', maxPositionSize);
        
        this.showNotification('Settings saved!', 'success');
    }
    
    loadSettings() {
        const defaultAmount = localStorage.getItem('default_amount');
        const defaultDuration = localStorage.getItem('default_duration');
        const soundAlerts = localStorage.getItem('sound_alerts');
        const dailyLossLimit = localStorage.getItem('daily_loss_limit');
        
        const amountInput = document.getElementById('defaultAmount');
        const durationInput = document.getElementById('defaultDuration');
        const soundCheckbox = document.getElementById('soundAlerts');
        const tradeAmount = document.getElementById('tradeAmount');
        const tradeDuration = document.getElementById('tradeDuration');
        const dailyLossInput = document.getElementById('dailyLossLimitSetting');
        
        if (defaultAmount && amountInput) amountInput.value = defaultAmount;
        if (defaultDuration && durationInput) durationInput.value = defaultDuration;
        if (soundAlerts && soundCheckbox) soundCheckbox.checked = soundAlerts === 'true';
        if (dailyLossLimit && dailyLossInput) dailyLossInput.value = dailyLossLimit;
        
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
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize trading engine on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    window.tradingEngine = new TradingEngine();
}
