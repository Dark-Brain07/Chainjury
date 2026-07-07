# ChainJury — GenLayer Points Portal Submissions

---

## 📌 Projects & Milestones (20-4000 pts)

### Submission 1: ChainJury — Full DApp

**Title:** ChainJury: Decentralized AI-Powered Dispute Resolution & Escrow Platform

**Description:**
ChainJury is a trustless AI arbitration platform for digital commerce built on GenLayer. It replaces centralized dispute resolution (PayPal, Fiverr, Amazon) with on-chain AI consensus. The platform features 3 intelligent contracts: a Core Registry with wallet-tied reputation scores, an AI Dispute Engine that evaluates evidence across 5 criteria using `gl.eq_principle.prompt_comparative()` and verifies web sources via `gl.nondet.web.get()`, and an Escrow Vault with milestone-based payments that automatically execute based on AI verdicts. The contract IS the judge — not a settlement layer.

**What makes it unique:**
- First AI arbitration + escrow system on GenLayer
- 3-contract architecture (Core, Dispute Engine, Escrow Vault)
- 5-criteria AI scoring system (Evidence Strength, Source Credibility, Claim Consistency, Documentation Quality, Fairness Assessment)
- Web evidence verification via `gl.nondet.web.get()`
- AI-powered delivery verification for escrow milestones
- Persistent on-chain reputation with trust scores
- Automatic escrow resolution based on AI verdict (release/refund/split)

- **App Link:** https://chainjury.vercel.app
- **GitHub Repo:** https://github.com/Dark-Brain07/Chainjury

---

## 📌 Tools & Infrastructure (50-2500 pts)

### Submission 2: ChainJuryCore — Registry & Reputation Contract

**Title:** ChainJuryCore: On-Chain Identity Registry & Trust Scoring System

**Description:**
Central registry for the ChainJury platform managing wallet-tied user profiles, global case indexing via TreeMap, and dynamic trust scores that update based on dispute outcomes. Winners gain +10 trust, losers lose -15. Serves as the source of truth for identity and case tracking across the multi-contract architecture.

- **Contract Address:** `0x7FA5Ca03De15fC89673eD11d7b8cb1e22D560698`
- **Explorer Link:** [View on GenLayer Studio](https://explorer-studio.genlayer.com/address/0x7FA5Ca03De15fC89673eD11d7b8cb1e22D560698)
- **Source Code:** https://github.com/Dark-Brain07/Chainjury/blob/main/contracts/chain_jury_core.py

---

### Submission 3: DisputeEngine — AI-Powered Dispute Resolution

**Title:** DisputeEngine: AI Consensus Arbitration with Web Evidence Verification

**Description:**
The heart of ChainJury. This intelligent contract accepts evidence from both plaintiff and defendant, fetches and verifies web sources using `gl.nondet.web.get()`, then evaluates disputes across 5 AI criteria using `gl.eq_principle.prompt_comparative()`. Renders binding verdicts (PLAINTIFF_WINS, DEFENDANT_WINS, DRAW) with per-party scores (0-100) and detailed AI reasoning. Multiple GenLayer validators independently assess the same evidence and must reach consensus — like a real jury.

- **Contract Address:** `0x81e48d4547745C5650E559C4421229B73181574B`
- **Explorer Link:** [View on GenLayer Studio](https://explorer-studio.genlayer.com/address/0x81e48d4547745C5650E559C4421229B73181574B)
- **Source Code:** https://github.com/Dark-Brain07/Chainjury/blob/main/contracts/dispute_engine.py

---

### Submission 4: EscrowVault — Trustless Escrow with AI Delivery Verification

**Title:** EscrowVault: Milestone-Based Escrow with AI-Powered Delivery Verification

**Description:**
Trustless escrow management contract with milestone-based payment tracking. Features fund locking during disputes, automatic release/refund based on AI verdict (PLAINTIFF_WINS → refund, DEFENDANT_WINS → release, DRAW → split), and AI-powered delivery verification that fetches deliverable URLs via `gl.nondet.web.get()` and checks against requirements using `gl.eq_principle.prompt_comparative()`. Works hand-in-hand with the DisputeEngine for automated financial resolution.

- **Contract Address:** `0xe9fdA513bbB28efbe1b6670684090aEA0718e9Df`
- **Explorer Link:** [View on GenLayer Studio](https://explorer-studio.genlayer.com/address/0xe9fdA513bbB28efbe1b6670684090aEA0718e9Df)
- **Source Code:** https://github.com/Dark-Brain07/Chainjury/blob/main/contracts/escrow_vault.py

---

## 📌 GenLayer Features Used Across All Contracts

| Feature | Contract | Usage |
|---------|----------|-------|
| `gl.eq_principle.strict_eq()` | DisputeEngine, EscrowVault | Deterministic web evidence fetching |
| `gl.eq_principle.prompt_comparative()` | DisputeEngine, EscrowVault | AI consensus for verdicts & delivery verification |
| `gl.nondet.web.get()` | DisputeEngine, EscrowVault | Fetching evidence URLs and deliverable content |
| `gl.nondet.exec_prompt()` | DisputeEngine, EscrowVault | AI evaluation prompts |
| `TreeMap[str, str]` | All 3 contracts | On-chain storage for profiles, cases, disputes, escrows |
| `u256` | All 3 contracts | Counter and score tracking |
| `gl.message.sender_account` | ChainJuryCore | Wallet-tied identity |
