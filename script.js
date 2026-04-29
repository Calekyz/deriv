// Trading Platform Core Logic
let ws = null;
let isConnected = false;
let currentBalance = 0;
let currentSymbol = 'R_75';
let activeSubscriptions = [];
let activeTrades = [];

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const balanceElement = document.getElementById('balance');
const accountIdElement = document.getElementById('accountId');
const currencyElement = document.getElementById('currency');
const currentPriceElement = document.getElementById('currentPrice');
const lastUpdatedElement = document.getElementById('lastUpdated');
const tradeButton = document.getElementById('tradeButton');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const symbolSelect = document.getElementById('symbol');
const tradeMessage = document.getElementById('tradeMessage');
const activeTradesList = document.getElementById('activeTradesList');

// Initialize event listeners
function initEventListeners() {
    connectButton.addEventListener('click', connectToDeriv);
    disconnectButton.addEventListener('click', disconnectFromDeriv);
    tradeButton.addEventListener('click', placeTrade);
    symbolSelect.addEventListener('change', (e) => {
        currentSymbol = e.target.value;
        if (isConnected) {
            subscribeToSymbol(currentSymbol);
        }
    });
}

// Connect to Deriv
function connectToDeriv() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        showMessage('Already connected!', 'error');
        return;
    }

    showMessage('Connecting to Deriv...', 'success');
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket connected');
        isConnected = true;
        updateConnectionStatus(true);
        authorize();
    };

    ws.onmessage = (event) => {
        handleMessage(JSON.parse(event.data));
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showMessage('Connection error. Check your network.', 'error');
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected = false;
        updateConnectionStatus(false);
        showMessage('Disconnected from Deriv', 'error');
    };
}

// Authorize with Deriv
function authorize() {
    const authorizeRequest = {
        authorize: "YOUR_API_TOKEN", // Users need to provide their token
        req_id: 1
    };
    
    // For demo, we just need to send authorize with empty string to get account list
    // In production, users should provide their token
    sendRequest({ authorize: "", req_id: 1 });
}

// Handle incoming messages
function handleMessage(data) {
    console.log('Received:', data);
    
    if (data.authorize) {
        handleAuthorization(data);
    } else if (data.balance) {
        updateBalance(data.balance);
    } else if (data.tick) {
        updatePrice(data.tick);
    } else if (data.proposal) {
        handleProposal(data);
    } else if (data.buy) {
        handleTradeConfirmation(data);
    } else if (data.portfolio) {
        updatePortfolio(data.portfolio);
    } else if (data.error) {
        handleError(data.error);
    }
}

// Handle authorization response
function handleAuthorization(data) {
    if (data.error) {
        showMessage('Authorization failed: ' + data.error.message, 'error');
        return;
    }
    
    accountIdElement.textContent = `Account: ${data.authorize.loginid}`;
    currencyElement.textContent = data.authorize.currency || 'USD';
    
    // Get balance
    sendRequest({ balance: 1, req_id: 2 });
    
    // Get account settings
    sendRequest({ get_account_settings: 1, req_id: 3 });
    
    // Subscribe to current symbol
    subscribeToSymbol(currentSymbol);
    
    showMessage('Connected successfully!', 'success');
}

// Subscribe to price ticks
function subscribeToSymbol(symbol) {
    // Unsubscribe from previous
    activeSubscriptions.forEach(sub => {
        sendRequest({ forget: sub });
    });
    activeSubscriptions = [];
    
    // Subscribe to new symbol
    const subscribeRequest = {
        ticks: symbol,
        subscribe: 1,
        req_id: 4
    };
    sendRequest(subscribeRequest);
    activeSubscriptions.push(4);
}

// Update price display
function updatePrice(tickData) {
    const price = tickData.tick.quote;
    currentPriceElement.textContent = `$${price.toFixed(4)}`;
    const now = new Date();
    lastUpdatedElement.textContent = `Updated: ${now.toLocaleTimeString()}`;
}

// Update balance display
function updateBalance(balanceData) {
    currentBalance = balanceData.balance;
    balanceElement.textContent = `$${currentBalance.toFixed(2)}`;
}

// Place a trade
function placeTrade() {
    if (!isConnected) {
        showMessage('Please connect to Deriv first', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('amount').value);
    const duration = parseInt(document.getElementById('duration').value);
    const tradeType = document.getElementById('tradeType').value;
    
    if (isNaN(amount) || amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }
    
    if (amount > currentBalance) {
        showMessage('Insufficient balance!', 'error');
        return;
    }
    
    showMessage('Getting price proposal...', 'success');
    tradeButton.disabled = true;
    
    // Get price proposal first
    const proposalRequest = {
        proposal: 1,
        amount: amount,
        basis: 'stake',
        contract_type: tradeType,
        currency: 'USD',
        duration: duration,
        duration_unit: 'm',
        symbol: currentSymbol,
        req_id: 5
    };
    
    sendRequest(proposalRequest);
}

// Handle price proposal
function handleProposal(data) {
    if (data.error) {
        showMessage('Proposal error: ' + data.error.message, 'error');
        tradeButton.disabled = false;
        return;
    }
    
    const proposal = data.proposal;
    const amount = parseFloat(document.getElementById('amount').value);
    
    // Confirm and buy
    const buyRequest = {
        buy: proposal.id,
        price: amount,
        req_id: 6
    };
    
    sendRequest(buyRequest);
}

// Handle trade confirmation
function handleTradeConfirmation(data) {
    if (data.error) {
        showMessage('Trade failed: ' + data.error.message, 'error');
        tradeButton.disabled = false;
        return;
    }
    
    const trade = data.buy;
    showMessage(`✅ Trade placed! Contract ID: ${trade.contract_id}`, 'success');
    
    // Add to active trades
    activeTrades.push({
        id: trade.contract_id,
        type: document.getElementById('tradeType').value,
        amount: parseFloat(document.getElementById('amount').value),
        symbol: currentSymbol,
        timestamp: new Date()
    });
    
    updateActiveTradesDisplay();
    tradeButton.disabled = false;
    
    // Refresh balance
    sendRequest({ balance: 1, req_id: 7 });
    
    // Get portfolio
    sendRequest({ portfolio: 1, req_id: 8 });
}

// Update portfolio display
function updatePortfolio(portfolioData) {
    if (portfolioData.portfolio && portfolioData.portfolio.contracts) {
        activeTrades = portfolioData.portfolio.contracts.map(contract => ({
            id: contract.contract_id,
            type: contract.contract_type.includes('CALL') ? 'CALL' : 'PUT',
            amount: contract.buy_price,
            symbol: contract.symbol,
            status: contract.status,
            timestamp: new Date()
        }));
        updateActiveTradesDisplay();
    }
}

// Update active trades display
function updateActiveTradesDisplay() {
    if (activeTrades.length === 0) {
        activeTradesList.innerHTML = '<p class="empty-message">No active trades</p>';
        return;
    }
    
    activeTradesList.innerHTML = activeTrades.map(trade => `
        <div class="active-trade-item">
            <span class="trade-type ${trade.type === 'CALL' ? 'call' : 'put'}">
                ${trade.type === 'CALL' ? '📈 CALL' : '📉 PUT'}
            </span>
            <strong>$${trade.amount}</strong> on ${trade.symbol}<br>
            <small>Contract ID: ${trade.id}</small>
        </div>
    `).join('');
}

// Handle errors
function handleError(error) {
    console.error('API Error:', error);
    showMessage(`Error: ${error.message}`, 'error');
    if (tradeButton) tradeButton.disabled = false;
}

// Send request through WebSocket
function sendRequest(request) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(request));
    } else {
        showMessage('Not connected to Deriv', 'error');
    }
}

// Update connection status UI
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.innerHTML = '🟢 Connected to Deriv';
        connectionStatus.style.background = '#d4edda';
        connectionStatus.style.color = '#155724';
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        tradeButton.disabled = false;
    } else {
        connectionStatus.innerHTML = '⚫ Disconnected';
        connectionStatus.style.background = '#f8d7da';
        connectionStatus.style.color = '#721c24';
        connectButton.disabled = false;
        disconnectButton.disabled = true;
        tradeButton.disabled = true;
        currentPriceElement.textContent = 'Not connected';
    }
}

// Disconnect from Deriv
function disconnectFromDeriv() {
    if (ws) {
        ws.close();
        ws = null;
    }
    isConnected = false;
    updateConnectionStatus(false);
    activeTrades = [];
    updateActiveTradesDisplay();
    showMessage('Disconnected', 'error');
}

// Show message to user
function showMessage(msg, type) {
    tradeMessage.textContent = msg;
    tradeMessage.className = 'trade-message ' + type;
    setTimeout(() => {
        if (tradeMessage.textContent === msg) {
            tradeMessage.textContent = '';
            tradeMessage.className = 'trade-message';
        }
    }, 5000);
}

// Initialize app
function init() {
    initEventListeners();
    updateConnectionStatus(false);
    console.log('Trading platform initialized with App ID:', APP_ID);
}

// Start the app
init();
