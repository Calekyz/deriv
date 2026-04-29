// Complete Social Trading Platform
class SocialTrading {
    constructor() {
        this.topTraders = [];
        this.following = [];
        this.signals = [];
        this.chatMessages = [];
        this.currentUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            username: 'Trader_' + Math.floor(Math.random() * 1000),
            profit: 0,
            winRate: 0,
            followers: 0
        };
        
        this.init();
        this.setupEventListeners();
        this.startSignalSimulation();
    }

    init() {
        this.loadDemoTraders();
        this.loadSavedFollowing();
        this.displayLeaderboard();
        this.displaySignals();
        this.initChat();
    }

    setupEventListeners() {
        // Social tabs
        const tabs = document.querySelectorAll('.social-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.socialTab;
                this.switchSocialTab(tabName);
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
        
        // Period change
        const periodSelect = document.getElementById('leaderboardPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => this.displayLeaderboard());
        }
        
        // Copy settings
        const saveCopyBtn = document.getElementById('saveCopySettings');
        if (saveCopyBtn) {
            saveCopyBtn.addEventListener('click', () => this.saveCopySettings());
        }
        
        // Chat
        const sendBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');
        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
    }

    loadDemoTraders() {
        this.topTraders = [
            { id: 1, name: 'MasterTrader', profit: 15420, winRate: 78, followers: 1234, avatar: '🏆', trades: 342 },
            { id: 2, name: 'CryptoKing', profit: 8920, winRate: 65, followers: 892, avatar: '👑', trades: 567 },
            { id: 3, name: 'ForexWolf', profit: 6730, winRate: 72, followers: 645, avatar: '🐺', trades: 234 },
            { id: 4, name: 'BinaryQueen', profit: 5210, winRate: 81, followers: 432, avatar: '👸', trades: 178 },
            { id: 5, name: 'TechTrader', profit: 3450, winRate: 69, followers: 321, avatar: '🤖', trades: 456 },
            { id: 6, name: 'VolatilityPro', profit: 2890, winRate: 74, followers: 287, avatar: '📊', trades: 223 },
            { id: 7, name: 'SignalMaster', profit: 2340, winRate: 71, followers: 198, avatar: '📡', trades: 189 },
            { id: 8, name: 'ScalperX', profit: 1870, winRate: 83, followers: 156, avatar: '⚡', trades: 890 }
        ];
    }

    loadSavedFollowing() {
        const saved = localStorage.getItem('following_traders');
        if (saved) {
            this.following = JSON.parse(saved);
        }
    }

    saveCopySettings() {
        const maxAmount = document.getElementById('maxCopyAmount').value;
        const multiplier = document.getElementById('copyMultiplier').value;
        
        localStorage.setItem('copy_settings', JSON.stringify({
            maxAmount: maxAmount,
            multiplier: multiplier
        }));
        
        window.showNotification('Copy trading settings saved!', 'success');
    }

    displayLeaderboard() {
        const container = document.getElementById('leaderboardList');
        if (!container) return;
        
        const period = document.getElementById('leaderboardPeriod')?.value || 'weekly';
        
        // Sort by profit
        const sorted = [...this.topTraders].sort((a, b) => b.profit - a.profit);
        
        container.innerHTML = `
            <div class="leaderboard-header">
                <span>Rank</span>
                <span>Trader</span>
                <span>Profit</span>
                <span>Win Rate</span>
                <span>Followers</span>
                <span>Action</span>
            </div>
            ${sorted.map((trader, index) => `
                <div class="leaderboard-row">
                    <span class="rank ${index < 3 ? `top-${index + 1}` : ''}">${index + 1}</span>
                    <span class="trader-info">
                        <span class="trader-avatar">${trader.avatar}</span>
                        <span class="trader-name">${trader.name}</span>
                    </span>
                    <span class="profit positive">+$${trader.profit.toLocaleString()}</span>
                    <span class="winrate ${trader.winRate >= 70 ? 'positive' : ''}">${trader.winRate}%</span>
                    <span class="followers">${trader.followers.toLocaleString()}</span>
                    <span class="action">
                        <button onclick="window.socialTrading.copyTrader(${trader.id})" class="copy-btn">
                            ${this.following.includes(trader.id) ? 'Following' : 'Copy'}
                        </button>
                    </span>
                </div>
            `).join('')}
        `;
    }

    copyTrader(traderId) {
        const trader = this.topTraders.find(t => t.id === traderId);
        
        if (this.following.includes(traderId)) {
            this.following = this.following.filter(id => id !== traderId);
            window.showNotification(`Stopped copying ${trader.name}`, 'info');
        } else {
            this.following.push(traderId);
            window.showNotification(`Now copying ${trader.name}! Their trades will be mirrored.`, 'success');
            
            // Start copy trading simulation
            this.startCopyTrading(trader);
        }
        
        localStorage.setItem('following_traders', JSON.stringify(this.following));
        this.displayLeaderboard();
        this.displayFollowing();
    }

    startCopyTrading(trader) {
        // Simulate copying trades from followed trader
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance of new trade
                const settings = JSON.parse(localStorage.getItem('copy_settings') || '{"maxAmount":100,"multiplier":1}');
                
                const tradeAmount = Math.min(settings.maxAmount, Math.random() * 50 + 10);
                const tradeType = Math.random() > 0.5 ? 'CALL' : 'PUT';
                
                // Execute copy trade
                if (window.tradingEngine) {
                    window.tradingEngine.placeTrade(tradeType, tradeAmount, 5);
                    window.showNotification(`📋 Copied ${trader.name}: ${tradeType} $${tradeAmount}`, 'info');
                }
            }
        }, 30000);
    }

    displayFollowing() {
        const container = document.getElementById('followingList');
        if (!container) return;
        
        if (this.following.length === 0) {
            container.innerHTML = '<p class="empty-state">Not following any traders yet. Go to Leaderboard to start copying!</p>';
            return;
        }
        
        const followingTraders = this.topTraders.filter(t => this.following.includes(t.id));
        
        container.innerHTML = `
            <h4>Traders You're Following</h4>
            ${followingTraders.map(trader => `
                <div class="following-item">
                    <div class="following-info">
                        <span class="trader-avatar">${trader.avatar}</span>
                        <div>
                            <strong>${trader.name}</strong>
                            <small>${trader.winRate}% win rate</small>
                        </div>
                    </div>
                    <button onclick="window.socialTrading.copyTrader(${trader.id})" class="unfollow-btn">Unfollow</button>
                </div>
            `).join('')}
        `;
    }

    displaySignals() {
        const container = document.getElementById('signalsList');
        if (!container) return;
        
        this.signals = [
            { id: 1, symbol: 'R_75', action: 'BUY', price: 1245.30, target: 1280, stopLoss: 1220, confidence: 85, time: new Date(), trader: 'SignalMaster' },
            { id: 2, symbol: 'R_100', action: 'SELL', price: 3420.15, target: 3380, stopLoss: 3450, confidence: 72, time: new Date(Date.now() - 3600000), trader: 'CryptoKing' },
            { id: 3, symbol: 'R_50', action: 'BUY', price: 567.80, target: 585, stopLoss: 555, confidence: 91, time: new Date(Date.now() - 7200000), trader: 'MasterTrader' }
        ];
        
        container.innerHTML = `
            <div class="signals-header">
                <span>Time</span>
                <span>Trader</span>
                <span>Symbol</span>
                <span>Action</span>
                <span>Entry</span>
                <span>Target</span>
                <span>Confidence</span>
                <span>Action</span>
            </div>
            ${this.signals.map(signal => `
                <div class="signal-row">
                    <span class="signal-time">${signal.time.toLocaleTimeString()}</span>
                    <span class="signal-trader">${signal.trader}</span>
                    <span class="signal-symbol">${signal.symbol}</span>
                    <span class="signal-action ${signal.action === 'BUY' ? 'buy' : 'sell'}">${signal.action}</span>
                    <span class="signal-price">$${signal.price}</span>
                    <span class="signal-target">$${signal.target}</span>
                    <span class="signal-confidence">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${signal.confidence}%"></div>
                        </div>
                        ${signal.confidence}%
                    </span>
                    <span class="signal-action-btn">
                        <button onclick="window.socialTrading.executeSignal(${signal.id})" class="execute-signal-btn">Execute</button>
                    </span>
                </div>
            `).join('')}
        `;
    }

    executeSignal(signalId) {
        const signal = this.signals.find(s => s.id === signalId);
        if (signal && window.tradingEngine) {
            window.tradingEngine.placeTrade(signal.action === 'BUY' ? 'CALL' : 'PUT', 50, 5);
            window.showNotification(`Executed ${signal.action} signal for ${signal.symbol}`, 'success');
        }
    }

    startSignalSimulation() {
        setInterval(() => {
            // Generate random AI signal
            const symbols = ['R_75', 'R_100', 'R_50', 'R_25'];
            const actions = ['BUY', 'SELL'];
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const randomPrice = Math.random() * 1000 + 500;
            const randomConfidence = Math.floor(Math.random() * 40) + 60;
            
            const newSignal = {
                id: Date.now(),
                symbol: randomSymbol,
                action: randomAction,
                price: randomPrice,
                target: randomPrice * (randomAction === 'BUY' ? 1.03 : 0.97),
                stopLoss: randomPrice * (randomAction === 'BUY' ? 0.98 : 1.02),
                confidence: randomConfidence,
                time: new Date(),
                trader: 'AI Signal Bot'
            };
            
            this.signals.unshift(newSignal);
            if (this.signals.length > 20) this.signals.pop();
            this.displaySignals();
        }, 60000);
    }

    initChat() {
        // Load demo messages
        this.chatMessages = [
            { user: 'MasterTrader', message: 'Great trading day today!', time: new Date(Date.now() - 300000), avatar: '🏆' },
            { user: 'CryptoKing', message: 'BTC looking bullish 📈', time: new Date(Date.now() - 600000), avatar: '👑' },
            { user: 'ForexWolf', message: 'EUR/USD breaking resistance', time: new Date(Date.now() - 900000), avatar: '🐺' }
        ];
        
        this.displayChatMessages();
        
        // Simulate new messages
        setInterval(() => {
            const users = ['MasterTrader', 'CryptoKing', 'ForexWolf', 'BinaryQueen', 'TechTrader'];
            const messages = ['Nice trade!', 'Looking good', 'What do you think about R_75?', 'Bullish signal!', 'Taking profits now'];
            
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            this.chatMessages.push({
                user: randomUser,
                message: randomMessage,
                time: new Date(),
                avatar: this.topTraders.find(t => t.name === randomUser)?.avatar || '👤'
            });
            
            if (this.chatMessages.length > 50) this.chatMessages.shift();
            this.displayChatMessages();
        }, 15000);
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.chatMessages.push({
                user: this.currentUser.username,
                message: message,
                time: new Date(),
                avatar: '👤'
            });
            
            this.displayChatMessages();
            input.value = '';
        }
    }

    displayChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = this.chatMessages.map(msg => `
            <div class="chat-message">
                <span class="chat-avatar">${msg.avatar}</span>
                <div class="chat-content">
                    <span class="chat-user">${msg.user}</span>
                    <span class="chat-time">${msg.time.toLocaleTimeString()}</span>
                    <p class="chat-text">${msg.message}</p>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    switchSocialTab(tabName) {
        const views = ['leaderboardView', 'copyTradingView', 'signalsView', 'chatView'];
        views.forEach(view => {
            const elem = document.getElementById(view);
            if (elem) elem.classList.remove('active');
        });
        
        const activeView = document.getElementById(tabName + 'View');
        if (activeView) activeView.classList.add('active');
        
        if (tabName === 'copy-trading') {
            this.displayFollowing();
        }
    }
}

// Initialize social trading
window.socialTrading = new SocialTrading();
