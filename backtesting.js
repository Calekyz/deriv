// Professional Backtesting Engine
class BacktestingEngine {
    constructor() {
        this.historicalData = [];
        this.results = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const runBtn = document.getElementById('runBacktestBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runBacktest());
        }
    }

    async runBacktest() {
        const symbol = document.getElementById('backtestSymbol').value;
        const startDate = document.getElementById('backtestStart').value;
        const endDate = document.getElementById('backtestEnd').value;
        const initialCapital = parseFloat(document.getElementById('backtestCapital').value);
        const strategy = document.getElementById('backtestStrategy').value;
        const riskPerTrade = parseFloat(document.getElementById('backtestRisk').value) / 100;
        
        this.showLoading('Running backtest simulation...');
        
        // Fetch historical data (simulated for demo)
        await this.fetchHistoricalData(symbol, startDate, endDate);
        
        // Run strategy simulation
        const trades = await this.simulateStrategy(strategy, initialCapital, riskPerTrade);
        
        // Calculate metrics
        this.results = this.calculateMetrics(trades, initialCapital);
        
        // Display results
        this.displayResults(this.results, trades);
        
        this.hideLoading();
    }

    async fetchHistoricalData(symbol, startDate, endDate) {
        // Simulated historical data
        // In production, fetch from Deriv API
        this.historicalData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        let current = start;
        
        let price = 100;
        while (current <= end) {
            price += (Math.random() - 0.5) * 2;
            this.historicalData.push({
                time: current.getTime(),
                open: price,
                high: price + Math.random() * 2,
                low: price - Math.random() * 2,
                close: price + (Math.random() - 0.5),
                volume: Math.random() * 1000
            });
            current.setDate(current.getDate() + 1);
        }
        
        return this.historicalData;
    }

    async simulateStrategy(strategy, initialCapital, riskPerTrade) {
        const trades = [];
        let capital = initialCapital;
        let position = null;
        
        for (let i = 100; i < this.historicalData.length; i++) {
            const data = this.historicalData.slice(i - 100, i);
            const signal = this.getStrategySignal(strategy, data);
            
            if (signal.action === 'BUY' && !position) {
                // Enter position
                const entryPrice = this.historicalData[i].close;
                const positionSize = capital * riskPerTrade;
                const units = positionSize / entryPrice;
                
                position = {
                    entryPrice: entryPrice,
                    units: units,
                    entryTime: this.historicalData[i].time,
                    type: 'LONG'
                };
            } else if (position && (signal.action === 'SELL' || i === this.historicalData.length - 1)) {
                // Exit position
                const exitPrice = this.historicalData[i].close;
                const profit = (exitPrice - position.entryPrice) * position.units;
                capital += profit;
                
                trades.push({
                    entryTime: position.entryTime,
                    exitTime: this.historicalData[i].time,
                    entryPrice: position.entryPrice,
                    exitPrice: exitPrice,
                    profit: profit,
                    return: (profit / (position.entryPrice * position.units)) * 100
                });
                
                position = null;
            }
        }
        
        return trades;
    }

    getStrategySignal(strategy, data) {
        switch(strategy) {
            case 'sma_cross':
                return this.smaCrossoverSignal(data);
            case 'rsi':
                return this.rsiSignal(data);
            case 'bollinger':
                return this.bollingerSignal(data);
            default:
                return { action: 'NEUTRAL', confidence: 50 };
        }
    }

    smaCrossoverSignal(data) {
        const smaFast = window.indicators.SMA(data, 10);
        const smaSlow = window.indicators.SMA(data, 30);
        
        const lastFast = smaFast[smaFast.length - 1];
        const lastSlow = smaSlow[smaSlow.length - 1];
        const prevFast = smaFast[smaFast.length - 2];
        const prevSlow = smaSlow[smaSlow.length - 2];
        
        if (prevFast && prevSlow && lastFast && lastSlow) {
            if (prevFast.value <= prevSlow.value && lastFast.value > lastSlow.value) {
                return { action: 'BUY', confidence: 75 };
            }
            if (prevFast.value >= prevSlow.value && lastFast.value < lastSlow.value) {
                return { action: 'SELL', confidence: 75 };
            }
        }
        
        return { action: 'NEUTRAL', confidence: 50 };
    }

    rsiSignal(data) {
        const rsi = window.indicators.RSI(data, 14);
        const lastRsi = rsi[rsi.length - 1];
        
        if (lastRsi && lastRsi.value < 30) {
            return { action: 'BUY', confidence: 70 };
        }
        if (lastRsi && lastRsi.value > 70) {
            return { action: 'SELL', confidence: 70 };
        }
        
        return { action: 'NEUTRAL', confidence: 50 };
    }

    bollingerSignal(data) {
        const bb = window.indicators.BollingerBands(data, 20, 2);
        const lastPrice = data[data.length - 1].close;
        const lastUpper = bb.upper[bb.upper.length - 1];
        const lastLower = bb.lower[bb.lower.length - 1];
        
        if (lastPrice <= lastLower.value) {
            return { action: 'BUY', confidence: 80 };
        }
        if (lastPrice >= lastUpper.value) {
            return { action: 'SELL', confidence: 80 };
        }
        
        return { action: 'NEUTRAL', confidence: 50 };
    }

    calculateMetrics(trades, initialCapital) {
        if (trades.length === 0) {
            return null;
        }
        
        const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
        const finalCapital = initialCapital + totalProfit;
        const totalReturn = (totalProfit / initialCapital) * 100;
        
        const winningTrades = trades.filter(t => t.profit > 0);
        const losingTrades = trades.filter(t => t.profit < 0);
        const winRate = (winningTrades.length / trades.length) * 100;
        
        const avgWin = winningTrades.length > 0 
            ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length 
            : 0;
        const avgLoss = losingTrades.length > 0 
            ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length)
            : 0;
        
        const profitFactor = avgLoss > 0 ? avgWin / avgLoss : Infinity;
        
        // Calculate Sharpe Ratio
        const returns = trades.map(t => t.return);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const sharpeRatio = Math.sqrt(variance) === 0 ? 0 : avgReturn / Math.sqrt(variance);
        
        // Calculate Max Drawdown
        let peak = initialCapital;
        let maxDrawdown = 0;
        let runningCapital = initialCapital;
        
        for (const trade of trades) {
            runningCapital += trade.profit;
            if (runningCapital > peak) {
                peak = runningCapital;
            }
            const drawdown = (peak - runningCapital) / peak * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        return {
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: winRate,
            totalProfit: totalProfit,
            totalReturn: totalReturn,
            finalCapital: finalCapital,
            avgWin: avgWin,
            avgLoss: avgLoss,
            profitFactor: profitFactor,
            sharpeRatio: sharpeRatio,
            maxDrawdown: maxDrawdown,
            expectancy: (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss)
        };
    }

    displayResults(results, trades) {
        const resultsDiv = document.getElementById('backtestResults');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (!results || !resultsGrid) return;
        
        resultsDiv.style.display = 'block';
        
        resultsGrid.innerHTML = `
            <div class="result-card">
                <span class="result-label">Total Trades</span>
                <span class="result-value">${results.totalTrades}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Win Rate</span>
                <span class="result-value ${results.winRate >= 50 ? 'positive' : 'negative'}">${results.winRate.toFixed(1)}%</span>
            </div>
            <div class="result-card">
                <span class="result-label">Total Profit</span>
                <span class="result-value ${results.totalProfit >= 0 ? 'positive' : 'negative'}">$${results.totalProfit.toFixed(2)}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Total Return</span>
                <span class="result-value ${results.totalReturn >= 0 ? 'positive' : 'negative'}">${results.totalReturn.toFixed(1)}%</span>
            </div>
            <div class="result-card">
                <span class="result-label">Final Capital</span>
                <span class="result-value">$${results.finalCapital.toFixed(2)}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Profit Factor</span>
                <span class="result-value">${results.profitFactor.toFixed(2)}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Sharpe Ratio</span>
                <span class="result-value">${results.sharpeRatio.toFixed(2)}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Max Drawdown</span>
                <span class="result-value negative">${results.maxDrawdown.toFixed(1)}%</span>
            </div>
            <div class="result-card">
                <span class="result-label">Expectancy</span>
                <span class="result-value">$${results.expectancy.toFixed(2)}</span>
            </div>
            <div class="result-card">
                <span class="result-label">Avg Win / Avg Loss</span>
                <span class="result-value">$${results.avgWin.toFixed(2)} / $${results.avgLoss.toFixed(2)}</span>
            </div>
        `;
        
        // Draw equity curve
        this.drawEquityCurve(trades);
    }

    drawEquityCurve(trades) {
        const container = document.getElementById('backtestChart');
        if (!container) return;
        
        let equity = 1000;
        const equityCurve = [{ time: 0, value: equity }];
        
        trades.forEach((trade, i) => {
            equity += trade.profit;
            equityCurve.push({ time: i + 1, value: equity });
        });
        
        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: 300,
            layout: { backgroundColor: '#0a0e27', textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#1e2236' }, horzLines: { color: '#1e2236' } }
        });
        
        const lineSeries = chart.addLineSeries({ color: '#6366f1', lineWidth: 2 });
        lineSeries.setData(equityCurve);
    }

    showLoading(message) {
        const btn = document.getElementById('runBacktestBtn');
        if (btn) {
            btn.textContent = '⏳ ' + message;
            btn.disabled = true;
        }
    }

    hideLoading() {
        const btn = document.getElementById('runBacktestBtn');
        if (btn) {
            btn.textContent = '🚀 Run Backtest';
            btn.disabled = false;
        }
    }
}

// Initialize backtesting engine
window.backtesting = new BacktestingEngine();
