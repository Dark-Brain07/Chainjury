# ⚖️ ChainJury — Decentralized AI Dispute Resolution & Escrow Platform

**ChainJury** is a trustless, AI-powered dispute resolution platform for digital commerce built on **GenLayer**. When buyers and sellers disagree on a transaction, they submit evidence to an on-chain AI jury that evaluates, cross-references web sources, and renders binding verdicts — all without intermediaries.

> **No middlemen. No bias. Just on-chain justice.**

🔗 **Live App:** [chainjury.vercel.app](https://chainjury.vercel.app)  
🔗 **Core Contract:** [View on Explorer](https://explorer-studio.genlayer.com/address/0x7FA5Ca03De15fC89673eD11d7b8cb1e22D560698)  
🔗 **Dispute Engine:** [View on Explorer](https://explorer-studio.genlayer.com/address/0x81e48d4547745C5650E559C4421229B73181574B)  
🔗 **Escrow Vault:** [View on Explorer](https://explorer-studio.genlayer.com/address/0xe9fdA513bbB28efbe1b6670684090aEA0718e9Df)

---

## 🎯 Problem

Digital commerce disputes are broken:
- Centralized platforms (PayPal, Amazon) act as judge, jury, and executioner
- Freelance disputes on Fiverr/Upwork favor the platform, not fairness
- Cross-border transactions have zero recourse
- Traditional arbitration is slow, expensive, and inaccessible

## 💡 Solution

ChainJury replaces centralized arbitration with **AI-powered, consensus-backed dispute resolution**:
- **The contract IS the judge** — not a settlement layer, but the actual arbitration engine
- **AI consensus evaluates evidence** — multiple GenLayer validators independently assess the case
- **Web source verification** — evidence URLs are fetched and cross-referenced on-chain
- **Trustless escrow** — funds are locked, released, or refunded based on the AI verdict
- **Reputation tracking** — persistent on-chain trust scores for all participants

---

## 🏗️ Architecture — 3 Intelligent Contracts

### 1. `chain_jury_core.py` — Core Registry & Reputation
- Wallet-tied user profiles with trust scores
- Global case registry and indexing via `TreeMap`
- Reputation updates based on dispute outcomes (winners gain, losers lose trust)
- Platform-wide statistics and leaderboard

### 2. `dispute_engine.py` — AI Dispute Resolution Engine ⭐
The heart of ChainJury. This contract:
- Accepts evidence from both plaintiff and defendant
- **Fetches and verifies web evidence** using `gl.nondet.web.get()`
- **Evaluates disputes across 5 AI criteria** using `gl.eq_principle.prompt_comparative()`
  1. Evidence Strength (0-20 pts)
  2. Source Credibility (0-20 pts)
  3. Claim Consistency (0-20 pts)
  4. Documentation Quality (0-20 pts)
  5. Fairness Assessment (0-20 pts)
- Renders binding verdicts: `PLAINTIFF_WINS`, `DEFENDANT_WINS`, or `DRAW`
- Returns detailed reasoning and per-party scores

### 3. `escrow_vault.py` — Trustless Escrow Management
- Milestone-based escrow creation between buyers and sellers
- Fund locking during active disputes
- Automatic release/refund based on AI verdict
- **AI-powered delivery verification** — fetches deliverable URLs and checks against requirements using `gl.eq_principle.prompt_comparative()`
- Escrow statistics tracking

---

## 🔄 How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Plaintiff   │────▶│  Chain Jury Core  │────▶│ Dispute Engine│
│ Files Case   │     │  (Registry +      │     │ (AI Evaluation│
└─────────────┘     │   Reputation)     │     │  + Web Verify)│
                    └──────────────────┘     └───────┬───────┘
┌─────────────┐                                       │
│  Defendant   │──────── Submit Defense ──────────────▶│
│ Responds     │                                       │
└─────────────┘                                       ▼
                                              ┌───────────────┐
                                              │  AI Consensus  │
                                              │  (5 Criteria)  │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ Escrow Vault   │
                                              │ (Auto Release/ │
                                              │  Refund)       │
                                              └───────────────┘
```

1. **Plaintiff files dispute** → Case registered in Core, evidence submitted to Dispute Engine
2. **Defendant submits defense** → Counter-evidence recorded on-chain
3. **AI Resolution triggered** → GenLayer validators independently evaluate all evidence
4. **Verdict rendered** → Scores, reasoning, and binding decision stored on-chain
5. **Escrow executes** → Funds automatically released or refunded based on verdict

---

## 🚀 GenLayer Features Used

| Feature | Usage |
|---------|-------|
| `gl.eq_principle.strict_eq()` | Deterministic web evidence fetching |
| `gl.eq_principle.prompt_comparative()` | AI consensus for dispute verdicts & delivery verification |
| `gl.nondet.web.get()` | Fetching evidence URLs and deliverable content |
| `gl.nondet.exec_prompt()` | AI evaluation of evidence across 5 criteria |
| `TreeMap[str, str]` | On-chain storage for profiles, cases, disputes, escrows |
| `u256` | Counter and score tracking |
| `gl.message.sender_account` | Wallet-tied identity |

---

## 🖥️ Frontend

Premium dark-mode glassmorphism UI built with React 19 + Vite:

- **Dashboard** — Live platform statistics with animated stat cards
- **File Dispute** — Multi-field case filing with progress tracking
- **Browse Cases** — Case lookup, defense submission, and AI resolution trigger
- **Escrow Vault** — Create escrows, lookup milestones, AI delivery verification
- **Wallet Integration** — MetaMask/Rabby connection with account management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Intelligent Contracts | Python (GenLayer GenVM SDK) |
| Frontend | React 19 + Vite 8 |
| Styling | Vanilla CSS (Glassmorphism + Dark Mode) |
| Blockchain SDK | genlayer-js + viem |
| Icons | lucide-react |
| Fonts | Inter + JetBrains Mono |
| Deployment | Vercel |
| Network | GenLayer Studionet |

---

## 📦 Project Structure

```
chainjury/
├── contracts/
│   ├── chain_jury_core.py      # Registry & Reputation
│   ├── dispute_engine.py       # AI Dispute Resolution
│   └── escrow_vault.py         # Escrow Management
├── src/
│   ├── App.jsx                 # Main app with routing
│   ├── index.css               # Design system
│   ├── main.jsx                # React entry
│   ├── components/
│   │   ├── Dashboard.jsx       # Stats & how-it-works
│   │   ├── FileCase.jsx        # Dispute filing form
│   │   ├── CaseBrowser.jsx     # Case lookup & resolution
│   │   └── EscrowPanel.jsx     # Escrow management
│   └── utils/
│       └── genlayer.js         # GenLayer SDK wrapper
├── index.html
├── package.json
└── vite.config.js
```

---

## 🏃 Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/chainjury.git
cd chainjury
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 📜 Deployed Contracts (Studionet)

| Contract | Address |
|----------|---------|
| ChainJuryCore | `0x7FA5Ca03De15fC89673eD11d7b8cb1e22D560698` |
| DisputeEngine | `0x81e48d4547745C5650E559C4421229B73181574B` |
| EscrowVault | `0xe9fdA513bbB28efbe1b6670684090aEA0718e9Df` |

---

## 🏆 What Makes ChainJury Different

- **Contract-driven arbitration** — The contract IS the judge, not just a record-keeper
- **Multi-criteria AI scoring** — 5-dimensional evaluation, not just yes/no
- **Web evidence verification** — On-chain fetching and analysis of evidence URLs
- **Integrated escrow** — Dispute verdicts automatically execute financial outcomes
- **Reputation system** — Persistent trust scores incentivize honest behavior
- **3-contract architecture** — Separation of concerns: identity, resolution, finance

---

## 📄 License

MIT

---

Built with ❤️ on [GenLayer](https://genlayer.com) — AI-Native Blockchain for Intelligent Contracts
