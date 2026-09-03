# Smart Income Buffer

> **Intelligent Cash Flow Stabilization & Reserve Management Platform for Irregular Earners and Gig Workers**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 1. Executive Summary

Gig workers, freelancers, and independent contractors face extreme cash flow volatility. Traditional budgeting tools assume steady bi-weekly salaries and fail when income fluctuates week-to-week.

**Smart Income Buffer** is a financial intelligence and automated reserve platform that transforms volatile cash flows into predictable financial stability. Rather than an ungrounded "AI chatbot that gives advice," Smart Income Buffer relies on a **deterministic, audited backend financial engine** to perform all calculations and decision logic, paired with a **backend-controlled AI explanation layer** that translates financial events into plain, transparent insights.

### Core Value Pipeline
```mermaid
flowchart LR
    A[Data Ingestion] --> B[Financial Intelligence]
    B --> C[Prediction Engine]
    C --> D[Decision Engine]
    D --> E[Explanation Layer]
    E --> F[Audited Action]
```
$$\text{Data} \longrightarrow \text{Intelligence} \longrightarrow \text{Prediction} \longrightarrow \text{Decision} \longrightarrow \text{Explanation} \longrightarrow \text{Action}$$

---

## 2. Core Architecture & Strict AI Boundary

```
                           +------------------------------------------+
                           |           Web / Mobile Client            |
                           |   Next.js + TypeScript + Tailwind CSS   |
                           +--------------------+---------------------+
                                                | REST / JSON
                                                v
                           +------------------------------------------+
                           |          FastAPI API Layer               |
                           |   Routing, JWT Auth, Input Validation    |
                           +--------------------+---------------------+
                                                |
        +---------------------------------------+---------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
+-----------------------+             +-----------------------+             +-----------------------+
|   Financial Engine    |             |       ML Engine       |             | AI Explanation Layer  |
| - Income Analytics    |             | - Prophet Forecast    |             | - Read-only context   |
| - Stabilized Income   |             | - Fallback Stat Model |             | - Grounded summaries  |
| - Financial Surplus   |             | - Confidence Bounds   |             | - Refuses execution   |
| - Safe-to-Save Target |             +-----------------------+             +-----------------------+
| - Resilience Scoring  |
+-----------+-----------+
            |
            v
+-----------------------------------------------------------------------------------------------+
|                      Recommendation Engine & Smart Buffer Simulation                           |
|      (Enforces Cash Floor, Protected Minimum Buffer, Audited Contribution / Withdrawal)       |
+-----------------------------------------------+-----------------------------------------------+
                                                |
                                                v
                               +----------------------------------+
                               |     PostgreSQL + SQLAlchemy      |
                               | (Audited Ledger, Personas, Logs) |
                               +----------------------------------+
```

### The Non-Negotiable AI Boundary
1. **Deterministic Calculations Only**: All financial math (surplus, safe-to-save, buffer limits, resilience) is computed in pure Python using NumPy/Pandas.
2. **AI Never Executes Money Movement**: The LLM has zero execution rights and zero write privileges to the ledger.
3. **Strict Grounding**: The LLM is supplied only read-only, backend-vetted summary facts (`get_financial_summary()`, `get_buffer_status()`). It is barred from hallucinating balances, fabricating transaction history, or approving credit.

---

## 3. Canonical Financial Definitions & Formulations

| Concept | Mathematical Formula | Purpose & Semantics |
| :--- | :--- | :--- |
| **Stabilized Income** | $0.60 \times \text{Median}_{\text{recent}} + 0.40 \times \text{Mean}_{\text{recent}}$ | Baseline of "what is normal" over the trailing 4–8 weeks, mitigating extreme single spikes or dips. |
| **Expected Income** | $\hat{Y}_{t+1} \pm 1.96 \cdot \sigma_t$ (Forecast / Fallback) | Weighted statistical expectation of upcoming income cycle. |
| **Financial Surplus** | $\max(0, \text{Actual Income} - \text{Essential Expenses} - \text{Min Cash Reserve})$ | True disposable liquidity for the period without impairing daily living. |
| **Buffer Target** | $\text{Essential Weekly Expenses} \times 4$ | Standard 1-month baseline safety cushion. |
| **Buffer Gap** | $\max(0, \text{Buffer Target} - \text{Current Buffer})$ | Remaining reserve capacity to fund. |
| **Safe-to-Save** | $\min(\text{Financial Surplus}, \text{Buffer Gap}, \text{Policy Limit}) \times \alpha$ | Recommended deposit that never breaches the cash reserve floor ($\alpha$: volatility/confidence factor). |
| **Income Volatility** | $CV = \frac{\sigma}{\mu} = \frac{\text{StdDev}(\text{Income})}{\text{Mean}(\text{Income})}$ | Coefficient of variation. Quantifies earner instability. |
| **Available Safe Buffer** | $\max(0, \text{Current Buffer} - \text{Minimum Buffer Floor})$ | Buffer liquidity authorized for drawdowns during shortfalls without depleting the protected floor. |
| **Resilience Score** | $0.25 S_{\text{inc}} + 0.30 C_{\text{buf}} + 0.20 H_{\text{exp}} + 0.25 H_{\text{cf}}$ | Normalized composite health metric ($0 - 100$) assessing stability, runway, expense strain, and cash flow. |

---

## 4. Key Features

- **Automated Volatility Smoothing**: Replaces rigid monthly budgeting with dynamic baseline tracking.
- **Protected Smart Buffer with Reserve Floor**: Configurable minimum floors prevent emergency reserves from being completely drained.
- **Multi-Persona Synthetic Generator**: Pre-loaded profiles (Stable, Moderately Volatile, Extreme Gig Volatility, Declining Trend, High Fixed Expenses).
- **Proactive Distress Early Warning**: Identifies multi-week persistent decline vs. temporary one-off dips.
- **Explainable Recommendation Feed**: Every suggestion (`SAVE_SURPLUS`, `HOLD_CASH`, `PROTECT_BUFFER`, `USE_BUFFER`) comes with explicit **What**, **Why**, **Impact**, **Priority**, and **Confidence**.
- **Audited Simulation Sandbox**: Safe sandbox enabling users to simulate deposits and withdrawals before committing real funds.

---

## 5. Repository Structure

```
smart-income-buffer/
├── apps/
│   ├── web/                    # Next.js 14+ App Router Frontend
│   │   ├── src/
│   │   │   ├── app/            # Pages & Routes (Dashboard, Buffer, Transactions, Settings)
│   │   │   ├── components/     # UI Component Library & Chart Visualizations
│   │   │   └── lib/            # API Client, State, Types
│   │   └── package.json
│   │
│   └── api/                    # FastAPI Backend Application
│       ├── app/
│       │   ├── api/            # Route Controllers (/auth, /income, /buffer, /ai, etc.)
│       │   ├── core/           # Config, Security (JWT), Database Connection
│       │   ├── engine/         # Deterministic Engines (Financial, Resilience, Rules)
│       │   ├── models/         # SQLAlchemy ORM Data Models
│       │   ├── schemas/        # Pydantic Schemas & Validation Contracts
│       │   └── services/       # AI Explanation, Forecast, Ingestion Services
│       ├── tests/              # Backend Unit & Integration Tests
│       └── requirements.txt
│
├── ml/
│   ├── datasets/               # Pre-generated synthetic persona datasets (CSV/JSON)
│   ├── features/               # Feature engineering scripts
│   └── inference/              # Prophet & Fallback statistical models
│
├── database/
│   ├── migrations/             # Alembic migration scripts
│   └── seeds/                  # Seed generators for synthetic profiles
│
├── docker-compose.yml          # Local orchestration (FastAPI + PostgreSQL + Next.js)
├── .env.example                # Canonical environment variables
└── README.md                   # Project documentation
```

---

## 6. Hackathon Golden Paths (Demo Scenarios)

### Golden Path A: High-Income Saving Event
1. User logs in to the dashboard showing their recent gig payout.
2. System computes **Stabilized Income** ($₹25,000$) and detects actual week income ($₹34,000$).
3. Surplus calculated: $₹34,000 - ₹7,000 \text{ (expenses)} - ₹2,000 \text{ (min reserve)} = ₹25,000$.
4. **Safe-to-Save** calculates a recommended deposit of **₹900** (factoring policy limit & gap).
5. User reviews recommendation card (What, Why, Impact), clicks **Simulate Save**.
6. Buffer increases, Resilience Score updates from $68 \rightarrow 74$, and AI Assistant explains why ₹900 was chosen without risking upcoming bills.

### Golden Path B: Income Shock / Low-Income Protection
1. User suffers an income drought week ($₹4,000$ vs stabilized $₹25,000$).
2. Income engine detects an income shortfall.
3. System checks the Smart Buffer ($₹18,000$) and respects the **Minimum Buffer Floor** ($₹5,000$).
4. System issues a `USE_BUFFER` controlled release recommendation to cover essential food & rent while protecting the base floor.
5. AI Assistant provides empathetic, grounded guidance explaining how the buffer softens the shock.

---

## 7. API Specification Summary

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user |
| | `POST` | `/api/v1/auth/login` | Authenticate & retrieve JWT |
| **User** | `GET` | `/api/v1/users/me` | Current profile & preferences |
| **Transactions** | `GET` | `/api/v1/transactions` | Paginated transaction ledger |
| | `POST` | `/api/v1/transactions` | Create manual transaction |
| | `POST` | `/api/v1/transactions/import` | Ingest CSV bank/gig statements |
| **Income** | `GET` | `/api/v1/income/summary` | Aggregated totals, averages, and trend |
| | `GET` | `/api/v1/income/analytics` | Volatility ($CV$), stabilized baseline |
| | `GET` | `/api/v1/income/forecast` | ML/Statistical next-cycle projection |
| **Buffer** | `GET` | `/api/v1/buffer` | Current balance, target, minimum floor |
| | `GET` | `/api/v1/buffer/history` | Audit log of buffer movements |
| | `POST` | `/api/v1/buffer/contribute` | Deposit into buffer (simulated) |
| | `POST` | `/api/v1/buffer/withdraw` | Withdraw from buffer (floor-protected) |
| **Resilience** | `GET` | `/api/v1/resilience/score` | 0–100 composite score breakdown |
| **Recommendations**| `GET` | `/api/v1/recommendations` | Active prioritized financial advice |
| | `POST` | `/api/v1/recommendations/{id}/approve`| Approve & trigger simulated action |
| | `POST` | `/api/v1/recommendations/{id}/dismiss`| Dismiss recommendation |
| **AI** | `POST` | `/api/v1/ai/chat` | Grounded AI explanation query |
| **Health** | `GET` | `/api/v1/health` | System and DB health status |

---

## 8. Quickstart & Setup Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm / yarn
- PostgreSQL (or local SQLite fallback for instant hackathon dev)
- Docker & Docker Compose (optional)

### Backend Setup
```bash
# Navigate to API directory
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../../.env.example .env

# Run database migrations & seed personas
python -m app.db.seed

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
FastAPI interactive Swagger docs will be available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
# Navigate to Web directory
cd apps/web

# Install dependencies
npm install

# Run dev server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 9. Testing & Validation

```bash
# Run backend test suite
cd apps/api
pytest tests/ -v

# Run financial math sanity checks
pytest tests/test_financial_engine.py -v
```

---

## 10. License & Disclaimer

This software is developed for educational and hackathon demonstration purposes. Financial calculations are simulated and do not constitute certified financial or fiduciary advice.
