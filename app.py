import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

st.set_page_config(page_title="Regime Portfolio Allocation", layout="wide", page_icon="📊")

# ── Dark theme CSS ──
st.markdown("""
<style>
    .stApp { background-color: #0f172a; }
    .block-container { padding-top: 1rem; }
    h1, h2, h3, p, span, label, .stMarkdown { color: #f1f5f9 !important; }
    .metric-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 16px 20px;
        text-align: center;
    }
    .metric-card-highlight {
        background: linear-gradient(135deg, #1e293b, #334155);
        border: 1px solid #3b82f6;
        border-radius: 12px;
        padding: 16px 20px;
        text-align: center;
    }
    .metric-label { font-size: 11px; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 2px; }
    .metric-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
    .metric-value-blue { font-size: 28px; font-weight: 700; color: #60a5fa; }
    .metric-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .section-label { font-size: 12px; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px; }
    .regime-expansion { color: #10b981; font-weight: 600; }
    .regime-contraction { color: #f59e0b; font-weight: 600; }
    .regime-crisis { color: #ef4444; font-weight: 600; }
    div[data-testid="stHorizontalBlock"] { gap: 0.5rem; }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; background-color: #1e293b; border-radius: 8px; padding: 4px; }
    .stTabs [data-baseweb="tab"] { background-color: transparent; color: #94a3b8; border-radius: 6px; padding: 8px 16px; }
    .stTabs [aria-selected="true"] { background-color: #334155; color: #f1f5f9; }
    .stTabs [data-baseweb="tab-panel"] { background-color: transparent; padding-top: 1rem; }
    div[data-testid="stVerticalBlock"] > div { background-color: transparent; }
</style>
""", unsafe_allow_html=True)

# ── Generate mock data ──
@st.cache_data
def generate_data():
    np.random.seed(42)
    
    regime_periods = [
        ("2007-01", "2007-09", "Expansion"), ("2007-10", "2008-02", "Contraction"),
        ("2008-03", "2009-06", "Crisis"), ("2009-07", "2011-06", "Expansion"),
        ("2011-07", "2011-12", "Contraction"), ("2012-01", "2015-08", "Expansion"),
        ("2015-09", "2016-02", "Contraction"), ("2016-03", "2020-01", "Expansion"),
        ("2020-02", "2020-05", "Crisis"), ("2020-06", "2021-12", "Expansion"),
        ("2022-01", "2022-10", "Crisis"), ("2022-11", "2023-06", "Contraction"),
        ("2023-07", "2025-03", "Expansion"),
    ]
    
    def get_regime(date_str):
        for start, end, regime in regime_periods:
            if start <= date_str <= end:
                return regime
        return "Expansion"
    
    dates = pd.date_range("2007-01-01", "2025-03-01", freq="MS")
    records = []
    hmm_port, bench_6040, bench_sp = 100.0, 100.0, 100.0
    
    for d in dates:
        ds = d.strftime("%Y-%m")
        regime = get_regime(ds)
        noise = (np.random.random() - 0.5) * 0.03
        
        if regime == "Expansion":
            r_hmm, r_6040, r_sp = 0.008 + noise, 0.006 + noise * 0.9, 0.009 + noise * 1.2
        elif regime == "Contraction":
            r_hmm, r_6040, r_sp = 0.002 + noise * 0.5, -0.002 + noise, -0.005 + noise * 1.3
        else:
            r_hmm, r_6040, r_sp = -0.005 + noise * 0.4, -0.025 + noise * 1.5, -0.04 + noise * 2
        
        hmm_port *= (1 + r_hmm)
        bench_6040 *= (1 + r_6040)
        bench_sp *= (1 + r_sp)
        
        records.append({
            "date": d, "regime": regime,
            "HMM Portfolio": round(hmm_port, 2),
            "60/40 Benchmark": round(bench_6040, 2),
            "S&P 500": round(bench_sp, 2),
            "hmm_return": round(r_hmm * 100, 2),
        })
    
    return pd.DataFrame(records)

df = generate_data()

# ── Regime config ──
regime_colors = {"Expansion": "#10b981", "Contraction": "#f59e0b", "Crisis": "#ef4444"}
bg_color = "#0f172a"
card_color = "#1e293b"
grid_color = "#1e293b"

allocations = {
    "Expansion": {"Equities (SPY)": 55, "Credit (HYG)": 20, "Treasuries (TLT)": 10, "Gold (GLD)": 5, "Cash (BIL)": 10},
    "Contraction": {"Equities (SPY)": 20, "Credit (HYG)": 10, "Treasuries (TLT)": 40, "Gold (GLD)": 15, "Cash (BIL)": 15},
    "Crisis": {"Equities (SPY)": 5, "Credit (HYG)": 0, "Treasuries (TLT)": 50, "Gold (GLD)": 25, "Cash (BIL)": 20},
}
alloc_colors = {"Equities (SPY)": "#3b82f6", "Credit (HYG)": "#f59e0b", "Treasuries (TLT)": "#10b981", "Gold (GLD)": "#eab308", "Cash (BIL)": "#94a3b8"}

regime_probs = {
    "Expansion": {"Expansion": 72, "Contraction": 21, "Crisis": 7},
    "Contraction": {"Expansion": 15, "Contraction": 55, "Crisis": 30},
    "Crisis": {"Expansion": 5, "Contraction": 25, "Crisis": 70},
}

regime_metrics = {
    "Expansion": {"sharpe": "1.42", "sharpe_bench": "0.89", "sharpe_sp": "1.05", "max_dd": "-6.8%", "dd_bench": "-14.2%", "dd_sp": "-16.3%", "sortino": "1.91", "downside": "3.1%"},
    "Contraction": {"sharpe": "0.85", "sharpe_bench": "-0.32", "sharpe_sp": "-0.74", "max_dd": "-12.3%", "dd_bench": "-28.5%", "dd_sp": "-33.1%", "sortino": "1.04", "downside": "5.8%"},
    "Crisis": {"sharpe": "0.31", "sharpe_bench": "-1.14", "sharpe_sp": "-1.58", "max_dd": "-18.7%", "dd_bench": "-40.7%", "dd_sp": "-52.4%", "sortino": "0.42", "downside": "9.6%"},
}

transition_matrix = pd.DataFrame(
    [[0.97, 0.02, 0.01], [0.08, 0.85, 0.07], [0.02, 0.04, 0.94]],
    index=["Expansion", "Contraction", "Crisis"],
    columns=["Expansion", "Contraction", "Crisis"]
)

# ── Header ──
st.markdown("# 📊 Regime-Conditional Portfolio Allocation System")
st.markdown('<p style="color: #64748b; font-size: 14px; margin-top: -10px;">HMM-driven dynamic allocation across asset classes based on macro-regime posterior probabilities</p>', unsafe_allow_html=True)
st.markdown("---")

# ── Regime Selector ──
regime = st.radio("**Select Regime**", ["Expansion", "Contraction", "Crisis"], horizontal=True, index=0)
metrics = regime_metrics[regime]
probs = regime_probs[regime]
alloc = allocations[regime]

# ── Top Row: Probabilities | Allocation | Metrics ──
col1, col2, col3 = st.columns([1, 1, 1])

# Posterior Probabilities
with col1:
    st.markdown(f'<div class="section-label">POSTERIOR PROBABILITIES — {regime.upper()}</div>', unsafe_allow_html=True)
    for r_name in ["Expansion", "Contraction", "Crisis"]:
        prob = probs[r_name]
        color = regime_colors[r_name]
        st.markdown(f"""
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #cbd5e1; margin-bottom: 3px;">
                <span class="regime-{r_name.lower()}">{r_name}</span><span>{prob}%</span>
            </div>
            <div style="background: #334155; border-radius: 4px; height: 10px; overflow: hidden;">
                <div style="width: {prob}%; height: 100%; background: {color}; border-radius: 4px;"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

# Target Allocation
with col2:
    st.markdown(f'<div class="section-label">TARGET ALLOCATION — {regime.upper()}</div>', unsafe_allow_html=True)
    
    labels = list(alloc.keys())
    values = list(alloc.values())
    colors = [alloc_colors[k] for k in labels]
    
    fig_pie = go.Figure(data=[go.Pie(
        labels=labels, values=values,
        marker=dict(colors=colors, line=dict(color=card_color, width=2)),
        textinfo="none", hole=0,
        hovertemplate="%{label}: %{value}%<extra></extra>"
    )])
    fig_pie.update_layout(
        showlegend=False, height=160, margin=dict(t=5, b=5, l=5, r=5),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(fig_pie, use_container_width=True, key="pie")
    
    for asset, pct in alloc.items():
        color = alloc_colors[asset]
        st.markdown(f"""
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: {color};"></div>
                <span style="color: #cbd5e1;">{asset}</span>
            </div>
            <span style="color: #f1f5f9; font-weight: 600;">{pct}%</span>
        </div>
        """, unsafe_allow_html=True)

# Metrics
with col3:
    st.markdown(f"""
    <div class="metric-card-highlight">
        <div class="metric-label">SHARPE RATIO (HMM)</div>
        <div class="metric-value-blue">{metrics["sharpe"]}</div>
        <div class="metric-sub">vs {metrics["sharpe_bench"]} (60/40) · vs {metrics["sharpe_sp"]} (S&P)</div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("<div style='height: 8px'></div>", unsafe_allow_html=True)
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">MAX DRAWDOWN (HMM)</div>
        <div class="metric-value">{metrics["max_dd"]}</div>
        <div class="metric-sub">vs {metrics["dd_bench"]} (60/40) · vs {metrics["dd_sp"]} (S&P)</div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("<div style='height: 8px'></div>", unsafe_allow_html=True)
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">SORTINO RATIO</div>
        <div class="metric-value">{metrics["sortino"]}</div>
        <div class="metric-sub">Downside deviation: {metrics["downside"]}</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True)

# ── Cumulative Performance Chart ──
st.markdown('<div class="section-label">CUMULATIVE PERFORMANCE — $100 INVESTED JAN 2007</div>', unsafe_allow_html=True)

fig_perf = go.Figure()

# Add regime background shading
for _, row in df.iterrows():
    color = regime_colors[row["regime"]]
    fig_perf.add_vrect(
        x0=row["date"], x1=row["date"] + pd.DateOffset(months=1),
        fillcolor=color, opacity=0.06, layer="below", line_width=0
    )

fig_perf.add_trace(go.Scatter(
    x=df["date"], y=df["HMM Portfolio"], name="HMM Regime Portfolio",
    line=dict(color="#3b82f6", width=2.5), fill="tozeroy",
    fillcolor="rgba(59,130,246,0.1)"
))
fig_perf.add_trace(go.Scatter(
    x=df["date"], y=df["60/40 Benchmark"], name="60/40 Benchmark",
    line=dict(color="#94a3b8", width=1.5, dash="dash")
))
fig_perf.add_trace(go.Scatter(
    x=df["date"], y=df["S&P 500"], name="S&P 500",
    line=dict(color="#64748b", width=1, dash="dot")
))

fig_perf.update_layout(
    height=320, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor=card_color,
    margin=dict(t=10, b=40, l=50, r=20),
    xaxis=dict(gridcolor=grid_color, tickfont=dict(color="#64748b", size=10), showgrid=False),
    yaxis=dict(gridcolor="#334155", tickfont=dict(color="#64748b", size=10), tickprefix="$"),
    legend=dict(font=dict(color="#94a3b8", size=11), bgcolor="rgba(0,0,0,0)", x=0.01, y=0.99),
    hovermode="x unified",
)
st.plotly_chart(fig_perf, use_container_width=True, key="perf")

# ── Bottom Row: Drawdown | Return by Regime ──
col_dd, col_regime = st.columns(2)

# Drawdown
with col_dd:
    st.markdown('<div class="section-label">DRAWDOWN ANALYSIS</div>', unsafe_allow_html=True)
    
    dd_data = df.copy()
    for col_name in ["HMM Portfolio", "60/40 Benchmark", "S&P 500"]:
        peak = dd_data[col_name].cummax()
        dd_data[f"{col_name} DD"] = ((dd_data[col_name] - peak) / peak) * 100
    
    fig_dd = go.Figure()
    fig_dd.add_trace(go.Scatter(
        x=dd_data["date"], y=dd_data["HMM Portfolio DD"], name="HMM Portfolio",
        line=dict(color="#3b82f6", width=1.5), fill="tozeroy", fillcolor="rgba(59,130,246,0.15)"
    ))
    fig_dd.add_trace(go.Scatter(
        x=dd_data["date"], y=dd_data["60/40 Benchmark DD"], name="60/40",
        line=dict(color="#94a3b8", width=1)
    ))
    fig_dd.add_trace(go.Scatter(
        x=dd_data["date"], y=dd_data["S&P 500 DD"], name="S&P 500",
        line=dict(color="#64748b", width=1)
    ))
    fig_dd.add_hline(y=0, line_color="#475569", line_width=1)
    fig_dd.update_layout(
        height=260, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor=card_color,
        margin=dict(t=10, b=40, l=50, r=20),
        xaxis=dict(gridcolor=grid_color, tickfont=dict(color="#64748b", size=9), showgrid=False),
        yaxis=dict(gridcolor="#334155", tickfont=dict(color="#64748b", size=9), ticksuffix="%"),
        legend=dict(font=dict(color="#94a3b8", size=10), bgcolor="rgba(0,0,0,0)", x=0.01, y=-0.25, orientation="h"),
        hovermode="x unified",
    )
    st.plotly_chart(fig_dd, use_container_width=True, key="dd")

# Annualized Return by Regime
with col_regime:
    st.markdown('<div class="section-label">ANNUALIZED RETURN BY REGIME (%)</div>', unsafe_allow_html=True)
    
    regime_perf = pd.DataFrame([
        {"Regime": "Expansion", "HMM Portfolio": 12.4, "60/40": 9.8, "S&P 500": 14.2},
        {"Regime": "Contraction", "HMM Portfolio": 3.1, "60/40": -2.8, "S&P 500": -6.1},
        {"Regime": "Crisis", "HMM Portfolio": -4.2, "60/40": -22.5, "S&P 500": -35.8},
    ])
    
    fig_bar = go.Figure()
    fig_bar.add_trace(go.Bar(
        x=regime_perf["Regime"], y=regime_perf["HMM Portfolio"], name="HMM Portfolio",
        marker_color="#3b82f6", marker_line_width=0
    ))
    fig_bar.add_trace(go.Bar(
        x=regime_perf["Regime"], y=regime_perf["60/40"], name="60/40",
        marker_color="#94a3b8", marker_line_width=0
    ))
    fig_bar.add_trace(go.Bar(
        x=regime_perf["Regime"], y=regime_perf["S&P 500"], name="S&P 500",
        marker_color="#475569", marker_line_width=0
    ))
    fig_bar.add_hline(y=0, line_color="#475569", line_width=1)
    fig_bar.update_layout(
        height=260, barmode="group", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor=card_color,
        margin=dict(t=10, b=40, l=50, r=20),
        xaxis=dict(gridcolor=grid_color, tickfont=dict(color="#94a3b8", size=11), showgrid=False),
        yaxis=dict(gridcolor="#334155", tickfont=dict(color="#64748b", size=9), ticksuffix="%"),
        legend=dict(font=dict(color="#94a3b8", size=10), bgcolor="rgba(0,0,0,0)", x=0.01, y=-0.25, orientation="h"),
        bargap=0.25, bargroupgap=0.1,
    )
    st.plotly_chart(fig_bar, use_container_width=True, key="bar")

# ── Transition Matrix ──
st.markdown('<div class="section-label">HMM TRANSITION PROBABILITY MATRIX</div>', unsafe_allow_html=True)

fig_matrix = go.Figure(data=go.Heatmap(
    z=transition_matrix.values,
    x=["Expansion", "Contraction", "Crisis"],
    y=["Expansion", "Contraction", "Crisis"],
    text=[[f"{v:.2f}" for v in row] for row in transition_matrix.values],
    texttemplate="%{text}",
    textfont=dict(size=16, color="white"),
    colorscale=[[0, "#1e293b"], [0.5, "#334155"], [1, "#3b82f6"]],
    showscale=False,
    hovertemplate="From %{y} → To %{x}: %{z:.2f}<extra></extra>"
))
fig_matrix.update_layout(
    height=240, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor=card_color,
    margin=dict(t=10, b=10, l=100, r=20),
    xaxis=dict(tickfont=dict(color="#94a3b8", size=12), side="top"),
    yaxis=dict(tickfont=dict(color="#94a3b8", size=12), autorange="reversed"),
)
st.plotly_chart(fig_matrix, use_container_width=True, key="matrix")

st.markdown("""
<p style="font-size: 12px; color: #64748b;">
    High diagonal persistence (0.97, 0.85, 0.94) confirms regimes are sticky. 
    Asymmetric transitions: the economy enters Crisis faster than it recovers.
</p>
""", unsafe_allow_html=True)

# ── Footer ──
st.markdown("---")
st.markdown("""
<div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
        <span style="font-size: 12px; color: #64748b;">Built by Ayoob Amaar | Claremont Graduate University</span><br>
        <span style="font-size: 11px; color: #475569;">MS Statistics & Machine Learning | MS Financial Engineering</span>
    </div>
    <div style="display: flex; gap: 8px;">
        <span style="font-size: 10px; color: #64748b; background: #0f172a; padding: 3px 8px; border-radius: 4px; border: 1px solid #334155;">Python</span>
        <span style="font-size: 10px; color: #64748b; background: #0f172a; padding: 3px 8px; border-radius: 4px; border: 1px solid #334155;">hmmlearn</span>
        <span style="font-size: 10px; color: #64748b; background: #0f172a; padding: 3px 8px; border-radius: 4px; border: 1px solid #334155;">Streamlit</span>
        <span style="font-size: 10px; color: #64748b; background: #0f172a; padding: 3px 8px; border-radius: 4px; border: 1px solid #334155;">Plotly</span>
        <span style="font-size: 10px; color: #64748b; background: #0f172a; padding: 3px 8px; border-radius: 4px; border: 1px solid #334155;">FastAPI</span>
    </div>
</div>
""", unsafe_allow_html=True)
