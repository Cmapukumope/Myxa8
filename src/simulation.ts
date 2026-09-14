// ═══════════════════════════════════════════════════════════════════
// Stonkfly Pro v3.0 — SINGULARITY PROTOCOL
// Phase 2: 7 Bio-Inspired Modules for Super-Trading
// With REAL MARKET DATA support + Multi-pair + Multi-timeframe
// ═══════════════════════════════════════════════════════════════════

export interface TickResult {
  tick: number;
  price: number;
  surprise: number;
  freeEnergy: number;
  direction: 'LONG' | 'SHORT' | 'HOLD' | 'CLOSE';
  size: number;
  dopamine: { pam: number; ppl1: number };
  motor: { yawLeft: number; yawRight: number; velocity: number; aversive: number };
  quantum: { amplitude: number; phase: number; collapsed: boolean };
  engram: { activated: boolean; strength: number };
  chronobiology: { fastPhase: number; midPhase: number; slowPhase: number; resonance: number };
  pheromones: { fearLevel: number; greedLevel: number; crowdDirection: number };
  immuneSystem: { threatLevel: number; cytokineActive: boolean; drawdownPct: number };
  tda: { persistenceScore: number; loopDetected: boolean; topologySignal: number };
  darwinism: { activeCluster: number; clusterFitness: number[]; clusterSignals: number[] };
  microbiome: { health: number; serotonin: number; toxinLevel: number; maxPositionScale: number };
  biophoton: { globalVolatility: number; freezeReflex: boolean; entanglementScore: number };
}

export interface AgentStats {
  surpriseMean: number;
  surpriseStd: number;
  freeEnergyTrend: number;
  quantumCoherence: number;
  totalTrades: number;
  engramMemories: number;
  winRate: number;
  totalPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitableTrades: number;
  losingTrades: number;
  avgResonance: number;
  immuneSaves: number;
  biophotonSaves: number;
  dominantCluster: number;
  finalMicrobiomeHealth: number;
  avgPheromoneFear: number;
  tdaLoopDetections: number;
}

export interface Trade {
  entryTick: number;
  entryPrice: number;
  exitTick: number;
  exitPrice: number;
  direction: 'LONG' | 'SHORT';
  pnl: number;
  pnlPercent: number;
  size: number;
  holdTicks: number;
  exitReason: string;
}

// ═══════════════════════════════════════════════════════════════════
// SEEDED RANDOM
// ═══════════════════════════════════════════════════════════════════
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }
  randn(): number {
    const u1 = this.next(); const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TRADING PAIRS & TIMEFRAMES
// ═══════════════════════════════════════════════════════════════════

export interface TradingPair {
  id: string;
  symbol: string;
  name: string;
  coingeckoIds: string[];
  icon: string;
  isSpread: boolean;
}

export interface Timeframe {
  id: string;
  label: string;
  coingeckoDays: number;
  coingeckoInterval: 'minutely' | 'hourly' | 'daily';
  barsPerDay: number;
  description: string;
}

export const TRADING_PAIRS: TradingPair[] = [
  { id: 'btc', symbol: 'BTC/USD', name: 'Bitcoin', coingeckoIds: ['bitcoin'], icon: '₿', isSpread: false },
  { id: 'eth', symbol: 'ETH/USD', name: 'Ethereum', coingeckoIds: ['ethereum'], icon: 'Ξ', isSpread: false },
  { id: 'sol', symbol: 'SOL/USD', name: 'Solana', coingeckoIds: ['solana'], icon: '◎', isSpread: false },
  { id: 'bnb', symbol: 'BNB/USD', name: 'BNB', coingeckoIds: ['binancecoin'], icon: '◆', isSpread: false },
  { id: 'xrp', symbol: 'XRP/USD', name: 'Ripple', coingeckoIds: ['ripple'], icon: '✕', isSpread: false },
  { id: 'ada', symbol: 'ADA/USD', name: 'Cardano', coingeckoIds: ['cardano'], icon: '♦', isSpread: false },
  { id: 'doge', symbol: 'DOGE/USD', name: 'Dogecoin', coingeckoIds: ['dogecoin'], icon: 'Ð', isSpread: false },
  { id: 'btc_eth', symbol: 'BTC/ETH', name: 'BTC/ETH Spread', coingeckoIds: ['bitcoin', 'ethereum'], icon: '⟷', isSpread: true },
  { id: 'eth_sol', symbol: 'ETH/SOL', name: 'ETH/SOL Spread', coingeckoIds: ['ethereum', 'solana'], icon: '⟷', isSpread: true },
];

export const TIMEFRAMES: Timeframe[] = [
  { id: '1m', label: '1m', coingeckoDays: 1, coingeckoInterval: 'minutely', barsPerDay: 1440, description: '1 минута (1 день)' },
  { id: '5m', label: '5m', coingeckoDays: 7, coingeckoInterval: 'minutely', barsPerDay: 288, description: '5 минут (7 дней)' },
  { id: '15m', label: '15m', coingeckoDays: 30, coingeckoInterval: 'hourly', barsPerDay: 96, description: '15 минут (30 дней)' },
  { id: '1h', label: '1H', coingeckoDays: 90, coingeckoInterval: 'hourly', barsPerDay: 24, description: '1 час (90 дней)' },
  { id: '4h', label: '4H', coingeckoDays: 365, coingeckoInterval: 'daily', barsPerDay: 6, description: '4 часа (1 год)' },
  { id: '1d', label: '1D', coingeckoDays: 365, coingeckoInterval: 'daily', barsPerDay: 1, description: '1 день (1 год)' },
];

// ═══════════════════════════════════════════════════════════════════
// REAL MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════

export async function fetchRealMarketData(
  pair: TradingPair,
  timeframe: Timeframe,
  maxBars: number = 2000
): Promise<number[][]> {
  try {
    if (pair.isSpread) {
      return await fetchSpreadData(pair.coingeckoIds[0], pair.coingeckoIds[1], timeframe, maxBars);
    }
    return await fetchSingleAssetData(pair.coingeckoIds[0], timeframe, maxBars);
  } catch (error) {
    console.warn('Failed to fetch real market data, using demo:', error);
    return generateDemoData(maxBars);
  }
}

async function fetchSingleAssetData(
  coingeckoId: string,
  timeframe: Timeframe,
  maxBars: number
): Promise<number[][]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${timeframe.coingeckoDays}&interval=${timeframe.coingeckoInterval}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    console.warn(`CoinGecko API error: ${response.status}`);
    return generateDemoData(maxBars);
  }
  
  const data = await response.json();
  const prices: number[][] = data.prices;
  
  if (!prices || prices.length < 10) {
    return generateDemoData(maxBars);
  }
  
  const resampled = resampleToTimeframe(prices, timeframe);
  return pricesToOHLCV(resampled, maxBars);
}

async function fetchSpreadData(
  id1: string,
  id2: string,
  timeframe: Timeframe,
  maxBars: number
): Promise<number[][]> {
  const url1 = `https://api.coingecko.com/api/v3/coins/${id1}/market_chart?vs_currency=usd&days=${timeframe.coingeckoDays}&interval=${timeframe.coingeckoInterval}`;
  const url2 = `https://api.coingecko.com/api/v3/coins/${id2}/market_chart?vs_currency=usd&days=${timeframe.coingeckoDays}&interval=${timeframe.coingeckoInterval}`;
  
  const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);
  
  if (!res1.ok || !res2.ok) {
    console.warn('Failed to fetch spread data');
    return generateDemoData(maxBars);
  }
  
  const data1 = await res1.json();
  const data2 = await res2.json();
  
  const prices1: number[][] = data1.prices;
  const prices2: number[][] = data2.prices;
  
  if (!prices1 || !prices2 || prices1.length < 10 || prices2.length < 10) {
    return generateDemoData(maxBars);
  }
  
  const spreadPrices: number[][] = [];
  const minLen = Math.min(prices1.length, prices2.length);
  
  for (let i = 0; i < minLen; i++) {
    const ts1 = prices1[i][0];
    const ts2 = prices2[i][0];
    if (Math.abs(ts1 - ts2) < 3600000) {
      const ratio = prices1[i][1] / prices2[i][1];
      spreadPrices.push([ts1, ratio]);
    }
  }
  
  if (spreadPrices.length < 10) {
    return generateDemoData(maxBars);
  }
  
  const resampled = resampleToTimeframe(spreadPrices, timeframe);
  return pricesToOHLCV(resampled, maxBars);
}

function resampleToTimeframe(prices: number[][], timeframe: Timeframe): number[][] {
  if (prices.length === 0) return [];
  
  const bucketSize = getBucketSizeMs(timeframe);
  const buckets: Map<number, number[]> = new Map();
  
  for (const [ts, price] of prices) {
    const bucketKey = Math.floor(ts / bucketSize) * bucketSize;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
    buckets.get(bucketKey)!.push(price);
  }
  
  const result: number[][] = [];
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  for (const key of sortedKeys) {
    const bucketPrices = buckets.get(key)!;
    result.push([key, bucketPrices[bucketPrices.length - 1]]);
  }
  
  return result;
}

function getBucketSizeMs(timeframe: Timeframe): number {
  switch (timeframe.id) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function pricesToOHLCV(prices: number[][], maxBars: number): number[][] {
  const rng = new SeededRandom(42);
  const ohlcv: number[][] = [];
  
  const limited = prices.slice(-maxBars);
  
  for (let i = 1; i < limited.length; i++) {
    const openP = limited[i - 1][1];
    const closeP = limited[i][1];
    const bodySize = Math.abs(closeP - openP);
    const wickSize = bodySize * (0.2 + rng.next() * 0.6);
    const highP = Math.max(openP, closeP) + wickSize;
    const lowP = Math.min(openP, closeP) - wickSize;
    const volume = 1000 + rng.next() * 5000;
    ohlcv.push([openP, highP, lowP, closeP, volume]);
  }
  
  return ohlcv;
}

export async function fetchCurrentPrice(pair: TradingPair): Promise<number | null> {
  try {
    if (pair.isSpread) {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${pair.coingeckoIds.join(',')}&vs_currencies=usd`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const p1 = data[pair.coingeckoIds[0]]?.usd;
      const p2 = data[pair.coingeckoIds[1]]?.usd;
      if (p1 && p2) return p1 / p2;
      return null;
    }
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${pair.coingeckoIds[0]}&vs_currencies=usd`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data[pair.coingeckoIds[0]]?.usd ?? null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MARKET DATA GENERATION
// ═══════════════════════════════════════════════════════════════════
export function generateDemoData(nTicks: number = 200): number[][] {
  const rng = new SeededRandom(42);
  const basePrice = 67000;
  const prices: number[] = [basePrice];

  const totalBars = nTicks + 80;
  for (let i = 0; i < totalBars; i++) {
    let change: number;
    const phase = i / totalBars;

    if (phase < 0.05) {
      change = rng.randn() * 40;
    } else if (phase < 0.20) {
      change = 200 + rng.randn() * 50;
    } else if (phase < 0.25) {
      change = -40 + rng.randn() * 30;
    } else if (phase < 0.40) {
      change = 180 + rng.randn() * 50;
    } else if (phase < 0.45) {
      change = rng.randn() * 25;
    } else if (phase < 0.60) {
      change = -200 + rng.randn() * 50;
    } else if (phase < 0.65) {
      change = 60 + rng.randn() * 30;
    } else if (phase < 0.80) {
      change = -180 + rng.randn() * 45;
    } else if (phase < 0.85) {
      change = rng.randn() * 20;
    } else {
      change = 220 + rng.randn() * 45;
    }

    prices.push(Math.max(1000, prices[prices.length - 1] + change));
  }

  const ohlcv: number[][] = [];
  for (let i = 80; i < prices.length; i++) {
    const openP = prices[i - 1];
    const closeP = prices[i];
    const bodySize = Math.abs(closeP - openP);
    const wickSize = bodySize * (0.15 + rng.next() * 0.4);
    const highP = Math.max(openP, closeP) + wickSize;
    const lowP = Math.min(openP, closeP) - wickSize;
    const volume = 1000 + rng.next() * 2000;
    ohlcv.push([openP, highP, lowP, closeP, volume]);
  }

  return ohlcv;
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 1: CHRONOBIOLOGY
// ═══════════════════════════════════════════════════════════════════
class ChronobiologyModule {
  private fastPhase = 0;
  private midPhase = 0;
  private slowPhase = 0;
  private readonly fastFreq = (2 * Math.PI) / 5;
  private readonly midFreq = (2 * Math.PI) / 20;
  private readonly slowFreq = (2 * Math.PI) / 60;

  update(price: number, prevPrice: number): { fastPhase: number; midPhase: number; slowPhase: number; resonance: number } {
    const priceReturn = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
    this.fastPhase += this.fastFreq + priceReturn * 8;
    this.midPhase += this.midFreq + priceReturn * 3;
    this.slowPhase += this.slowFreq + priceReturn * 1;

    const fast = Math.sin(this.fastPhase);
    const mid = Math.sin(this.midPhase);
    const slow = Math.sin(this.slowPhase);

    const allPositive = fast > 0.3 && mid > 0.3 && slow > 0.3;
    const allNegative = fast < -0.3 && mid < -0.3 && slow < -0.3;
    const resonance = (allPositive || allNegative)
      ? Math.abs(fast * mid * slow)
      : Math.abs(fast * mid * slow) * 0.3;

    return { fastPhase: fast, midPhase: mid, slowPhase: slow, resonance };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 2: SWARM PHEROMONES
// ═══════════════════════════════════════════════════════════════════
class PheromoneModule {
  private fearLevel = 0;
  private greedLevel = 0;
  private readonly decayRate = 0.95;

  update(priceChange: number, volatility: number): { fearLevel: number; greedLevel: number; crowdDirection: number } {
    const normalizedChange = priceChange * 100;
    if (normalizedChange < -0.005) {
      this.fearLevel = Math.min(1, this.fearLevel + Math.abs(normalizedChange) * 5 + volatility * 3);
    }
    if (normalizedChange > 0.005) {
      this.greedLevel = Math.min(1, this.greedLevel + Math.abs(normalizedChange) * 5);
    }
    this.fearLevel *= this.decayRate;
    this.greedLevel *= this.decayRate;
    const crowdDirection = this.greedLevel - this.fearLevel;
    return { fearLevel: this.fearLevel, greedLevel: this.greedLevel, crowdDirection };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 3: DIGITAL IMMUNE SYSTEM
// ═══════════════════════════════════════════════════════════════════
class ImmuneSystemModule {
  private threatLevel = 0;
  private cytokineActive = false;
  private consecutiveLossTicks = 0;

  update(pnlPercent: number | null, hasPosition: boolean): { threatLevel: number; cytokineActive: boolean; drawdownPct: number } {
    if (hasPosition && pnlPercent !== null) {
      const drawdownPct = Math.abs(Math.min(0, pnlPercent));
      if (drawdownPct > 0.003) {
        this.threatLevel = Math.min(1, this.threatLevel + drawdownPct * 20);
      } else {
        this.threatLevel = Math.max(0, this.threatLevel - 0.02);
      }
      this.cytokineActive = drawdownPct > 0.008;
      if (pnlPercent < -0.002) {
        this.consecutiveLossTicks++;
      } else {
        this.consecutiveLossTicks = Math.max(0, this.consecutiveLossTicks - 1);
      }
      if (this.consecutiveLossTicks > 5) {
        this.threatLevel = Math.min(1, this.threatLevel + 0.1);
        this.cytokineActive = true;
      }
      return { threatLevel: this.threatLevel, cytokineActive: this.cytokineActive, drawdownPct };
    }
    this.threatLevel = Math.max(0, this.threatLevel - 0.03);
    this.cytokineActive = false;
    return { threatLevel: this.threatLevel, cytokineActive: false, drawdownPct: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 4: TDA
// ═══════════════════════════════════════════════════════════════════
class TDAModule {
  private priceHistory: number[] = [];
  private readonly windowSize = 20;

  update(price: number): { persistenceScore: number; loopDetected: boolean; topologySignal: number } {
    this.priceHistory.push(price);
    if (this.priceHistory.length > this.windowSize * 2) {
      this.priceHistory = this.priceHistory.slice(-this.windowSize * 2);
    }
    if (this.priceHistory.length < this.windowSize) {
      return { persistenceScore: 0, loopDetected: false, topologySignal: 0 };
    }
    const returns: number[] = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      returns.push((this.priceHistory[i] - this.priceHistory[i - 1]) / this.priceHistory[i - 1]);
    }
    const recent = returns.slice(-this.windowSize);
    const cumReturn = recent.reduce((a, b) => a + b, 0);
    const variance = recent.reduce((a, b) => a + (b - cumReturn / recent.length) ** 2, 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    const loopDetected = Math.abs(cumReturn) < stdDev * 0.5 && stdDev > 0.002;
    const persistenceScore = Math.min(1, stdDev * 50);
    const topologySignal = loopDetected ? -0.5 : Math.sign(cumReturn) * Math.min(1, Math.abs(cumReturn) * 100);
    return { persistenceScore, loopDetected, topologySignal };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 5: NEURAL DARWINISM
// ═══════════════════════════════════════════════════════════════════
class NeuralDarwinismModule {
  private fitness: number[] = [0.5, 0.5, 0.5];
  private dopamine: number[] = [0.3, 0.3, 0.3];
  private readonly learningRate = 0.05;
  private readonly decayRate = 0.998;

  update(surprise: number, priceReturn: number, volatility: number, pnl: number | null): {
    activeCluster: number; clusterFitness: number[]; clusterSignals: number[];
  } {
    const signals = [
      Math.sign(priceReturn) * Math.min(1, Math.abs(priceReturn) * 200),
      -Math.sign(priceReturn) * Math.min(1, volatility * 15),
      Math.sign(priceReturn) * Math.min(1, Math.abs(priceReturn) * 100) * (1 - volatility * 5),
    ];
    for (let i = 0; i < 3; i++) {
      const signalAgreement = Math.sign(signals[i]) === Math.sign(priceReturn) ? 1 : -0.5;
      const surprisePenalty = surprise * 2;
      this.dopamine[i] = Math.max(0, Math.min(1,
        this.dopamine[i] + this.learningRate * (signalAgreement * (1 - surprisePenalty) - 0.1)
      ));
      this.fitness[i] = this.fitness[i] * this.decayRate + this.dopamine[i] * 0.02;
      if (pnl !== null && pnl > 0) {
        const bestCluster = signals.indexOf(Math.max(...signals.map(Math.abs)));
        if (i === bestCluster) {
          this.fitness[i] += 0.01;
          this.dopamine[i] = Math.min(1, this.dopamine[i] + 0.05);
        }
      }
    }
    const activeCluster = this.fitness.indexOf(Math.max(...this.fitness));
    return { activeCluster, clusterFitness: [...this.fitness], clusterSignals: signals };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 6: GUT-BRAIN AXIS
// ═══════════════════════════════════════════════════════════════════
class MicrobiomeModule {
  private health = 0.8;
  private serotonin = 0.5;
  private toxinLevel = 0;
  private consecutiveLosses = 0;
  private consecutiveWins = 0;

  update(pnl: number | null): { health: number; serotonin: number; toxinLevel: number; maxPositionScale: number } {
    if (pnl !== null) {
      if (pnl > 0) {
        this.consecutiveWins++;
        this.consecutiveLosses = 0;
        this.health = Math.min(1, this.health + 0.05);
        this.toxinLevel = Math.max(0, this.toxinLevel - 0.08);
      } else {
        this.consecutiveLosses++;
        this.consecutiveWins = 0;
        this.health = Math.max(0, this.health - 0.08);
        this.toxinLevel = Math.min(1, this.toxinLevel + 0.1);
      }
      if (this.consecutiveLosses >= 3) {
        this.health = Math.max(0, this.health - 0.05 * this.consecutiveLosses);
        this.toxinLevel = Math.min(1, this.toxinLevel + 0.05);
      }
    }
    this.health = Math.min(1, this.health + 0.005);
    this.toxinLevel = Math.max(0, this.toxinLevel - 0.01);
    this.serotonin = this.health * (1 - this.toxinLevel * 0.5);
    let maxPositionScale: number;
    if (this.health > 0.7) maxPositionScale = 1.0;
    else if (this.health > 0.4) maxPositionScale = 0.5;
    else if (this.health > 0.2) maxPositionScale = 0.25;
    else maxPositionScale = 0.0;
    return { health: this.health, serotonin: this.serotonin, toxinLevel: this.toxinLevel, maxPositionScale };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 7: BIOPHOTON REFLEX
// ═══════════════════════════════════════════════════════════════════
class BiophotonModule {
  private globalVolatility = 0;
  private entanglementScore = 0;
  private readonly volatilityHistory: number[] = [];

  update(currentVol: number, surprise: number): { globalVolatility: number; freezeReflex: boolean; entanglementScore: number } {
    this.volatilityHistory.push(currentVol);
    if (this.volatilityHistory.length > 30) this.volatilityHistory.shift();
    const avgVol = this.volatilityHistory.reduce((a, b) => a + b, 0) / this.volatilityHistory.length;
    const volSpike = currentVol / (avgVol + 0.0001);
    this.globalVolatility = volSpike;
    this.entanglementScore = Math.min(1, surprise * volSpike * 2);
    const freezeReflex = volSpike > 3.0 || surprise > 0.15;
    return { globalVolatility: this.globalVolatility, freezeReflex, entanglementScore: this.entanglementScore };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════
export function runSimulation(ohlcvData: number[][], nTicks: number): {
  results: TickResult[]; stats: AgentStats; trades: Trade[];
} {
  const rng = new SeededRandom(777);
  const results: TickResult[] = [];

  const chrono = new ChronobiologyModule();
  const pheromones = new PheromoneModule();
  const immune = new ImmuneSystemModule();
  const tda = new TDAModule();
  const darwinism = new NeuralDarwinismModule();
  const microbiome = new MicrobiomeModule();
  const biophoton = new BiophotonModule();

  let internalModel = ohlcvData[0]?.[3] ?? 67000;
  let learningRate = 0.06;
  let quantumAmplitude = 0.8;
  let engramStrength = 0;
  let cumulativeSurprise = 0;
  const recentPrices: number[] = [];
  const MOMENTUM_WINDOW = 5;

  let immuneSaves = 0;
  let biophotonSaves = 0;
  let tdaLoopDetections = 0;

  for (let i = 0; i < nTicks && i < ohlcvData.length; i++) {
    const bar = ohlcvData[i];
    const closePrice = bar[3];
    const highPrice = bar[1];
    const lowPrice = bar[2];
    const volatility = (highPrice - lowPrice) / closePrice;
    const prevPrice = i > 0 ? ohlcvData[i - 1][3] : closePrice;
    const priceReturn = prevPrice > 0 ? (closePrice - prevPrice) / prevPrice : 0;

    recentPrices.push(closePrice);
    if (recentPrices.length > MOMENTUM_WINDOW + 1) recentPrices.shift();

    if (i === 30) engramStrength = 0.7;

    const chronoResult = chrono.update(closePrice, prevPrice);
    const pheroResult = pheromones.update(priceReturn, volatility);
    const tdaResult = tda.update(closePrice);
    if (tdaResult.loopDetected) tdaLoopDetections++;

    let ema = closePrice;
    const window = ohlcvData.slice(Math.max(0, i - 15), i + 1);
    if (window.length > 1) {
      const alpha = 2 / (Math.min(window.length, 10) + 1);
      ema = window.reduce((acc, val, idx) => idx === 0 ? val[3] : acc * (1 - alpha) + val[3] * alpha, 0);
    }

    let momentum = 0;
    if (recentPrices.length >= MOMENTUM_WINDOW) {
      momentum = (closePrice - recentPrices[recentPrices.length - MOMENTUM_WINDOW]) / recentPrices[recentPrices.length - MOMENTUM_WINDOW];
    }

    const baseTrend = (ema - internalModel) / internalModel;
    const trendSignal = baseTrend + momentum * 0.5 + tdaResult.topologySignal * 0.3;
    const chronoBoost = chronoResult.resonance > 0.3 ? chronoResult.resonance : 0;
    const ornRate = Math.min(1, Math.max(0, 0.5 + (trendSignal + chronoBoost * Math.sign(trendSignal)) * 10));

    const surprise = Math.abs(closePrice - internalModel) / internalModel;
    const freeEnergy = surprise * surprise + 0.05 * volatility;
    const predictionError = closePrice - internalModel;
    internalModel += learningRate * predictionError;
    learningRate = Math.max(0.02, 0.06 - surprise * 0.02);
    cumulativeSurprise += surprise;

    const pamActivation = Math.max(0, 1 - surprise * 4);
    const ppl1Activation = Math.min(1, surprise * 3);

    const darwinResult = darwinism.update(surprise, priceReturn, volatility, null);

    quantumAmplitude = Math.max(0.1, quantumAmplitude - 0.003 + surprise * 0.3 * rng.randn() * 0.05);
    const quantumPhase = Math.sin(i * 0.1 + cumulativeSurprise) * quantumAmplitude;
    const waveCollapsed = surprise < 0.02 && quantumAmplitude < 0.3;

    const crashPatternMatch = volatility > 0.025 && trendSignal < -0.008;
    const engramActivated = crashPatternMatch && engramStrength > 0.3;
    if (engramActivated) engramStrength = Math.min(1, engramStrength + 0.01);

    const biophotonResult = biophoton.update(volatility, surprise);

    const trendStrength = Math.abs(trendSignal);
    const yawLeft = Math.max(0, ornRate * 0.85 * (1 + trendStrength));
    const yawRight = Math.max(0, (1 - ornRate) * 0.85 * (1 + trendStrength));
    const velocity = Math.min(1, trendStrength * 6 + 0.3);
    const aversiveDN = ppl1Activation * 0.8 + (engramActivated ? 0.3 : 0);

    const momentumSignal = momentum > 0.003 ? 1 : momentum < -0.003 ? -1 : 0;
    const signalConfidence = Math.max(0, 1 - surprise * 2) *
      (0.5 + Math.abs(trendSignal) * 25) *
      (0.5 + Math.abs(momentum) * 30) *
      (0.5 + chronoBoost);

    const crowdAlignment = (ornRate > 0.55 && pheroResult.crowdDirection > 0) ||
                           (ornRate < 0.45 && pheroResult.crowdDirection < 0);

    const microResult = microbiome.update(null);

    const entryScore = signalConfidence *
      (0.5 + chronoBoost * 0.5) *
      (0.5 + (crowdAlignment ? 0.5 : 0)) *
      (0.5 + Math.max(0, tdaResult.topologySignal * Math.sign(ornRate - 0.5)) * 0.5) *
      microResult.maxPositionScale;

    let direction: 'LONG' | 'SHORT' | 'HOLD' | 'CLOSE';
    let size: number;

    if (aversiveDN > 0.75 || biophotonResult.freezeReflex) {
      direction = 'CLOSE';
      size = 0.1;
    } else if (
      yawLeft > yawRight && yawLeft > 0.5 && surprise < 0.06 &&
      entryScore > 0.25 && momentumSignal >= 0 &&
      microResult.maxPositionScale > 0.2 &&
      darwinResult.clusterSignals[darwinResult.activeCluster] > 0
    ) {
      direction = 'LONG';
      size = Math.min(1, velocity * entryScore * 1.5) * microResult.maxPositionScale;
    } else if (
      yawRight > yawLeft && yawRight > 0.5 && surprise < 0.06 &&
      entryScore > 0.25 && momentumSignal <= 0 &&
      microResult.maxPositionScale > 0.2 &&
      darwinResult.clusterSignals[darwinResult.activeCluster] < 0
    ) {
      direction = 'SHORT';
      size = Math.min(1, velocity * entryScore * 1.5) * microResult.maxPositionScale;
    } else {
      direction = 'HOLD';
      size = 0.05;
    }

    if (!waveCollapsed && rng.next() < quantumAmplitude * 0.005) {
      direction = 'HOLD';
    }

    results.push({
      tick: i, price: closePrice,
      surprise: Math.min(1, surprise), freeEnergy: Math.min(1, freeEnergy),
      direction, size,
      dopamine: { pam: pamActivation, ppl1: ppl1Activation },
      motor: { yawLeft: Math.min(1, yawLeft), yawRight: Math.min(1, yawRight), velocity: Math.min(1, velocity), aversive: Math.min(1, aversiveDN) },
      quantum: { amplitude: quantumAmplitude, phase: quantumPhase, collapsed: waveCollapsed },
      engram: { activated: engramActivated, strength: engramStrength },
      chronobiology: chronoResult, pheromones: pheroResult,
      immuneSystem: { threatLevel: 0, cytokineActive: false, drawdownPct: 0 },
      tda: tdaResult, darwinism: darwinResult,
      microbiome: microResult, biophoton: biophotonResult,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TRADING ENGINE
  // ═══════════════════════════════════════════════════════════════
  const trades: Trade[] = [];
  let position: {
    entryTick: number; entryPrice: number; direction: 'LONG' | 'SHORT';
    size: number; stopLoss: number; highestPnl: number; trailingStopActive: boolean;
  } | null = null;
  let equity = 10000;
  let peakEquity = equity;
  let maxDrawdown = 0;
  const equityCurve: number[] = [equity];
  const returns: number[] = [];

  const STOP_LOSS_PCT = 0.006;
  const TAKE_PROFIT_PCT = 0.012;
  const TRAILING_TRIGGER = 0.004;
  const TRAILING_STOP = 0.004;
  const MAX_HOLD = 10;
  const POSITION_SIZE_PCT = 0.02;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const currentPrice = r.price;

    if (position) {
      const holdTicks = i - position.entryTick;
      const pnlPercent = position.direction === 'LONG'
        ? (currentPrice - position.entryPrice) / position.entryPrice
        : (position.entryPrice - currentPrice) / position.entryPrice;

      position.highestPnl = Math.max(position.highestPnl, pnlPercent);

      const immuneResult = immune.update(pnlPercent, true);
      r.immuneSystem = immuneResult;

      if (r.biophoton.freezeReflex) {
        const pnl = pnlPercent * position.size;
        trades.push({
          entryTick: position.entryTick, entryPrice: position.entryPrice,
          exitTick: i, exitPrice: currentPrice, direction: position.direction,
          pnl, pnlPercent: pnlPercent * 100, size: position.size, holdTicks,
          exitReason: '🦠 Biophoton Freeze Reflex',
        });
        equity += pnl;
        returns.push(pnlPercent);
        position = null;
        biophotonSaves++;
        const microResult = microbiome.update(pnl);
        r.microbiome = microResult;
        const darwinResult = darwinism.update(r.surprise, 0, 0, pnl);
        r.darwinism = darwinResult;
        continue;
      }

      if (immuneResult.cytokineActive) {
        const pnl = pnlPercent * position.size;
        trades.push({
          entryTick: position.entryTick, entryPrice: position.entryPrice,
          exitTick: i, exitPrice: currentPrice, direction: position.direction,
          pnl, pnlPercent: pnlPercent * 100, size: position.size, holdTicks,
          exitReason: '🛡️ Immune System Apoptosis',
        });
        equity += pnl;
        returns.push(pnlPercent);
        position = null;
        immuneSaves++;
        const microResult = microbiome.update(pnl);
        r.microbiome = microResult;
        const darwinResult = darwinism.update(r.surprise, 0, 0, pnl);
        r.darwinism = darwinResult;
        continue;
      }

      if (pnlPercent >= TRAILING_TRIGGER) position.trailingStopActive = true;
      if (position.trailingStopActive) {
        if (position.direction === 'LONG') {
          position.stopLoss = Math.max(position.stopLoss, currentPrice * (1 - TRAILING_STOP));
        } else {
          position.stopLoss = Math.min(position.stopLoss, currentPrice * (1 + TRAILING_STOP));
        }
      }

      const stopLossHit = position.direction === 'LONG'
        ? currentPrice <= position.stopLoss : currentPrice >= position.stopLoss;
      const takeProfitHit = pnlPercent >= TAKE_PROFIT_PCT;
      const maxHoldReached = holdTicks >= MAX_HOLD;
      const reversalSignal = holdTicks >= 2 && r.surprise > 0.15 && r.dopamine.ppl1 > 0.6;

      if (stopLossHit || takeProfitHit || maxHoldReached || reversalSignal) {
        const pnl = pnlPercent * position.size;
        const reason = stopLossHit ? '🔴 Stop Loss' : takeProfitHit ? '🟢 Take Profit' :
                       maxHoldReached ? '⏰ Max Hold Time' : '🔄 Reversal Signal';
        trades.push({
          entryTick: position.entryTick, entryPrice: position.entryPrice,
          exitTick: i, exitPrice: currentPrice, direction: position.direction,
          pnl, pnlPercent: pnlPercent * 100, size: position.size, holdTicks, exitReason: reason,
        });
        equity += pnl;
        returns.push(pnlPercent);
        position = null;
        const microResult = microbiome.update(pnl);
        r.microbiome = microResult;
        const darwinResult = darwinism.update(r.surprise, 0, 0, pnl);
        r.darwinism = darwinResult;
      }
    } else {
      const immuneResult = immune.update(null, false);
      r.immuneSystem = immuneResult;
    }

    if (!position && (r.direction === 'LONG' || r.direction === 'SHORT')) {
      const microState = r.microbiome;
      const canEnter =
        r.surprise < 0.05 && r.size > 0.3 && r.freeEnergy < 0.08 &&
        r.motor.velocity > 0.35 && microState.maxPositionScale > 0.4 &&
        !r.biophoton.freezeReflex && r.chronobiology.resonance > 0.1 &&
        ((r.direction === 'LONG' && r.dopamine.pam > 0.55) ||
         (r.direction === 'SHORT' && r.dopamine.ppl1 > 0.45));

      if (canEnter) {
        const positionSize = equity * POSITION_SIZE_PCT * microState.maxPositionScale;
        position = {
          entryTick: i, entryPrice: currentPrice, direction: r.direction, size: positionSize,
          stopLoss: r.direction === 'LONG' ? currentPrice * (1 - STOP_LOSS_PCT) : currentPrice * (1 + STOP_LOSS_PCT),
          highestPnl: 0, trailingStopActive: false,
        };
      }
    }

    if (position) {
      const unrealizedPnl = position.direction === 'LONG'
        ? ((currentPrice - position.entryPrice) / position.entryPrice) * position.size
        : ((position.entryPrice - currentPrice) / position.entryPrice) * position.size;
      equityCurve.push(equity + unrealizedPnl);
    } else {
      equityCurve.push(equity);
    }

    peakEquity = Math.max(peakEquity, equityCurve[equityCurve.length - 1]);
    const dd = (peakEquity - equityCurve[equityCurve.length - 1]) / peakEquity;
    maxDrawdown = Math.max(maxDrawdown, dd);
  }

  if (position && results.length > 0) {
    const lastPrice = results[results.length - 1].price;
    const pnlPercent = position.direction === 'LONG'
      ? (lastPrice - position.entryPrice) / position.entryPrice
      : (position.entryPrice - lastPrice) / position.entryPrice;
    const pnl = pnlPercent * position.size;
    trades.push({
      entryTick: position.entryTick, entryPrice: position.entryPrice,
      exitTick: results.length - 1, exitPrice: lastPrice, direction: position.direction,
      pnl, pnlPercent: pnlPercent * 100, size: position.size,
      holdTicks: results.length - 1 - position.entryTick, exitReason: '📊 End of Simulation',
    });
    equity += pnl;
    returns.push(pnlPercent);
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPUTE FINAL STATS
  // ═══════════════════════════════════════════════════════════════
  const surpriseValues = results.map(r => r.surprise);
  const freeEnergyValues = results.map(r => r.freeEnergy);
  const surpriseMean = surpriseValues.reduce((a, b) => a + b, 0) / surpriseValues.length;
  const surpriseStd = Math.sqrt(surpriseValues.reduce((acc, v) => acc + (v - surpriseMean) ** 2, 0) / surpriseValues.length);

  const n = freeEnergyValues.length;
  const xMean = (n - 1) / 2;
  const yMean = freeEnergyValues.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (freeEnergyValues[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const freeEnergyTrend = den > 0 ? num / den : 0;

  const profitableTrades = trades.filter(t => t.pnl > 0).length;
  const losingTrades = trades.filter(t => t.pnl <= 0).length;
  const winRate = trades.length > 0 ? profitableTrades / trades.length : 0;
  const totalPnl = equity - 10000;

  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnStd = returns.length > 1
    ? Math.sqrt(returns.reduce((acc, r) => acc + (r - avgReturn) ** 2, 0) / (returns.length - 1))
    : 0;
  const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;

  const avgResonance = results.reduce((a, r) => a + r.chronobiology.resonance, 0) / results.length;
  const avgPheromoneFear = results.reduce((a, r) => a + r.pheromones.fearLevel, 0) / results.length;
  const lastResult = results[results.length - 1];

  return {
    results, trades,
    stats: {
      surpriseMean, surpriseStd, freeEnergyTrend,
      quantumCoherence: 1 - quantumAmplitude,
      totalTrades: trades.length, engramMemories: Math.round(engramStrength * 10),
      winRate, totalPnl, maxDrawdown, sharpeRatio,
      profitableTrades, losingTrades, avgResonance,
      immuneSaves, biophotonSaves,
      dominantCluster: lastResult?.darwinism.activeCluster ?? 0,
      finalMicrobiomeHealth: lastResult?.microbiome.health ?? 0.8,
      avgPheromoneFear, tdaLoopDetections,
    },
  };
}
