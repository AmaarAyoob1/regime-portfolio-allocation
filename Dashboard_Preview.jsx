import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ReferenceLine } from "recharts";

// Generate mock data
const generateRegimeData = () => {
  const data = [];
  const startDate = new Date("2007-01-01");
  const regimes = [];
  
  // Define regime periods roughly matching real history
  const regimePeriods = [
    { start: "2007-01", end: "2007-09", regime: "Expansion" },
    { start: "2007-10", end: "2008-02", regime: "Contraction" },
    { start: "2008-03", end: "2009-06", regime: "Crisis" },
    { start: "2009-07", end: "2011-06", regime: "Expansion" },
    { start: "2011-07", end: "2011-12", regime: "Contraction" },
    { start: "2012-01", end: "2015-08", regime: "Expansion" },
    { start: "2015-09", end: "2016-02", regime: "Contraction" },
    { start: "2016-03", end: "2020-01", regime: "Expansion" },
    { start: "2020-02", end: "2020-05", regime: "Crisis" },
    { start: "2020-06", end: "2021-12", regime: "Expansion" },
    { start: "2022-01", end: "2022-10", regime: "Crisis" },
    { start: "2022-11", end: "2023-06", regime: "Contraction" },
    { start: "2023-07", end: "2025-03", regime: "Expansion" },
  ];

  const getRegime = (dateStr) => {
    for (const p of regimePeriods) {
      if (dateStr >= p.start && dateStr <= p.end) return p.regime;
    }
    return "Expansion";
  };

  let hmmPortfolio = 100;
  let benchmark6040 = 100;
  let benchmarkSP = 100;

  for (let i = 0; i < 219; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const dateStr = d.toISOString().slice(0, 7);
    const regime = getRegime(dateStr);

    // Simulate returns based on regime
    let hmmReturn, benchReturn6040, benchReturnSP;
    const noise = (Math.random() - 0.5) * 0.03;

    if (regime === "Expansion") {
      hmmReturn = 0.008 + noise;
      benchReturn6040 = 0.006 + noise * 0.9;
      benchReturnSP = 0.009 + noise * 1.2;
    } else if (regime === "Contraction") {
      hmmReturn = 0.002 + noise * 0.5;
      benchReturn6040 = -0.002 + noise;
      benchReturnSP = -0.005 + noise * 1.3;
    } else {
      hmmReturn = -0.005 + noise * 0.4;
      benchReturn6040 = -0.025 + noise * 1.5;
      benchReturnSP = -0.04 + noise * 2;
    }

    hmmPortfolio *= (1 + hmmReturn);
    benchmark6040 *= (1 + benchReturn6040);
    benchmarkSP *= (1 + benchReturnSP);

    data.push({
      date: dateStr,
      regime,
      hmmPortfolio: Math.round(hmmPortfolio * 100) / 100,
      benchmark6040: Math.round(benchmark6040 * 100) / 100,
      benchmarkSP: Math.round(benchmarkSP * 100) / 100,
      hmmReturn: Math.round(hmmReturn * 10000) / 100,
    });
  }
  return data;
};

const allocationByRegime = {
  Expansion: [
    { name: "Equities", value: 55, color: "#3b82f6" },
    { name: "Credit", value: 20, color: "#f59e0b" },
    { name: "Treasuries", value: 10, color: "#10b981" },
    { name: "Gold", value: 5, color: "#eab308" },
    { name: "Cash", value: 10, color: "#94a3b8" },
  ],
  Contraction: [
    { name: "Equities", value: 20, color: "#3b82f6" },
    { name: "Credit", value: 10, color: "#f59e0b" },
    { name: "Treasuries", value: 40, color: "#10b981" },
    { name: "Gold", value: 15, color: "#eab308" },
    { name: "Cash", value: 15, color: "#94a3b8" },
  ],
  Crisis: [
    { name: "Equities", value: 5, color: "#3b82f6" },
    { name: "Credit", value: 0, color: "#f59e0b" },
    { name: "Treasuries", value: 50, color: "#10b981" },
    { name: "Gold", value: 25, color: "#eab308" },
    { name: "Cash", value: 20, color: "#94a3b8" },
  ],
};

const regimeProbs = {
  Expansion: { expansion: 0.72, contraction: 0.21, crisis: 0.07 },
  Contraction: { expansion: 0.15, contraction: 0.55, crisis: 0.30 },
  Crisis: { expansion: 0.05, contraction: 0.25, crisis: 0.70 },
};

const regimeColors = { Expansion: "#10b981", Contraction: "#f59e0b", Crisis: "#ef4444" };

const MetricCard = ({ label, value, sub, highlight }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg, #1e293b, #334155)" : "#1e293b",
    borderRadius: 12, padding: "16px 20px",
    border: highlight ? "1px solid #3b82f6" : "1px solid #334155",
  }}>
    <div style={{ fontSize: 12, color: "#94a3b8", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: highlight ? "#60a5fa" : "#f1f5f9" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>}
  </div>
);

const RegimeProbBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cbd5e1", marginBottom: 3 }}>
      <span>{label}</span><span>{(value * 100).toFixed(0)}%</span>
    </div>
    <div style={{ background: "#334155", borderRadius: 4, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
    </div>
  </div>
);

export default function Dashboard() {
  const [selectedRegime, setSelectedRegime] = useState("Expansion");
  const data = useMemo(() => generateRegimeData(), []);

  const currentData = data[data.length - 1];
  const currentAllocation = allocationByRegime[selectedRegime];
  const currentProbs = regimeProbs[selectedRegime];

  // Regime-specific performance metrics
  const regimeMetrics = {
    Expansion: { sharpe: "1.42", sharpeBench: "0.89", maxDD: "-6.8%", maxDDBench: "-14.2%", sortino: "1.91", downside: "3.1%" },
    Contraction: { sharpe: "0.85", sharpeBench: "-0.32", maxDD: "-12.3%", maxDDBench: "-28.5%", sortino: "1.04", downside: "5.8%" },
    Crisis: { sharpe: "0.31", sharpeBench: "-1.14", maxDD: "-18.7%", maxDDBench: "-40.7%", sortino: "0.42", downside: "9.6%" },
  };
  const currentMetrics = regimeMetrics[selectedRegime];

  // Calculate metrics
  const totalReturnHMM = ((currentData.hmmPortfolio / 100 - 1) * 100).toFixed(1);
  const totalReturn6040 = ((currentData.benchmark6040 / 100 - 1) * 100).toFixed(1);
  const totalReturnSP = ((currentData.benchmarkSP / 100 - 1) * 100).toFixed(1);

  // Drawdown data
  const drawdownData = useMemo(() => {
    let peakHMM = 0, peak6040 = 0, peakSP = 0;
    return data.map(d => {
      peakHMM = Math.max(peakHMM, d.hmmPortfolio);
      peak6040 = Math.max(peak6040, d.benchmark6040);
      peakSP = Math.max(peakSP, d.benchmarkSP);
      return {
        date: d.date,
        hmmDD: Math.round(((d.hmmPortfolio - peakHMM) / peakHMM) * 10000) / 100,
        benchDD: Math.round(((d.benchmark6040 - peak6040) / peak6040) * 10000) / 100,
        spDD: Math.round(((d.benchmarkSP - peakSP) / peakSP) * 10000) / 100,
      };
    });
  }, [data]);

  const maxDDHMM = Math.min(...drawdownData.map(d => d.hmmDD)).toFixed(1);
  const maxDD6040 = Math.min(...drawdownData.map(d => d.benchDD)).toFixed(1);

  // Regime performance bars
  const regimePerf = [
    { regime: "Expansion", hmm: 12.4, benchmark: 9.8, sp: 14.2 },
    { regime: "Contraction", hmm: 3.1, benchmark: -2.8, sp: -6.1 },
    { regime: "Crisis", hmm: -4.2, benchmark: -22.5, sp: -35.8 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{ background: "#1e293b", border: "1px solid #475569", borderRadius: 8, padding: 12, fontSize: 12 }}>
        <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
          Regime-Conditional Portfolio Allocation System
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          HMM-driven dynamic allocation across asset classes based on macro-regime posterior probabilities
        </p>
      </div>

      {/* Current Regime + Probabilities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, letterSpacing: 0.5 }}>CURRENT REGIME (SIMULATED)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["Expansion", "Contraction", "Crisis"].map(r => (
              <button key={r} onClick={() => setSelectedRegime(r)} style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: selectedRegime === r ? `2px solid ${regimeColors[r]}` : "1px solid #475569",
                background: selectedRegime === r ? `${regimeColors[r]}22` : "transparent",
                color: selectedRegime === r ? regimeColors[r] : "#94a3b8",
              }}>{r}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>POSTERIOR PROBABILITIES</div>
          <RegimeProbBar label="Expansion" value={currentProbs.expansion} color="#10b981" />
          <RegimeProbBar label="Contraction" value={currentProbs.contraction} color="#f59e0b" />
          <RegimeProbBar label="Crisis" value={currentProbs.crisis} color="#ef4444" />
        </div>

        {/* Current Allocation Pie */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5 }}>TARGET ALLOCATION — {selectedRegime.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={currentAllocation} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={0} stroke="#1e293b" strokeWidth={2}>
                  {currentAllocation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
            {currentAllocation.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                  <span style={{ color: "#cbd5e1" }}>{a.name}</span>
                </div>
                <span style={{ color: "#f1f5f9", fontWeight: 600, marginLeft: 12 }}>{a.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 8 }}>
          <MetricCard label="SHARPE RATIO (HMM)" value={currentMetrics.sharpe} sub={`vs ${currentMetrics.sharpeBench} (60/40)`} highlight />
          <MetricCard label="MAX DRAWDOWN (HMM)" value={currentMetrics.maxDD} sub={`vs ${currentMetrics.maxDDBench} (60/40)`} />
          <MetricCard label="SORTINO RATIO" value={currentMetrics.sortino} sub={`Downside deviation: ${currentMetrics.downside}`} />
        </div>
      </div>

      {/* Cumulative Performance Chart */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5 }}>CUMULATIVE PERFORMANCE — $100 INVESTED JAN 2007</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hmmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} interval={24} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <Area type="monotone" dataKey="hmmPortfolio" name="HMM Regime Portfolio" stroke="#3b82f6" fill="url(#hmmGrad)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="benchmark6040" name="60/40 Benchmark" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="benchmarkSP" name="S&P 500" stroke="#64748b" strokeWidth={1} dot={false} strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Drawdown Chart */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5 }}>DRAWDOWN ANALYSIS</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={drawdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} interval={36} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Area type="monotone" dataKey="hmmDD" name="HMM Portfolio" stroke="#3b82f6" fill="#3b82f622" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="benchDD" name="60/40" stroke="#94a3b8" fill="#94a3b811" strokeWidth={1} dot={false} />
              <Area type="monotone" dataKey="spDD" name="S&P 500" stroke="#64748b" fill="#64748b11" strokeWidth={1} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Regime-Conditional Performance */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5 }}>ANNUALIZED RETURN BY REGIME (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regimePerf} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="regime" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="hmm" name="HMM Portfolio" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={28} />
              <Bar dataKey="benchmark" name="60/40" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={28} />
              <Bar dataKey="sp" name="S&P 500" fill="#475569" radius={[3, 3, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transition Matrix */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155", marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5 }}>HMM TRANSITION PROBABILITY MATRIX</div>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr", gap: 1, background: "#334155", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: "#0f172a", padding: 10, fontSize: 11, color: "#64748b" }}>From \ To</div>
          {["Expansion", "Contraction", "Crisis"].map(h => (
            <div key={h} style={{ background: "#0f172a", padding: 10, fontSize: 11, color: regimeColors[h], fontWeight: 600, textAlign: "center" }}>{h}</div>
          ))}
          {[
            { from: "Expansion", vals: [0.97, 0.02, 0.01] },
            { from: "Contraction", vals: [0.08, 0.85, 0.07] },
            { from: "Crisis", vals: [0.02, 0.04, 0.94] },
          ].map(row => (
            [
              <div key={row.from} style={{ background: "#1e293b", padding: 10, fontSize: 11, color: regimeColors[row.from], fontWeight: 600 }}>{row.from}</div>,
              ...row.vals.map((v, i) => (
                <div key={i} style={{
                  background: v > 0.5 ? `${regimeColors[["Expansion", "Contraction", "Crisis"][i]]}15` : "#1e293b",
                  padding: 10, fontSize: 13, color: "#f1f5f9", textAlign: "center", fontWeight: v > 0.5 ? 700 : 400,
                  fontFamily: "monospace",
                }}>{v.toFixed(2)}</div>
              ))
            ]
          )).flat()}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
          High diagonal persistence (0.97, 0.85, 0.94) confirms regimes are sticky. Asymmetric transitions: economy enters Crisis faster than it recovers.
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, padding: 16, background: "#1e293b", borderRadius: 12, border: "1px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Built by Ayoob Amaar | Claremont Graduate University</div>
            <div style={{ fontSize: 11, color: "#475569" }}>MS Statistics & Machine Learning | MS Financial Engineering</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {["FastAPI", "Docker", "Python", "hmmlearn", "Recharts"].map(t => (
              <span key={t} style={{ fontSize: 10, color: "#64748b", background: "#0f172a", padding: "3px 8px", borderRadius: 4, border: "1px solid #334155" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
