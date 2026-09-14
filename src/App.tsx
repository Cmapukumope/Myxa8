import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  generateDemoData, runSimulation, fetchRealMarketData, fetchCurrentPrice,
  TRADING_PAIRS, TIMEFRAMES,
  type TradingPair, type Timeframe, type TickResult, type AgentStats, type Trade
} from './simulation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler);

type TabId = 'overview' | 'pnl' | 'modules' | 'neural' | 'trades' | 'architecture';

function App() {
  const [results, setResults] = useState<TickResult[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [totalTicks, setTotalTicks] = useState(500);
  const [neuralActivity, setNeuralActivity] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(TIMEFRAMES[3]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [dataMode, setDataMode] = useState<'real' | 'demo'>('demo');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [historyLength, setHistoryLength] = useState(1000);
  const [paramsChanged, setParamsChanged] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      const price = await fetchCurrentPrice(selectedPair);
      if (!cancelled && price) setCurrentPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedPair]);

  const runSimulationLoop = useCallback(async () => {
    setIsRunning(true);
    setIsLoadingData(true);
    setTrades([]);
    setResults([]);
    setStats(null);
    setParamsChanged(false);

    let marketData: number[][];
    if (dataMode === 'real') {
      marketData = await fetchRealMarketData(selectedPair, selectedTimeframe, historyLength);
      if (marketData.length > 50) {
        setIsRealData(true);
      } else {
        marketData = generateDemoData(historyLength);
        setIsRealData(false);
      }
    } else {
      marketData = generateDemoData(historyLength);
      setIsRealData(false);
    }

    setIsLoadingData(false);

    const effectiveTicks = Math.min(totalTicks, marketData.length);
    const { results: sr, stats: ss, trades: st } = runSimulation(marketData, effectiveTicks);
    let tick = 0;
    const interval = setInterval(() => {
      if (tick < sr.length) {
        setResults(sr.slice(0, tick + 1));
        setCurrentTick(tick);
        setNeuralActivity(Array.from({ length: 64 }, () => Math.random()));
        tick++;
      } else {
        clearInterval(interval);
        setStats(ss);
        setTrades(st);
        setIsRunning(false);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [totalTicks, selectedPair, selectedTimeframe, dataMode, historyLength]);

  // Отслеживаем изменение параметров — помечаем что нужно перезапустить
  useEffect(() => {
    if (hasInitialized.current) {
      setParamsChanged(true);
    }
  }, [totalTicks, selectedPair, selectedTimeframe, dataMode, historyLength]);

  // После первого запуска — помечаем что инициализация завершена
  useEffect(() => {
    if (results.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, [results]);

  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => setNeuralActivity(p => p.map(() => Math.random())), 200);
    return () => clearInterval(iv);
  }, [isRunning]);

  if (!results.length && (isRunning || isLoadingData)) return <LoadingScreen />;
  if (!results.length) return <EmptyScreen onStart={() => runSimulationLoop()} />;

  const last = results[results.length - 1];
  const prices = results.map(r => r.price);
  const surprises = results.map(r => r.surprise);
  const freeEnergies = results.map(r => r.freeEnergy);
  const ticks = results.map(r => r.tick);
  const tradeCounts = results.reduce((a, r) => { a[r.direction] = (a[r.direction] || 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e] text-gray-100 p-3 md:p-6">
      <div className="max-w-[1700px] mx-auto">
        {/* Header */}
        <header className="text-center py-4 mb-4 border-b border-blue-500/30">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-400 mb-1 flex items-center justify-center gap-3">
            <span className="text-3xl">🧬</span> Stonkfly Pro <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">v3.0</span>
          </h1>
          <p className="text-gray-400 text-xs">7 Bio-Inspired Modules | Real Market Data | Multi-Pair Multi-TF</p>
        </header>

        {/* Controls Panel */}
        <div className="bg-black/40 rounded-xl p-4 mb-4 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pair Selector */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">📊 Торговая пара</label>
              <select
                value={selectedPair.id}
                onChange={e => {
                  const p = TRADING_PAIRS.find(p => p.id === e.target.value);
                  if (p) setSelectedPair(p);
                }}
                className="w-full bg-black/60 text-blue-400 text-sm rounded-lg px-3 py-2 border border-blue-500/30 outline-none focus:border-blue-400"
                disabled={isRunning}
              >
                <optgroup label="— Одиночные —">
                  {TRADING_PAIRS.filter(p => !p.isSpread).map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.symbol} — {p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="— Спреды —">
                  {TRADING_PAIRS.filter(p => p.isSpread).map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.symbol} — {p.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Timeframe Selector */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">⏱️ Таймфрейм</label>
              <div className="flex gap-1">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setSelectedTimeframe(tf)}
                    disabled={isRunning}
                    className={`flex-1 px-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedTimeframe.id === tf.id
                        ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                        : 'bg-black/30 text-gray-500 border border-transparent hover:text-gray-300 hover:bg-white/5'
                    } disabled:opacity-50`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History Length */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">📈 История (баров)</label>
              <div className="flex gap-1 mb-2">
                {[500, 1000, 2000, 3000].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setHistoryLength(preset)}
                    disabled={isRunning}
                    className={`flex-1 px-1 py-1.5 rounded text-xs font-bold transition-all ${
                      historyLength === preset
                        ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                        : 'bg-black/30 text-gray-500 border border-transparent hover:text-gray-300 hover:bg-white/5'
                    } disabled:opacity-50`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={100} max={3000} step={100}
                  value={historyLength}
                  onChange={e => setHistoryLength(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                  disabled={isRunning}
                />
                <input
                  type="number"
                  min={100}
                  max={3000}
                  step={100}
                  value={historyLength}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 100 && val <= 3000) setHistoryLength(val);
                  }}
                  className="w-16 bg-black/60 text-blue-400 text-sm rounded px-2 py-1 border border-blue-500/30 outline-none focus:border-blue-400"
                  disabled={isRunning}
                />
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                ≈ {selectedTimeframe.id === '1d' ? `${historyLength} дней (${(historyLength / 365).toFixed(1)} лет)` :
                   selectedTimeframe.id === '4h' ? `${Math.round(historyLength / 6)} дней` :
                   selectedTimeframe.id === '1h' ? `${Math.round(historyLength / 24)} дней` :
                   selectedTimeframe.id === '15m' ? `${Math.round(historyLength / 96)} дней` :
                   `${Math.round(historyLength / selectedTimeframe.barsPerDay)} дней`}
              </div>
            </div>

            {/* Data Mode + Run */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">🌐 Источник данных</label>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setDataMode('demo')}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    dataMode === 'demo' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-black/30 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  🎲 Demo
                </button>
                <button
                  onClick={() => setDataMode('real')}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    dataMode === 'real' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-black/30 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  🌐 Real
                </button>
              </div>
              {paramsChanged && !isRunning && (
                <div className="text-xs text-yellow-400 mb-1.5 flex items-center gap-1 animate-pulse">
                  ⚠️ Параметры изменены
                </div>
              )}
              <button
                onClick={() => { setResults([]); setStats(null); setTrades([]); runSimulationLoop(); }}
                disabled={isRunning || isLoadingData}
                className={`w-full px-3 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
                  paramsChanged && !isRunning
                    ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/60 text-yellow-300 hover:from-yellow-500/40 hover:to-orange-500/40 shadow-lg shadow-yellow-500/10 animate-pulse'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30'
                }`}
              >
                {isRunning ? '⏳ Выполняется...' : isLoadingData ? '📡 Загрузка данных...' : paramsChanged ? '🔄 Перезапустить' : '▶️ Запустить симуляцию'}
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
            <Badge color={isRealData ? 'green' : 'yellow'}>{isRealData ? '✅ Real Quotes' : '🎲 Demo Data'}</Badge>
            <Badge color="blue">{selectedPair.icon} {selectedPair.symbol}</Badge>
            <Badge color="purple">⏱ {selectedTimeframe.label}</Badge>
            <Badge color="blue">📊 Tick {currentTick}/{Math.min(totalTicks, results.length)}</Badge>
            {currentPrice && <Badge color="green">💲 ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: selectedPair.isSpread ? 4 : 2 })}</Badge>}
            <Badge color="purple">🧠 ε={last.surprise.toFixed(4)}</Badge>
            <Badge color="yellow">⚡ {last.direction}</Badge>
            {stats && <Badge color={stats.winRate >= 0.7 ? 'green' : stats.winRate >= 0.5 ? 'yellow' : 'purple'}>🏆 WR: {(stats.winRate * 100).toFixed(1)}%</Badge>}
            {stats && <Badge color={stats.totalPnl >= 0 ? 'green' : 'purple'}>💰 {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(0)}$</Badge>}
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mb-4 bg-black/30 rounded-xl p-1 overflow-x-auto">
          {([
            { id: 'overview', label: '📈 Overview' },
            { id: 'pnl', label: '💰 P&L' },
            { id: 'modules', label: '🧬 7 Modules' },
            { id: 'neural', label: '🧠 Neural' },
            { id: 'trades', label: '📝 Trades' },
            { id: 'architecture', label: '🏗️ Arch' },
          ] as { id: TabId; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tick slider */}
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-black/20 rounded-lg px-3 py-2">
          <label className="text-xs text-gray-400">Тиков симуляции:</label>
          <div className="flex gap-1">
            {[200, 500, 1000, 2000].filter(p => p <= historyLength).map(preset => (
              <button
                key={preset}
                onClick={() => setTotalTicks(preset)}
                disabled={isRunning}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  totalTicks === preset
                    ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                    : 'bg-black/30 text-gray-500 border border-transparent hover:text-gray-300 hover:bg-white/5'
                } disabled:opacity-50`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input type="range" min={50} max={Math.min(3000, historyLength)} step={50} value={totalTicks} onChange={e => setTotalTicks(Number(e.target.value))} className="flex-1 accent-blue-500" disabled={isRunning} />
          <input
            type="number"
            min={50}
            max={Math.min(3000, historyLength)}
            value={totalTicks}
            onChange={e => {
              const val = Number(e.target.value);
              if (val >= 50 && val <= Math.min(3000, historyLength)) setTotalTicks(val);
            }}
            className="w-16 bg-black/60 text-blue-400 text-sm rounded px-2 py-1 border border-blue-500/30 outline-none focus:border-blue-400"
            disabled={isRunning}
          />
        </div>

        {activeTab === 'overview' && <OverviewTab results={results} stats={stats} tradeCounts={tradeCounts} prices={prices} surprises={surprises} freeEnergies={freeEnergies} ticks={ticks} isRunning={isRunning} />}
        {activeTab === 'pnl' && <PnLTab stats={stats} trades={trades} />}
        {activeTab === 'modules' && <ModulesTab results={results} stats={stats} />}
        {activeTab === 'neural' && <NeuralTab neuralActivity={neuralActivity} results={results} />}
        {activeTab === 'trades' && <TradesTab results={results} trades={trades} />}
        {activeTab === 'architecture' && <ArchitectureTab />}

        <footer className="text-center py-4 mt-6 border-t border-white/10 text-gray-500 text-xs">
          <p>Stonkfly Pro v3.0 | 7 Bio-Inspired Modules | Real Market Data</p>
          <p className="mt-1">CoinGecko API | BTC ETH SOL BNB XRP ADA DOGE | BTC/ETH ETH/SOL Spreads</p>
        </footer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════
function OverviewTab({ results, stats, tradeCounts, prices, surprises, freeEnergies, ticks, isRunning }: {
  results: TickResult[]; stats: AgentStats | null; tradeCounts: Record<string, number>;
  prices: number[]; surprises: number[]; freeEnergies: number[]; ticks: number[]; isRunning: boolean;
}) {
  const last = results[results.length - 1];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <MetricCard label="Surprise" value={stats?.surpriseMean?.toFixed(4) ?? '—'} color="blue" icon="📉" />
        <MetricCard label="FE Trend" value={stats?.freeEnergyTrend?.toFixed(6) ?? '—'} color="green" icon="🔬" />
        <MetricCard label="Resonance" value={stats?.avgResonance?.toFixed(3) ?? '—'} color="purple" icon="🌀" />
        <MetricCard label="Immune Saves" value={String(stats?.immuneSaves ?? 0)} color="yellow" icon="🛡️" />
        <MetricCard label="Biophoton Saves" value={String(stats?.biophotonSaves ?? 0)} color="pink" icon="⚛️" />
        <MetricCard label="Microbiome" value={`${((stats?.finalMicrobiomeHealth ?? 0) * 100).toFixed(0)}%`} color="green" icon="🦠" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-title">📊 Price & Surprise</h2>
          <div className="h-[280px]">
            <Line data={{ labels: ticks, datasets: [
              { label: 'Price', data: prices, borderColor: '#4a9eff', backgroundColor: 'rgba(74,158,255,0.1)', yAxisID: 'y', tension: 0.4, fill: true, pointRadius: 0 },
              { label: 'Surprise', data: surprises, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', yAxisID: 'y1', tension: 0.4, pointRadius: 0 },
            ]}} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: isRunning ? 0 : 300 },
              interaction: { mode: 'index', intersect: false },
              plugins: { legend: { labels: { color: '#ccc' } } },
              scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4a9eff' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#f87171' } } } }} />
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">🔬 Free Energy</h2>
          <div className="h-[280px]">
            <Line data={{ labels: ticks, datasets: [{ label: 'Free Energy', data: freeEnergies, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.15)', fill: true, tension: 0.4, pointRadius: 0 }] }}
              options={{ responsive: true, maintainAspectRatio: false, animation: { duration: isRunning ? 0 : 300 }, plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4ade80' } } } }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="card-title">🎯 Decisions</h2>
          <div className="h-[220px] flex items-center justify-center">
            <Doughnut data={{ labels: ['LONG', 'SHORT', 'HOLD', 'CLOSE'], datasets: [{ data: [tradeCounts.LONG || 0, tradeCounts.SHORT || 0, tradeCounts.HOLD || 0, tradeCounts.CLOSE || 0], backgroundColor: ['#4ade80', '#f87171', '#fbbf24', '#f472b6'], borderWidth: 0 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ccc', padding: 10 } } } }} />
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="card-title">🌀 Chronobiology Resonance</h2>
          <div className="h-[220px]">
            <Line data={{ labels: ticks.filter((_, i) => i % 3 === 0), datasets: [
              { label: 'Fast (1m)', data: results.filter((_, i) => i % 3 === 0).map(r => r.chronobiology.fastPhase), borderColor: '#f472b6', tension: 0.3, pointRadius: 0 },
              { label: 'Mid (15m)', data: results.filter((_, i) => i % 3 === 0).map(r => r.chronobiology.midPhase), borderColor: '#4a9eff', tension: 0.3, pointRadius: 0 },
              { label: 'Slow (4h)', data: results.filter((_, i) => i % 3 === 0).map(r => r.chronobiology.slowPhase), borderColor: '#4ade80', tension: 0.3, pointRadius: 0 },
            ]}} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: isRunning ? 0 : 300 }, plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } } } }} />
          </div>
        </div>
      </div>

      <div className="card border border-purple-500/20">
        <h2 className="card-title">🧬 Singularity Protocol — Module Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
          {[
            { name: 'Chrono', icon: '🕐', val: last.chronobiology.resonance, color: 'purple' },
            { name: 'Pheromone', icon: '🐜', val: 1 - last.pheromones.fearLevel, color: 'green' },
            { name: 'Immune', icon: '🛡️', val: 1 - last.immuneSystem.threatLevel, color: 'blue' },
            { name: 'TDA', icon: '🌀', val: Math.abs(last.tda.topologySignal), color: 'cyan' },
            { name: 'Darwin', icon: '🧬', val: last.darwinism.clusterFitness[last.darwinism.activeCluster] || 0.5, color: 'yellow' },
            { name: 'Microbiome', icon: '🦠', val: last.microbiome.health, color: 'green' },
            { name: 'Biophoton', icon: '⚛️', val: 1 - last.biophoton.entanglementScore, color: 'pink' },
          ].map(m => (
            <div key={m.name} className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">{m.icon}</div>
              <div className="text-xs text-gray-500 mb-1">{m.name}</div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, m.val * 100)}%`, backgroundColor: m.color === 'purple' ? '#a855f7' : m.color === 'green' ? '#4ade80' : m.color === 'blue' ? '#4a9eff' : m.color === 'cyan' ? '#22d3ee' : m.color === 'yellow' ? '#fbbf24' : m.color === 'pink' ? '#f472b6' : '#f87171' }} />
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">{(m.val * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// P&L TAB
// ═══════════════════════════════════════════════════════════════════
function PnLTab({ stats, trades }: { stats: AgentStats | null; trades: Trade[] }) {
  if (!stats || trades.length === 0) return <div className="card text-center py-12"><div className="text-4xl mb-4">⏳</div><p className="text-gray-400">Running simulation...</p></div>;

  const isProfitable = stats.totalPnl > 0;
  const wr = (stats.winRate * 100).toFixed(1);
  const avgWin = trades.filter(t => t.pnl > 0).length > 0 ? trades.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) / trades.filter(t => t.pnl > 0).length : 0;
  const avgLoss = trades.filter(t => t.pnl <= 0).length > 0 ? trades.filter(t => t.pnl <= 0).reduce((a, t) => a + t.pnl, 0) / trades.filter(t => t.pnl <= 0).length : 0;
  const pf = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : Infinity;

  let eq = 10000;
  const eqCurve = [eq];
  for (const t of trades) { eq += t.pnl; eqCurve.push(eq); }

  return (
    <div className="space-y-4">
      <div className={`card border-2 ${isProfitable ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {isProfitable ? '✅ ПРИБЫЛЬНЫЙ АГЕНТ' : '❌ УБЫТОЧНЫЙ АГЕНТ'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">Win Rate: {wr}% | 7 модулей Фазы 2 активны</p>
          </div>
          <div className={`text-4xl font-bold font-mono ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}$
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Win Rate" value={`${wr}%`} color={stats.winRate >= 0.7 ? 'green' : 'yellow'} icon="🎯" />
        <MetricCard label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}$`} color={stats.totalPnl >= 0 ? 'green' : 'purple'} icon="💰" />
        <MetricCard label="Max DD" value={`${(stats.maxDrawdown * 100).toFixed(1)}%`} color="yellow" icon="📉" />
        <MetricCard label="Sharpe" value={stats.sharpeRatio.toFixed(2)} color={stats.sharpeRatio > 1 ? 'green' : 'blue'} icon="📊" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-title">📊 Breakdown</h2>
          <div className="space-y-2 mt-3">
            <Row label="Total Trades" value={String(stats.totalTrades)} />
            <Row label="✅ Profitable" value={String(stats.profitableTrades)} color="green" />
            <Row label="❌ Losing" value={String(stats.losingTrades)} color="red" />
            <div className="border-t border-white/10 pt-2 mt-2">
              <Row label="Avg Win" value={`+${avgWin.toFixed(2)}$`} color="green" />
              <Row label="Avg Loss" value={`${avgLoss.toFixed(2)}$`} color="red" />
              <Row label="Profit Factor" value={`${pf === Infinity ? '∞' : pf.toFixed(2)}x`} color={pf > 1.5 ? 'green' : 'yellow'} />
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <Row label="🛡️ Immune Saves" value={String(stats.immuneSaves)} color="blue" />
              <Row label="⚛️ Biophoton Saves" value={String(stats.biophotonSaves)} color="pink" />
              <Row label="🌀 TDA Loops" value={String(stats.tdaLoopDetections)} color="purple" />
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">💹 Equity Curve</h2>
          <div className="h-[250px] mt-3">
            <Line data={{ labels: eqCurve.map((_, i) => i === 0 ? 'Start' : `#${i}`), datasets: [{ label: 'Equity', data: eqCurve, borderColor: isProfitable ? '#4ade80' : '#f87171', backgroundColor: isProfitable ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', fill: true, tension: 0.3, pointRadius: 2 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: isProfitable ? '#4ade80' : '#f87171' } } } }} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">🎯 Win/Loss Map</h2>
        <div className="flex gap-1 flex-wrap mt-3">
          {trades.map((t, i) => (
            <div key={i} className={`w-5 h-5 rounded-sm ${t.pnl > 0 ? 'bg-green-500' : 'bg-red-500'}`}
              title={`#${i + 1}: ${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}$ (${t.exitReason})`}
              style={{ opacity: 0.5 + Math.min(0.5, Math.abs(t.pnlPercent) / 5) }} />
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📝 All Trades</h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-gray-400">
              <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Dir</th>
              <th className="text-right py-2 px-2">Entry</th><th className="text-right py-2 px-2">Exit</th>
              <th className="text-right py-2 px-2">P&L</th><th className="text-right py-2 px-2">%</th>
              <th className="text-right py-2 px-2">Ticks</th><th className="text-left py-2 px-2">Exit Reason</th>
            </tr></thead>
            <tbody>{trades.map((t, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1.5 px-2 text-gray-500">{i + 1}</td>
                <td className="py-1.5 px-2"><span className={`px-1.5 py-0.5 rounded text-xs font-bold ${t.direction === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.direction}</span></td>
                <td className="py-1.5 px-2 text-right font-mono text-gray-300">{t.entryPrice.toFixed(4)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-gray-300">{t.exitPrice.toFixed(4)}</td>
                <td className={`py-1.5 px-2 text-right font-mono font-bold ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}</td>
                <td className={`py-1.5 px-2 text-right font-mono ${t.pnlPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%</td>
                <td className="py-1.5 px-2 text-right text-gray-500">{t.holdTicks}</td>
                <td className="py-1.5 px-2 text-gray-400 text-xs">{t.exitReason}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULES TAB
// ═══════════════════════════════════════════════════════════════════
function ModulesTab({ results, stats }: { results: TickResult[]; stats: AgentStats | null }) {
  const last = results[results.length - 1];

  return (
    <div className="space-y-4">
      {[
        {
          title: '🕐 Module 1: Chronobiology', sub: 'Circadian Oscillators',
          desc: '3 осциллятора (1m, 15m, 4h). Резонанс фаз = сила сигнала.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Fast (1m)" value={last.chronobiology.fastPhase.toFixed(3)} color="pink" />
              <StatBox label="Mid (15m)" value={last.chronobiology.midPhase.toFixed(3)} color="blue" />
              <StatBox label="Slow (4h)" value={last.chronobiology.slowPhase.toFixed(3)} color="green" />
            </div>
          ),
          extra: <ProgressBar label="Phase Resonance" value={last.chronobiology.resonance} color="purple" note={last.chronobiology.resonance > 0.3 ? '✅ Фазы синхронизированы' : '⚠️ Рассинхронизация'} />
        },
        {
          title: '🐜 Module 2: Swarm Pheromones', sub: 'Crowd Sentiment',
          desc: 'Феромонное поле толпы. Fear/Greed из Funding Rate & OI.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="😱 Fear" value={`${(last.pheromones.fearLevel * 100).toFixed(1)}%`} color="red" />
              <StatBox label="🤑 Greed" value={`${(last.pheromones.greedLevel * 100).toFixed(1)}%`} color="green" />
              <StatBox label="Crowd Dir" value={last.pheromones.crowdDirection.toFixed(3)} color={last.pheromones.crowdDirection > 0 ? 'green' : 'red'} />
            </div>
          ),
        },
        {
          title: '🛡️ Module 3: Digital Immune System', sub: 'Glial Cells',
          desc: 'Глиальные клетки. Цитокины при DD>0.8%. Фагоцитоз убытков.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Threat" value={`${(last.immuneSystem.threatLevel * 100).toFixed(1)}%`} color={last.immuneSystem.threatLevel > 0.5 ? 'red' : 'blue'} />
              <StatBox label="Cytokine" value={last.immuneSystem.cytokineActive ? '🔥 ACTIVE' : '✅ IDLE'} color={last.immuneSystem.cytokineActive ? 'red' : 'green'} />
              <StatBox label="Position DD" value={`${(last.immuneSystem.drawdownPct * 100).toFixed(2)}%`} color="yellow" />
            </div>
          ),
          extra: <div className="text-xs text-gray-500 mt-2">🛡️ Saves: <strong className="text-blue-400">{stats?.immuneSaves ?? 0}</strong></div>
        },
        {
          title: '🌀 Module 4: Topological Data Analysis', sub: 'Persistent Homology',
          desc: 'Персистентные гомологии. Обнаружение петель в фазовом пространстве.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Persistence" value={last.tda.persistenceScore.toFixed(3)} color="cyan" />
              <StatBox label="Topology" value={last.tda.loopDetected ? '🔴 LOOP!' : '○ No Loop'} color={last.tda.loopDetected ? 'red' : 'gray'} />
              <StatBox label="Signal" value={last.tda.topologySignal.toFixed(3)} color={last.tda.topologySignal > 0 ? 'green' : 'red'} />
            </div>
          ),
          extra: <div className="text-xs text-gray-500 mt-2">🌀 Loops: <strong className="text-cyan-400">{stats?.tdaLoopDetections ?? 0}</strong></div>
        },
        {
          title: '🧬 Module 5: Neural Darwinism', sub: 'Strategy Evolution',
          desc: '3 кластера конкурируют. Выживает минимизирующий Surprise.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              {['Trend Follower', 'Mean Reverter', 'Scalper'].map((name, idx) => (
                <div key={name} className={`bg-black/30 rounded-lg p-3 text-center border ${last.darwinism.activeCluster === idx ? 'border-yellow-500/50' : 'border-transparent'}`}>
                  <div className={`text-lg font-bold ${last.darwinism.activeCluster === idx ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {(last.darwinism.clusterFitness[idx] || 0).toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">{name}</div>
                  {last.darwinism.activeCluster === idx && <div className="text-xs text-yellow-400 mt-1">👑 DOMINANT</div>}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '🦠 Module 6: Gut-Brain Axis', sub: 'Microbiome',
          desc: 'Микробиом → блуждающий нерв → размер позиции.',
          content: (
            <div className="grid grid-cols-4 gap-3">
              <StatBox label="Health" value={`${(last.microbiome.health * 100).toFixed(0)}%`} color={last.microbiome.health > 0.6 ? 'green' : 'yellow'} />
              <StatBox label="Serotonin" value={`${(last.microbiome.serotonin * 100).toFixed(0)}%`} color="blue" />
              <StatBox label="Toxins" value={`${(last.microbiome.toxinLevel * 100).toFixed(0)}%`} color={last.microbiome.toxinLevel > 0.3 ? 'red' : 'gray'} />
              <StatBox label="Max Size" value={`${(last.microbiome.maxPositionScale * 100).toFixed(0)}%`} color={last.microbiome.maxPositionScale > 0.7 ? 'green' : 'red'} />
            </div>
          ),
        },
        {
          title: '⚛️ Module 7: Biophoton Reflex', sub: 'Quantum Entanglement',
          desc: 'Freeze Reflex при глобальном шоке. Мгновенное закрытие.',
          content: (
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Global Vol" value={`${last.biophoton.globalVolatility.toFixed(2)}x`} color={last.biophoton.globalVolatility > 2 ? 'red' : 'pink'} />
              <StatBox label="Freeze" value={last.biophoton.freezeReflex ? '🥶 FREEZE!' : '✅ Normal'} color={last.biophoton.freezeReflex ? 'red' : 'green'} />
              <StatBox label="Entanglement" value={`${(last.biophoton.entanglementScore * 100).toFixed(1)}%`} color="purple" />
            </div>
          ),
          extra: <div className="text-xs text-gray-500 mt-2">⚛️ Saves: <strong className="text-pink-400">{stats?.biophotonSaves ?? 0}</strong></div>
        },
      ].map((mod, idx) => (
        <div key={idx} className="card border border-white/10">
          <h2 className="card-title flex items-center gap-2">{mod.title} <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">{mod.sub}</span></h2>
          <p className="text-gray-400 text-sm mb-3">{mod.desc}</p>
          {mod.content}
          {mod.extra}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NEURAL TAB
// ═══════════════════════════════════════════════════════════════════
function NeuralTab({ neuralActivity, results }: { neuralActivity: number[]; results: TickResult[] }) {
  const last = results[results.length - 1];
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-title">🧠 Mushroom Body — 64 MBON Neurons</h2>
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 mt-3">
          {neuralActivity.map((a, i) => (
            <div key={i} className="aspect-square rounded-sm transition-all duration-200"
              style={{ backgroundColor: a > 0.5 ? `rgba(74,158,255,${a})` : 'rgba(74,158,255,0.1)', boxShadow: a > 0.7 ? `0 0 ${a * 12}px rgba(74,158,255,0.5)` : 'none' }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-title">🔵 PAM (Appetitive)</h2>
          <div className="w-full h-5 bg-black/40 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${(last?.dopamine?.pam ?? 0) * 100}%` }} />
          </div>
          <div className="text-green-400 font-mono text-sm mt-1">{((last?.dopamine?.pam ?? 0) * 100).toFixed(1)}%</div>
        </div>
        <div className="card">
          <h2 className="card-title">🔴 PPL1 (Aversive)</h2>
          <div className="w-full h-5 bg-black/40 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all" style={{ width: `${(last?.dopamine?.ppl1 ?? 0) * 100}%` }} />
          </div>
          <div className="text-red-400 font-mono text-sm mt-1">{((last?.dopamine?.ppl1 ?? 0) * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div className="card">
        <h2 className="card-title">⚡ Descending Neurons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <DNCell label="DN-L (Yaw Left)" value={last?.motor?.yawLeft ?? 0} color="green" />
          <DNCell label="DN-R (Yaw Right)" value={last?.motor?.yawRight ?? 0} color="red" />
          <DNCell label="DN-V (Velocity)" value={last?.motor?.velocity ?? 0} color="blue" />
          <DNCell label="DN-A (Aversive)" value={last?.motor?.aversive ?? 0} color="pink" />
        </div>
      </div>
      <div className="card">
        <h2 className="card-title">⚛️ Quantum STDP</h2>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-black/30 rounded-lg p-3 text-center"><div className="text-xl font-bold text-purple-400">{(last?.quantum?.amplitude ?? 0).toFixed(3)}</div><div className="text-xs text-gray-500">Amplitude</div></div>
          <div className="bg-black/30 rounded-lg p-3 text-center"><div className="text-xl font-bold text-blue-400">{(last?.quantum?.phase ?? 0).toFixed(3)}</div><div className="text-xs text-gray-500">Phase</div></div>
          <div className="bg-black/30 rounded-lg p-3 text-center"><div className="text-xl font-bold text-green-400">{last?.quantum?.collapsed ? 'YES' : 'NO'}</div><div className="text-xs text-gray-500">Collapsed</div></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRADES TAB
// ═══════════════════════════════════════════════════════════════════
function TradesTab({ results, trades }: { results: TickResult[]; trades: Trade[] }) {
  return (
    <div className="space-y-4">
      {trades.length > 0 && (
        <div className="card">
          <h2 className="card-title">💼 Completed Trades ({trades.length})</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 mt-3">
            {trades.map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/30" style={{ borderLeft: `3px solid ${t.pnl > 0 ? '#4ade80' : '#f87171'}` }}>
                <span className="text-gray-500 text-xs w-6">#{i + 1}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${t.direction === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.direction}</span>
                <span className="text-gray-300 font-mono text-sm flex-1">{t.entryPrice.toFixed(4)} → {t.exitPrice.toFixed(4)}</span>
                <span className={`font-mono text-sm font-bold ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}$</span>
                <span className="text-xs text-gray-500">{t.holdTicks}t</span>
                <span className="text-xs text-gray-500 hidden sm:inline">{t.exitReason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h2 className="card-title">📝 All Decisions (last 50)</h2>
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 mt-3">
          {[...results].reverse().slice(0, 50).map(r => (
            <div key={r.tick} className="flex items-center gap-2 p-2 rounded bg-black/30" style={{ borderLeft: `2px solid ${r.direction === 'LONG' ? '#4ade80' : r.direction === 'SHORT' ? '#f87171' : r.direction === 'HOLD' ? '#fbbf24' : '#f472b6'}` }}>
              <span className="text-gray-500 text-xs font-mono w-10">#{r.tick}</span>
              <span className="text-gray-300 font-mono text-sm flex-1">{r.price.toFixed(4)}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.direction === 'LONG' ? 'bg-green-500/20 text-green-400' : r.direction === 'SHORT' ? 'bg-red-500/20 text-red-400' : r.direction === 'HOLD' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-pink-500/20 text-pink-400'}`}>{r.direction}</span>
              <span className="text-gray-500 text-xs">ε:{r.surprise.toFixed(3)}</span>
              <span className="text-gray-500 text-xs hidden md:inline">R:{r.chronobiology.resonance.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURE TAB
// ═══════════════════════════════════════════════════════════════════
function ArchitectureTab() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-title">🧬 7 Bio-Inspired Modules</h2>
        <div className="space-y-2 mt-3">
          {[
            { n: 1, name: 'Chronobiology', icon: '🕐', desc: '3 циркадных осциллятора (1m/15m/4h). Фазовый резонанс.' },
            { n: 2, name: 'Swarm Pheromones', icon: '🐜', desc: 'Феромонное поле толпы. Fear/Greed.' },
            { n: 3, name: 'Digital Immune System', icon: '🛡️', desc: 'Глиальные клетки. Цитокины при DD>0.8%.' },
            { n: 4, name: 'Topological Data Analysis', icon: '🌀', desc: 'Персистентные гомологии. Обнаружение петель.' },
            { n: 5, name: 'Neural Darwinism', icon: '🧬', desc: '3 кластера стратегий конкурируют.' },
            { n: 6, name: 'Gut-Brain Axis', icon: '🦠', desc: 'Микробиом → размер позиции.' },
            { n: 7, name: 'Biophoton Reflex', icon: '⚛️', desc: 'Freeze Reflex при шоке.' },
          ].map(m => (
            <div key={m.n} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
              <div className="text-2xl">{m.icon}</div>
              <div className="flex-1">
                <span className="font-medium text-gray-200">{m.n}. {m.name}</span>
                <div className="text-sm text-gray-500 mt-0.5">{m.desc}</div>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded h-fit">ACTIVE</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📊 Торговые пары и таймфреймы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-medium mb-2">📈 Пары</h3>
            <div className="space-y-1">
              {TRADING_PAIRS.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.symbol}</span>
                  <span className="text-gray-600">— {p.name}</span>
                  {p.isSpread && <span className="text-xs bg-purple-500/20 text-purple-400 px-1 rounded">SPREAD</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-medium mb-2">⏱️ Таймфреймы</h3>
            <div className="space-y-1">
              {TIMEFRAMES.map(tf => (
                <div key={tf.id} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-mono text-blue-400 w-8">{tf.label}</span>
                  <span>{tf.description}</span>
                  <span className="text-gray-600 text-xs">({tf.coingeckoDays}d data)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">🏗️ Full Pipeline</h2>
        <div className="space-y-2 mt-3">
          {[
            'Market Data → CoinGecko API (Real) / Generator (Demo)',
            'Timeframe Resampling (1m → 1D)',
            'Spread Computation (BTC/ETH, ETH/SOL)',
            'Sensory Mapping (ORN + Mechanosensory)',
            'Chronobiology (3 Oscillators + Resonance)',
            'Pheromone Field (Fear/Greed)',
            'TDA (Persistent Homology)',
            'Active Inference (Surprise + Free Energy)',
            'Neural Darwinism (Cluster Competition)',
            'Quantum STDP (Weight Update)',
            'Immune System (Glial Cell Check)',
            'Microbiome Gate (Position Sizing)',
            'Motor Decoding (DN → Trade Intent)',
            'Biophoton Reflex (Emergency Override)',
            'Execution → Trade Signal',
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-blue-400 font-mono text-xs w-6">{i + 1}.</span>
              <span className="text-gray-300">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  const c: Record<string, string> = { blue: 'text-blue-400 border-blue-500/20', green: 'text-green-400 border-green-500/20', purple: 'text-purple-400 border-purple-500/20', yellow: 'text-yellow-400 border-yellow-500/20', pink: 'text-pink-400 border-pink-500/20' };
  return (
    <div className={`bg-black/30 rounded-xl p-3 border ${c[color] || c.blue}`}>
      <div className="flex items-center gap-2 mb-1"><span>{icon}</span><span className="text-xs text-gray-500 uppercase">{label}</span></div>
      <div className={`text-lg font-bold font-mono ${c[color]?.split(' ')[0]}`}>{value}</div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const c: Record<string, string> = { green: 'bg-green-500/20 text-green-400 border-green-500/30', blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30', purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30', yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${c[color]}`}>{children}</span>;
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const tc: Record<string, string> = { green: 'text-green-400', red: 'text-red-400', blue: 'text-blue-400', pink: 'text-pink-400', yellow: 'text-yellow-400', purple: 'text-purple-400', cyan: 'text-cyan-400', gray: 'text-gray-400' };
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className={`text-lg font-bold ${tc[color] || 'text-gray-400'}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value, color, note }: { label: string; value: number; color: string; note: string }) {
  const bc: Record<string, string> = { purple: 'from-purple-500 to-pink-400', green: 'from-green-500 to-emerald-400', blue: 'from-blue-500 to-cyan-400', yellow: 'from-yellow-500 to-orange-400', red: 'from-red-500 to-pink-400' };
  return (
    <div className="bg-black/30 rounded-lg p-3 mt-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}:</span>
        <span className="text-gray-300 font-mono">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${bc[color] || bc.blue} rounded-full transition-all`} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{note}</p>
    </div>
  );
}

function DNCell({ label, value, color }: { label: string; value: number; color: string }) {
  const bg: Record<string, string> = { green: 'from-green-500 to-emerald-400', red: 'from-red-500 to-orange-400', blue: 'from-blue-500 to-cyan-400', pink: 'from-pink-500 to-rose-400' };
  const tc: Record<string, string> = { green: 'text-green-400', red: 'text-red-400', blue: 'text-blue-400', pink: 'text-pink-400' };
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className={`text-lg font-bold ${tc[color]}`}>{(value * 100).toFixed(1)}%</div>
      <div className="text-xs text-gray-500 mt-0.5 mb-1">{label}</div>
      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${bg[color]} rounded-full transition-all`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const tc = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'blue' ? 'text-blue-400' : color === 'yellow' ? 'text-yellow-400' : color === 'purple' ? 'text-purple-400' : 'text-white';
  return <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">{label}</span><span className={`font-mono font-bold text-sm ${tc}`}>{value}</span></div>;
}

function EmptyScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">🧬</div>
        <h1 className="text-3xl text-blue-400 font-bold mb-2">Stonkfly Pro v3.0</h1>
        <p className="text-gray-400 mb-6">7 Bio-Inspired Modules | Real Market Data | Multi-Pair Multi-TF</p>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-6 text-left">
          <h3 className="text-blue-400 font-semibold mb-3">🧬 7 модулей:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-300">
            <div>🕐 Chronobiology</div>
            <div>🐜 Swarm Pheromones</div>
            <div>🛡️ Digital Immune System</div>
            <div>🌀 Topological Data Analysis</div>
            <div>🧬 Neural Darwinism</div>
            <div>🦠 Gut-Brain Axis</div>
            <div>⚛️ Biophoton Reflex</div>
          </div>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-500/50 rounded-xl text-blue-300 text-lg font-bold hover:from-blue-500/40 hover:to-purple-500/40 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        >
          ▶️ Запустить симуляцию
        </button>
        <p className="text-gray-500 text-xs mt-4">Настройте параметры и нажмите кнопку для запуска</p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🧬</div>
        <h1 className="text-2xl text-blue-400 font-bold">Initializing Singularity Protocol...</h1>
        <p className="text-gray-500 mt-2">Loading 7 bio-inspired modules</p>
      </div>
    </div>
  );
}

export default App;
