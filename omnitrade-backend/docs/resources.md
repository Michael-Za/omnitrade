# System Resources 🛠️

To fully activate the Zero-Cost System, you must configure the external tools using the files we generated in the `resources/` directory.

## 1. TradingView Indicators 📈

**File:** [`resources/omnitrade_indicators.pine`](../resources/omnitrade_indicators.pine)

This is a **Pine Script v5** file that powers your charts.

### How to Install
1.  Log in to [TradingView](https://www.tradingview.com/).
2.  Open the "Pine Editor" tab at the bottom.
3.  Click "Open" -> "Create new indicator".
4.  Delete existing code and standard paste the contents of `omnitrade_indicators.pine`.
5.  Click "Add to Chart".

### What You Get
*   **EMA 50 & 200**: Institutional trend lines.
*   **VWAP**: Anchored to session.
*   **Visual Alerts**: Markers for VWAP Reversion and Breakouts.
*   **Webhook Ready**: Pre-configured JSON alerts.

---

## 2. Google Sheets "Core Engine" 📊

**File:** [`resources/google_sheets_formulas.md`](../resources/google_sheets_formulas.md)

This file contains the **Logic Formulas** for your Google Sheet.

### How to Setup
1.  Create a new Google Sheet.
2.  Create tabs named exactly: `MARKET_STATE`, `HEALTH_SCORE`, `BOT_PERMISSION_MATRIX`.
3.  Copy the formulas from the guide into the respective cells (e.g. `A1`, `B2`).

### Why?
This Sheet acts as the database for the entire system.
*   **State Sheet**: Tells bots if the market is trending or ranging.
*   **Health Sheet**: Tells the Governance module if it's safe to trade.
