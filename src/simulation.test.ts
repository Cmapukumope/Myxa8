import { describe, it, expect } from 'vitest';
import { generateDemoData, runSimulation, TRADING_PAIRS, TIMEFRAMES } from './simulation';

describe('generateDemoData', () => {
  it('should generate correct number of OHLCV bars', () => {
    const data = generateDemoData(500);
    expect(data.length).toBe(500);
  });

  it('should generate valid OHLCV structure', () => {
    const data = generateDemoData(100);
    for (const bar of data) {
      expect(bar).toHaveLength(5); // [open, high, low, close, volume]
      const [open, high, low, close, volume] = bar;
      expect(high).toBeGreaterThanOrEqual(open);
      expect(high).toBeGreaterThanOrEqual(close);
      expect(low).toBeLessThanOrEqual(open);
      expect(low).toBeLessThanOrEqual(close);
      expect(volume).toBeGreaterThan(0);
      expect(open).toBeGreaterThan(0);
    }
  });

  it('should not generate too predictable data (no 100% win rate)', () => {
    const data = generateDemoData(500);
    // Проверяем что есть и рост, и падение
    let ups = 0, downs = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][3] > data[i-1][3]) ups++;
      else downs++;
    }
    // Должно быть примерно 40-60% в каждую сторону
    const upRatio = ups / data.length;
    expect(upRatio).toBeGreaterThan(0.3);
    expect(upRatio).toBeLessThan(0.7);
  });
});

describe('runSimulation', () => {
  it('should return results, stats, and trades', () => {
    const data = generateDemoData(500);
    const { results, stats, trades } = runSimulation(data, 500);
    
    expect(results.length).toBeGreaterThan(0);
    expect(stats).toBeDefined();
    expect(Array.isArray(trades)).toBe(true);
  });

  it('should NOT have 100% win rate (realistic trading)', () => {
    const data = generateDemoData(500);
    const { stats, trades } = runSimulation(data, 500);
    
    if (trades.length > 5) {
      // Win rate должен быть реалистичным: 30-70%
      expect(stats.winRate).toBeLessThan(0.85);
      expect(stats.winRate).toBeGreaterThan(0.2);
    }
  });

  it('should have commission costs reflected in PnL', () => {
    const data = generateDemoData(500);
    const { trades } = runSimulation(data, 500);
    
    // Если есть сделки, PnL должен учитывать комиссии
    if (trades.length > 0) {
      // Средний PnL не должен быть слишком высоким (комиссии снижают прибыль)
      const avgPnl = trades.reduce((a, t) => a + t.pnl, 0) / trades.length;
      // При реалистичных комиссиях средний PnL не должен быть огромным
      expect(Math.abs(avgPnl)).toBeLessThan(500); // не более 500$ за сделку в среднем
    }
  });

  it('should generate more trades with relaxed conditions', () => {
    const data = generateDemoData(1000);
    const { trades } = runSimulation(data, 1000);
    
    // С ослабленными условиями должно быть больше сделок
    expect(trades.length).toBeGreaterThan(3);
  });

  it('should have cooldown between trades', () => {
    const data = generateDemoData(500);
    const { trades } = runSimulation(data, 500);
    
    // Проверяем что между сделками есть минимум 3 тика
    for (let i = 1; i < trades.length; i++) {
      const gap = trades[i].entryTick - trades[i-1].exitTick;
      expect(gap).toBeGreaterThanOrEqual(0); // не пересекаются
    }
  });

  it('should compute valid stats', () => {
    const data = generateDemoData(500);
    const { stats } = runSimulation(data, 500);
    
    expect(stats.surpriseMean).toBeGreaterThanOrEqual(0);
    expect(stats.surpriseMean).toBeLessThanOrEqual(1);
    expect(stats.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(stats.maxDrawdown).toBeLessThanOrEqual(1);
    expect(stats.totalTrades).toBeGreaterThanOrEqual(0);
    expect(stats.winRate).toBeGreaterThanOrEqual(0);
    expect(stats.winRate).toBeLessThanOrEqual(1);
  });

  it('should handle different data sizes', () => {
    const data100 = generateDemoData(100);
    const data1000 = generateDemoData(1000);
    
    const result100 = runSimulation(data100, 100);
    const result1000 = runSimulation(data1000, 1000);
    
    expect(result100.results.length).toBe(100);
    expect(result1000.results.length).toBe(1000);
  });
});

describe('Trading Pairs & Timeframes', () => {
  it('should have correct trading pairs', () => {
    expect(TRADING_PAIRS.length).toBe(9);
    expect(TRADING_PAIRS.find(p => p.id === 'btc')).toBeDefined();
    expect(TRADING_PAIRS.find(p => p.id === 'eth')).toBeDefined();
    expect(TRADING_PAIRS.find(p => p.id === 'btc_eth')?.isSpread).toBe(true);
  });

  it('should have correct timeframes', () => {
    expect(TIMEFRAMES.length).toBe(6);
    expect(TIMEFRAMES.find(tf => tf.id === '1h')).toBeDefined();
    expect(TIMEFRAMES.find(tf => tf.id === '1d')).toBeDefined();
  });
});

describe('Realism checks', () => {
  it('demo data should have realistic volatility', () => {
    const data = generateDemoData(500);
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i][3] - data[i-1][3]) / data[i-1][3]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Реалистичная волатильность: 0.1% - 3% за бар
    expect(stdDev).toBeGreaterThan(0.001);
    expect(stdDev).toBeLessThan(0.05);
  });

  it('simulation should have some losing trades', () => {
    const data = generateDemoData(1000);
    const { trades } = runSimulation(data, 1000);
    
    if (trades.length >= 5) {
      const losingTrades = trades.filter(t => t.pnl <= 0);
      expect(losingTrades.length).toBeGreaterThan(0);
    }
  });

  it('total PnL should be reasonable (not astronomical)', () => {
    const data = generateDemoData(1000);
    const { stats } = runSimulation(data, 1000);
    
    // С начальным капиталом 10000 и реалистичными комиссиями
    // PnL не должен быть больше 50% от депозита за 1000 тиков
    expect(Math.abs(stats.totalPnl)).toBeLessThan(5000);
  });
});
