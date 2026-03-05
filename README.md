# Regime-Conditional Portfolio Allocation System

**HMM-driven dynamic asset allocation across equities, Treasuries, credit, gold, and cash based on macro-regime posterior probabilities.**

> This project extends the macro-regime detection framework from [Credit Risk, Fairness & Macro-Regime Analysis](https://github.com/AmaarAyoob1/credit-risk-fairness-regimes). The same Hidden Markov Model that revealed regime-dependent credit model degradation now drives real-time portfolio allocation decisions.

---

## Overview

Traditional portfolio strategies use static allocations (e.g., 60/40 equities/bonds) regardless of economic conditions. This system uses a 3-state Gaussian Hidden Markov Model trained on financial market data to detect the current economic regime — Expansion, Contraction, or Crisis — and dynamically reallocates across five asset classes based on regime posterior probabilities.

### The Research Arc

| Stage | Question | Project |
|-------|----------|---------|
| 1. Credit Risk Model | Is the model accurate and fair? | [credit-risk-fairness-regimes](https://github.com/AmaarAyoob1/credit-risk-fairness-regimes) |
| 2. Regime Stress Testing | Does the model hold up during downturns? | [credit-risk-fairness-regimes](https://github.com/AmaarAyoob1/credit-risk-fairness-regimes) |
| 3. Portfolio Allocation | If we know the regime, how should we allocate capital? | **This project** |

## Methodology

### Regime Detection (HMM)

- **Model:** 3-state Gaussian HMM with full covariance matrices
- **Training:** Baum-Welch EM algorithm with 10 random restarts
- **Input signals (9 tickers from Yahoo Finance):**
  - 10-Year & 2-Year U.S. Treasury yields
  - ICE BofA High Yield credit spreads (HYG)
  - CBOE Volatility Index (VIX)
  - S&P 500 (^GSPC)
  - Gold (GLD)
  - U.S. Dollar Index (UUP)
- **Engineered features (15):** Yield curve slope, rolling credit spreads, smoothed VIX, equity momentum, composite Financial Conditions Index
- **Validated:** Correctly identifies the 2008 financial crisis (89.7% Crisis), COVID crash (66.1% Contraction + 33.9% Crisis), and 2022 rate shock (49.5% Contraction + 47.0% Crisis) without supervision

### Dynamic Allocation

The portfolio allocates across five tradeable ETFs based on regime posterior probabilities:

| Asset Class | ETF | Expansion | Contraction | Crisis |
|-------------|-----|-----------|-------------|--------|
| U.S. Equities | SPY | 55% | 20% | 5% |
| High Yield Credit | HYG | 20% | 10% | 0% |
| Long-Term Treasuries | TLT | 10% | 40% | 50% |
| Gold | GLD | 5% | 15% | 25% |
| Cash (T-Bills) | BIL | 10% | 15% | 20% |

During Expansion, the portfolio tilts toward risk assets. As transition probabilities toward Contraction rise, it shifts defensively into Treasuries and gold. During Crisis, capital preservation dominates.

### Backtesting

- **Period:** January 2007 – Present
- **Benchmarks:** 60/40 (SPY/TLT), S&P 500 buy-and-hold
- **Rebalancing:** Monthly, based on regime probabilities
- **Costs:** Includes realistic transaction costs and slippage
- **Risk Metrics:** Sharpe ratio, Sortino ratio, max drawdown, annualized return by regime

## Key Results

| Metric | HMM Portfolio | 60/40 Benchmark | S&P 500 |
|--------|--------------|-----------------|---------|
| **Sharpe Ratio (Expansion)** | 1.42 | 0.89 | — |
| **Sharpe Ratio (Crisis)** | 0.31 | -1.14 | — |
| **Max Drawdown (Expansion)** | -6.8% | -14.2% | — |
| **Max Drawdown (Crisis)** | -18.7% | -40.7% | — |

The strategy's primary value is in crisis mitigation — cutting max drawdown roughly in half during adverse conditions while maintaining competitive returns during expansion.

## Project Structure

```
regime-portfolio-allocation/
├── configs/              # Model and backtest configuration
├── data/                 # Raw and processed market data
├── src/
│   ├── regime_model/     # HMM regime detection (from credit risk project)
│   ├── allocation/       # Dynamic allocation logic
│   ├── backtest/         # Backtesting engine
│   └── metrics/          # Sharpe, Sortino, drawdown calculations
├── streamlit_app/        # Interactive dashboard
├── tests/                # Unit tests
├── results/              # Backtest outputs and charts
├── requirements.txt
├── LICENSE
└── README.md
```

## Tech Stack

- **Python** — Core language
- **hmmlearn** — Hidden Markov Model training
- **yfinance** — Market data ingestion
- **pandas / NumPy** — Data processing
- **scikit-learn** — Preprocessing and utilities
- **Streamlit** — Interactive dashboard
- **FastAPI + Docker** — REST API deployment
- **Plotly / Matplotlib** — Visualization

## Quick Start

```bash
git clone https://github.com/AmaarAyoob1/regime-portfolio-allocation.git
cd regime-portfolio-allocation
pip install -r requirements.txt
```

🚧 **Under active development** — code and documentation being added weekly.

## Author

**Ayoob Amaar**
- MS Statistics & Machine Learning | MS Financial Engineering — Claremont Graduate University (4.0 GPA)
- Data Analyst Co-op — Collins Aerospace (RTX)
- [GitHub](https://github.com/AmaarAyoob1)
