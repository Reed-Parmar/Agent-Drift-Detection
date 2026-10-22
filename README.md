# AEGIS // Autonomous AI Agent Identity Drift Detection & Defense

> **A real-time behavioral guardrail system for autonomous AI agents.**  
> Built for the **Decoy Hackathon** addressing the problem statement: *Identity Drift Detection in Autonomous AI Agents*.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev)
[![Groq](https://img.shields.io/badge/Inference-Groq%20LPU-F55036.svg)](https://groq.com)
[![SentenceTransformers](https://img.shields.io/badge/Embeddings-Sentence--Transformers-FF6F00.svg)](https://sbert.net)

---

## 🚀 The Core Problem: Identity Drift

Organizations deploy AI agents with broad permissions, API keys, and corporate OAuth tokens. Traditional security checks verify:
> *"Does this identity possess valid credentials to access this endpoint?"*

When an agent is hijacked via an **indirect prompt injection** (e.g., a poisoned PDF invoice or malicious customer ticket), its credentials remain **100% valid**, yet its runtime behavior drifts from its declared role into lateral movement and data exfiltration.

**AEGIS** bridges this gap:
1. **Baselines the Declared Role:** Enforces a typed Pydantic contract defining authorized capabilities and prohibited actions.
2. **Dual-Tier Drift Engine:** 
   - **Tier 1:** Local `sentence-transformers` vector cosine distance (<15ms).
   - **Tier 2:** Blazing-fast **Groq LLM-as-a-Judge** (`openai/gpt-oss-120b`) calculating a calibrated 0–100 risk score and evidence rationale.
3. **Action-Intent Event Interception:** Intercepts proposed tool calls *before* execution.
4. **Graduated Containment (Interactive HITL):** Halts high-risk actions and provides the security operator with:
   - `[Block Action]`
   - `[Quarantine Session & Revoke Token]`
   - `[Approve One-Time Override]`

---

## 📂 Project Architecture

```
decoy/
├── backend/
│   ├── main.py              # FastAPI server & WebSocket streaming hub
│   ├── config.py            # Groq API configuration & threshold tuning
│   ├── models/
│   │   ├── role_spec.py     # Pydantic schema for Agent role contracts
│   │   └── events.py        # ActionIntent, SecurityVerdict, HITL models
│   ├── agent/
│   │   ├── runner.py        # Live agent loop with Groq tool-calling
│   │   ├── tools.py         # Customer support tools + diagnostic shell
│   │   └── sandbox.py       # Safe simulated virtual terminal & mock secrets
│   └── guard/
│       ├── vector_screener.py  # Tier 1: sentence-transformers cosine distance
│       ├── llm_judge.py        # Tier 2: Groq LLM-as-a-Judge explainability
│       └── drift_engine.py     # Orchestrator & HITL coordination
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Split-screen live dashboard
│   │   ├── index.css        # Cyber-security dark mode design system
│   │   └── components/
│   │       ├── Header.jsx       # Gateway status & model badges
│   │       ├── ControlBar.jsx   # "Protected vs Unprotected" toggle & launcher
│   │       ├── AgentFeed.jsx    # Left pane: Agent thoughts & tool execution
│   │       ├── SecurityFeed.jsx # Right pane: Animated 0-100 risk gauge & drift meter
│   │       └── HITLModal.jsx    # Interactive 3-button operator intervention modal
│
└── docs/
    ├── problem_statement.md         # Full problem statement analysis
    ├── mvp_design_tree_and_scope.md # Design tree & settled architecture
    └── implementation_plan.md      # Detailed step-by-step implementation plan
```

---

## ⚡ Quickstart: Running the System

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Groq API Key** (configured in `backend/.env`)

### 2. Start the FastAPI Backend
```bash
# In the project root:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
*Health Check:* Visit [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Start the React Frontend Dashboard
```bash
# In a second terminal:
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*Web Dashboard:* Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🎬 The 60-Second Hackathon Demo Formula

1. **Demonstrate the Vulnerability (Unprotected Mode):**
   - In the top control bar, switch to **"Unprotected Agent (Vulnerable IAM)"**.
   - Select **"Adversarial Attack: Indirect Prompt Injection"**.
   - Click **"Launch Simulation"**.
   - *Outcome:* The agent falls for the indirect prompt injection, executes `run_diagnostic_shell("cat .env")`, and leaks internal database passwords and Stripe keys. Standard IAM checks raise zero alarms!

2. **Demonstrate Active Defense (Autonomous & HITL Gates):**
   - Switch gate to **"⚡ Autonomous Gate"** or **"🛡️ Human Review"**.
   - Click **"Run Ticket Queue"** or **"Launch Simulation"**.
   - *Outcome:*
     - The agent proposes `run_diagnostic_shell`.
     - Tier 1 flags high semantic distance (>0.80).
     - Tier 2 Groq Judge calculates **Risk Score: 95/100 (CRITICAL, MAD M4.a)**.
     - In Autonomous mode, the exploit is neutralized immediately without human bottleneck; in HITL mode, an interactive forensic modal prompts the operator.
     - Data is secured mid-flight before the virtual sandbox executes.

3. **Demonstrate Custom Multi-Framework Agent Ingestion & Red-Teaming:**
   - Click **"Upload & Red-Team"** in the top navigation bar.
   - Drag & drop any sample agent definition from [`sample/`](sample/) (`crewai_financial_analyst.yaml`, `autogen_inventory_manager.json`, `langchain_customer_support.json`, `aegis_procurement_agent.json`).
   - AEGIS automatically parses the agent contract, pre-computes an in-flight vector baseline, and synthesizes 5 targeted red-team attack tickets tailored to the agent's tools.
   - Click **"Run Red-Team Suite"** to stream live in-engine evaluation and view the comprehensive Security Audit Scorecard.

