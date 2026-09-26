# FinPulse AI — Personalized Financial Recommender & Expense Copilot

A full-stack, mobile-responsive web application (PWA) that acts as an **AI-based personalized financial advisor** for controlling expenses and suggesting tailored investments using **explicit user consent and granular privacy controls**.

---

## 🌟 Key Features

### 1. Consent-First Privacy Architecture
- **Granular Opt-In Toggles**:
  - *Share Transaction Telemetry* (Merchant names, amounts, category classification)
  - *Share Monthly Income* (Payroll & cashflow)
  - *Share Investment & Risk Profile* (Holdings, risk tolerance, emergency fund)
  - *Enable AI Financial Advisory* (Master toggle for AI model analysis)
- **Live AI Telemetry Inspector**: Users can inspect the exact sanitized JSON payload transmitted to the AI engine in real time.
- **Data Sovereignty**:
  - 1-click **Download My Data (JSON)**
  - 1-click **Wipe All My Data (Forget Me)** to purge records and revoke consent
  - 1-click **Restore Demo Profile** for easy project presentation and testing

### 2. Expense Control & Budget Management
- **The 50/30/20 Rule Engine**: Real-time evaluation of *Needs* (50%), *Wants* (30%), and *Savings/Investments* (20%).
- **Smart Spend Leakage Detection**: Flags runaway spending categories (e.g. food delivery >15% of income, dormant subscriptions, impulse shopping).
- **Bank Statement CSV Import**: Drag-and-drop or select bank CSV statements with automatic category classification.
- **Manual Quick Entry**: Add expenses or income with amount, payment method, category, and notes.

### 3. Personalized Investment Recommender
- **Dynamic Risk Profiling**: Switch between *Conservative*, *Moderate*, and *Aggressive* profiles.
- **Emergency Runway Cushion Meter**: Calculates essential monthly costs and alerts users to fund 6 months of safety runway before taking market risk.
- **Target vs. Current Asset Allocation**: Visual donut charts comparing optimal vs. current distribution across *Equities/Index Funds*, *Debt/Bonds*, *Gold/Hedges*, and *Liquid Cash*.
- **Monthly SIP Recommendations**: Recommends exact monthly allocation amounts across low-cost index funds, debt/PPF, and gold.
- **Interactive SIP Compounding Calculator**: Interactive sliders for monthly investment, investment horizon, and expected returns to project future wealth.

### 4. Interactive AI Financial Copilot
- Context-aware multi-turn conversational interface.
- Respects consent limits: If a user withholds transaction sharing, the AI gracefully declines to expose numbers and provides general heuristics.
- Powered by **Gemini 2.5 Flash** (when `GEMINI_API_KEY` is provided) or an intelligent **deterministic financial rule engine** that works 100% offline out-of-the-box.

### 5. Mobile-First & Desktop Web App (PWA)
- Fully responsive on smartphones, tablets, and laptops.
- Bottom navigation bar on mobile phones, persistent sidebar on desktop screens.
- PWA manifest (`manifest.json`) ready for home-screen installation on Android and iOS.

---

## 🏗️ Architecture & Tech Stack

```
Antigravity/
├── client/                     # Frontend (React 18, Vite, TypeScript, Tailwind CSS, Recharts)
│   ├── public/manifest.json    # Progressive Web App manifest
│   ├── src/
│   │   ├── components/         # Navbar, Navigation, ConsentBanner, Modals
│   │   ├── pages/              # Dashboard, Expenses, Investments, AIChat, ConsentCenter
│   │   ├── services/api.ts     # Client HTTP service
│   │   └── types.ts            # Data models
│   └── vite.config.ts
├── server/                     # Backend (Node.js, Express, TypeScript, SQLite/JSON DB)
│   ├── data/                   # Persistent local storage (financial_data.json)
│   ├── src/
│   │   ├── db/database.ts      # Persistent database layer with consent handling
│   │   ├── routes/             # REST endpoints (consent, transactions, analytics, ai)
│   │   ├── services/           # Financial rule engine & AI Copilot service
│   │   └── index.ts            # Express server entry point
│   └── .env
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher; tested on Node v26)
- **npm** (v9 or higher)

### Installation
Both server and client dependencies are pre-installed in this repository. If needed, you can reinstall:
```bash
# In the server directory:
cd server
npm install

# In the client directory:
cd ../client
npm install
```

### Running the Application

You can start the backend and frontend in separate terminals:

#### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

#### Terminal 2: Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

*(On mobile phones connected to the same Wi-Fi, run `npm run dev -- --host` in client and visit your computer's local IP address).*

---

## ⚙️ Configuration (Optional Gemini API Key)

FinPulse is **100% functional out of the box** with its built-in rule engine. To enable dynamic generative Gemini AI responses:
1. Open `server/.env`.
2. Add your Gemini API key:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Restart the server.

---

## 🔒 Data Privacy & Compliance Note
FinPulse was engineered adhering to core principles of **GDPR**, **CCPA**, and **DPDP (Digital Personal Data Protection)**:
1. **Consent Gating**: Data is never analyzed without explicit affirmative opt-in.
2. **Right to Access & Portability**: 1-click JSON export.
3. **Right to be Forgotten**: Instant permanent purge of personal financial records.
