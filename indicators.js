// Complete Technical Indicators Library
class TechnicalIndicators {
    constructor() {
        this.indicators = {};
        this.activeIndicators = [];
    }

    // Moving Averages
    SMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            result.push({
                time: data[i].time,
                value: sum / period
            });
        }
        return result;
    }

    EMA(data, period) {
        const multiplier = 2 / (period + 1);
        const result = [];
        let ema = data[0].close;
        
        for (let i = 0; i < data.length; i++) {
            ema = (data[i].close - ema) * multiplier + ema;
            result.push({
                time: data[i].time,
                value: ema
            });
        }
        return result;
    }

    // RSI
    RSI(data, period = 14) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }
        
        const avgGain = this.calculateAverage(gains, period);
        const avgLoss = this.calculateAverage(losses, period);
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return [{ time: data[data.length - 1].time, value: rsi }];
    }

    calculateAverage(values, period) {
        if (values.length < period) return 0;
        let sum = 0;
        for (let i = values.length - period; i < values.length; i++) {
            sum += values[i];
        }
        return sum / period;
    }

    // MACD
    MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.EMA(data, fastPeriod);
        const slowEMA = this.EMA(data, slowPeriod);
        
        const macdLine = [];
        for (let i = 0; i < fastEMA.length; i++) {
            macdLine.push({
                time: fastEMA[i].time,
                value: fastEMA[i].value - slowEMA[i].value
            });
        }
        
        const signalLine = this.EMA(macdLine, signalPeriod);
        const histogram = [];
        
        for (let i = 0; i < macdLine.length; i++) {
            histogram.push({
                time: macdLine[i].time,
                value: macdLine[i].value - signalLine[i].value
            });
        }
        
        return { macdLine, signalLine, histogram };
    }

    // Bollinger Bands
    BollingerBands(data, period = 20, stdDev = 2) {
        const sma = this.SMA(data, period);
        const upper = [];
        const lower = [];
        
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += Math.pow(data[i - j].close - sma[i - period + 1].value, 2);
            }
            const variance = sum / period;
            const stdev = Math.sqrt(variance);
            
            upper.push({
                time: data[i].time,
                value: sma[i - period + 1].value + (stdDev * stdev)
            });
            lower.push({
                time: data[i].time,
                value: sma[i - period + 1].value - (stdDev * stdev)
            });
        }
        
        return { upper, middle: sma, lower };
    }

    // Stochastic Oscillator
    Stochastic(data, period = 14, smoothK = 3, smoothD = 3) {
        const kValues = [];
        
        for (let i = period - 1; i < data.length; i++) {
            let highest = -Infinity;
            let lowest = Infinity;
            
            for (let j = 0; j < period; j++) {
                highest = Math.max(highest, data[i - j].high);
                lowest = Math.min(lowest, data[i - j].low);
            }
            
            const k = ((data[i].close - lowest) / (highest - lowest)) * 100;
            kValues.push({ time: data[i].time, value: k });
        }
        
        const dValues = this.SMA(kValues, smoothD);
        
        return { k: kValues, d: dValues };
    }

    // Ichimoku Cloud
    Ichimoku(data, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) {
        const tenkanSen = [];
        const kijunSen = [];
        const senkouSpanA = [];
        const senkouSpanB = [];
        
        for (let i = tenkanPeriod - 1; i < data.length; i++) {
            let tenkanHigh = -Infinity;
            let tenkanLow = Infinity;
            let kijunHigh = -Infinity;
            let kijunLow = Infinity;
            
            for (let j = 0; j < tenkanPeriod; j++) {
                tenkanHigh = Math.max(tenkanHigh, data[i - j].high);
                tenkanLow = Math.min(tenkanLow, data[i - j].low);
            }
            tenkanSen.push({
                time: data[i].time,
                value: (tenkanHigh + tenkanLow) / 2
            });
            
            if (i >= kijunPeriod - 1) {
                for (let j = 0; j < kijunPeriod; j++) {
                    kijunHigh = Math.max(kijunHigh, data[i - j].high);
                    kijunLow = Math.min(kijunLow, data[i - j].low);
                }
                kijunSen.push({
                    time: data[i].time,
                    value: (kijunHigh + kijunLow) / 2
                });
            }
        }
        
        return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB };
    }

    // Parabolic SAR
    ParabolicSAR(data, acceleration = 0.02, maxAcceleration = 0.2) {
        const sar = [];
        let trend = 1; // 1 = uptrend, -1 = downtrend
        let ep = data[0].high; // extreme point
        let af = acceleration;
        
        for (let i = 1; i < data.length; i++) {
            let sarValue;
            
            if (trend === 1) {
                sarValue = sar[i - 1] || data[i - 1].low;
                sarValue += af * (ep - sarValue);
                
                if (data[i].low < sarValue) {
                    trend = -1;
                    sarValue = ep;
                    ep = data[i].low;
                    af = acceleration;
                } else {
                    if (data[i].high > ep) {
                        ep = data[i].high;
                        af = Math.min(af + acceleration, maxAcceleration);
                    }
                }
            } else {
                sarValue = sar[i - 1] || data[i - 1].high;
                sarValue += af * (ep - sarValue);
                
                if (data[i].high > sarValue) {
                    trend = 1;
                    sarValue = ep;
                    ep = data[i].high;
                    af = acceleration;
                } else {
                    if (data[i].low < ep) {
                        ep = data[i].low;
                        af = Math.min(af + acceleration, maxAcceleration);
                    }
                }
            }
            
            sar.push({ time: data[i].time, value: sarValue });
        }
        
        return sar;
    }

    // ATR (Average True Range)
    ATR(data, period = 14) {
        const trueRanges = [];
        
        for (let i = 1; i < data.length; i++) {
            const highLow = data[i].high - data[i].low;
            const highClose = Math.abs(data[i].high - data[i - 1].close);
            const lowClose = Math.abs(data[i].low - data[i - 1].close);
            const tr = Math.max(highLow, highClose, lowClose);
            trueRanges.push(tr);
        }
        
        const atr = [];
        for (let i = period - 1; i < trueRanges.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += trueRanges[i - j];
            }
            atr.push({
                time: data[i + 1].time,
                value: sum / period
            });
        }
        
        return atr;
    }

    // Volume Profile
    VolumeProfile(data, numBins = 50) {
        const prices = data.map(d => d.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const binSize = (maxPrice - minPrice) / numBins;
        
        const profile = new Array(numBins).fill(0);
        
        data.forEach(candle => {
            const binIndex = Math.floor((candle.close - minPrice) / binSize);
            if (binIndex >= 0 && binIndex < numBins) {
                profile[binIndex] += candle.volume || 1;
            }
        });
        
        return profile.map((volume, i) => ({
            price: minPrice + (i * binSize),
            volume: volume
        }));
    }

    // SuperTrend
    SuperTrend(data, period = 10, multiplier = 3) {
        const atr = this.ATR(data, period);
        const superTrend = [];
        let trend = 1;
        
        for (let i = 0; i < data.length - 1; i++) {
            const upperBand = ((data[i].high + data[i].low) / 2) + (multiplier * atr[i]?.value || 0);
            const lowerBand = ((data[i].high + data[i].low) / 2) - (multiplier * atr[i]?.value || 0);
            
            let finalUpper = upperBand;
            let finalLower = lowerBand;
            
            if (i > 0) {
                finalUpper = (upperBand < superTrend[i - 1].upper) ? upperBand : superTrend[i - 1].upper;
                finalLower = (lowerBand > superTrend[i - 1].lower) ? lowerBand : superTrend[i - 1].lower;
            }
            
            if (trend === 1) {
                if (data[i + 1].close < finalLower) {
                    trend = -1;
                }
            } else {
                if (data[i + 1].close > finalUpper) {
                    trend = 1;
                }
            }
            
            superTrend.push({
                time: data[i].time,
                trend: trend,
                upper: finalUpper,
                lower: finalLower
            });
        }
        
        return superTrend;
    }

    // Fibonacci Retracement
    FibonacciRetracement(high, low) {
        const diff = high - low;
        return {
            level0: low,
            level236: low + (diff * 0.236),
            level382: low + (diff * 0.382),
            level500: low + (diff * 0.5),
            level618: low + (diff * 0.618),
            level786: low + (diff * 0.786),
            level100: high
        };
    }

    // Get Buy/Sell Signal based on multiple indicators
    getSignal(data, symbol) {
        const rsi = this.RSI(data, 14);
        const macd = this.MACD(data);
        const stoch = this.Stochastic(data);
        const superTrend = this.SuperTrend(data);
        
        let score = 0;
        
        // RSI Signal
        if (rsi[0] && rsi[0].value < 30) score += 2; // Oversold - Buy
        if (rsi[0] && rsi[0].value > 70) score -= 2; // Overbought - Sell
        
        // MACD Signal
        const lastMacd = macd.macdLine[macd.macdLine.length - 1];
        const lastSignal = macd.signalLine[macd.signalLine.length - 1];
        if (lastMacd && lastSignal) {
            if (lastMacd.value > lastSignal.value) score += 1;
            else score -= 1;
        }
        
        // SuperTrend Signal
        const lastTrend = superTrend[superTrend.length - 1];
        if (lastTrend && lastTrend.trend === 1) score += 2;
        else if (lastTrend && lastTrend.trend === -1) score -= 2;
        
        // Stochastic Signal
        if (stoch.k[stoch.k.length - 1] && stoch.k[stoch.k.length - 1].value < 20) score += 1;
        if (stoch.k[stoch.k.length - 1] && stoch.k[stoch.k.length - 1].value > 80) score -= 1;
        
        // Final Signal
        if (score >= 3) return { action: 'BUY', confidence: Math.min(score * 20, 100), score };
        if (score <= -3) return { action: 'SELL', confidence: Math.min(Math.abs(score) * 20, 100), score };
        return { action: 'NEUTRAL', confidence: 50, score };
    }
}

// Initialize indicators
window.indicators = new TechnicalIndicators();
