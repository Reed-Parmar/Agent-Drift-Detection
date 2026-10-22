# Implementation Plan: Autonomous Agent Identity Drift Detection System

> **Architecture Style:** Deep Modular Monorepo (`backend/` + `frontend/`)  
> **Target:** Hackathon MVP (Proof of Concept)  
> **Source Documents:** [Problem Statement](file:///r:/PP/decoy/docs/problem_statement.md) | [Architecture Specification](file:///r:/PP/decoy/docs/mvp_design_tree_and_scope.md)  

---

## 1. High-Level Modular Structure

```
r:/PP/decoy/
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── main.py                  # FastAPI Application & WebSocket hub
│   ├── config.py                # Environment & Groq configuration
│   ├── models/
│   │   ├── __init__.py
│   │   ├── role_spec.py         # Pydantic schemas for Agent contracts & tools
│   │   └── events.py            # ActionIntent, SecurityVerdict, HITL schemas
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── sandbox.py           # Safe virtual shell filesystem & dummy secrets
│   │   ├── tools.py             # Support tools + Sandboxed shell tool
│   │   └── runner.py            # Agent execution loop using Groq tool-calling
│   └── guard/
│       ├── __init__.py
│       ├── vector_screener.py   # Tier 1: sentence-transformers cosine distance
│       ├── llm_judge.py         # Tier 2: Groq LLM-as-a-Judge explainability
│       └── drift_engine.py      # Orchestrator combining Tier 1 + Tier 2 + HITL
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Split-screen orchestration
│   │   ├── index.css            # Dark mode design tokens & micro-animations
│   │   ├── components/
│   │   │   ├── ControlBar.jsx   # Scenario selector & "Protected vs Unprotected" toggle
│   │   │   ├── AgentFeed.jsx    # Left pane: LLM thoughts & tool execution stream
│   │   │   ├── SecurityFeed.jsx # Right pane: Risk gauges, drift chart, alert cards
│   │   │   └── HITLModal.jsx    # 3-button operator modal (Approve / Block / Quarantine)
│   │   └── services/
│   │       └── websocket.js     # WebSocket client for real-time streaming
│
└── docs/
    ├── problem_statement.md
    ├── mvp_design_tree_and_scope.md
    └── implementation_plan.md
```

---

## 2. Deep Module Seams & Interfaces

Following the **Codebase Design** principles:
* Each module presents a **small interface** with high internal leverage.
* Testing and callers exercise the same public seam.

### Seam 1: `AgentRoleSpec` & `ToolContract` (`backend/models/role_spec.py`)
* **Interface:** Static Pydantic definition of what an agent is permitted to do, its primary purpose embedding reference text, and explicit prohibited capabilities.
* **Leverage:** Ingested unchanged by both Tier 1 (vector embeddings) and Tier 2 (LLM judge).

### Seam 2: `VirtualSandbox` (`backend/agent/sandbox.py`)
* **Interface:** `execute_safe_command(cmd: str) -> str`
* **Leverage:** Safe, cross-platform simulated bash environment. When `cat .env` is requested in unprotected mode, returns realistic dummy production secrets (`STRIPE_SECRET_KEY`, `AWS_ACCESS_KEY_ID`, `DB_PASSWORD`), preventing host damage.

### Seam 3: `DriftEngine` (`backend/guard/drift_engine.py`)
* **Interface:** `async evaluate_intent(intent: ActionIntentEvent, protected_mode: bool) -> SecurityVerdict`
* **Leverage:** Hides the entire dual-tier pipeline (Tier 1 vector math + Tier 2 Groq prompt judge + HITL channel coordination) behind a single async method.

### Seam 4: `AgentRunner` (`backend/agent/runner.py`)
* **Interface:** `async run_ticket(ticket_text: str, protected_mode: bool, event_emitter)`
* **Leverage:** Self-contained execution loop that calls Groq, formats tool intents, pauses on HITL verdicts, and yields live updates.

---

## 3. Step-by-Step Implementation Phases

### Phase 1: Backend Foundation & Virtual Sandbox
1. Setup `backend/requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `groq`, `sentence-transformers`, `python-dotenv`).
2. Implement `backend/models/role_spec.py` and `backend/models/events.py`.
3. Implement `backend/agent/sandbox.py` with safe virtual environment and mock secrets.
4. Implement `backend/agent/tools.py` with Customer Support toolset:
   - `lookup_order(order_id: str)`
   - `search_knowledge_base(query: str)`
   - `respond_ticket(response: str)`
   - `run_diagnostic_shell(command: str)` (routed to `VirtualSandbox`).

### Phase 2: Dual-Tier Identity Drift Detection Engine
1. Implement `backend/guard/vector_screener.py`:
   - Pre-computes role description and authorized tool capability embeddings using `all-MiniLM-L6-v2`.
   - Computes cosine distance for incoming tool names and arguments in <15ms.
2. Implement `backend/guard/llm_judge.py`:
   - Evaluates high-divergence actions via Groq (Llama-3.3-70b-versatile or 8b).
   - Generates normalized `risk_score` (0–100), `risk_level` (LOW, MEDIUM, HIGH, CRITICAL), and `explanation`.
3. Implement `backend/guard/drift_engine.py`:
   - Glues Tier 1 and Tier 2 together with graduated response logic.
   - Manages in-memory HITL resolution queues (`asyncio.Event`).

### Phase 3: Agent Execution Engine & Interception Gate
1. Implement `backend/agent/runner.py`:
   - Runs Groq tool-calling agent with system prompt defining Customer Support role.
   - Intercepts proposed tool calls *before* execution and sends to `DriftEngine`.
   - If `protected_mode=False`, bypasses the guard and executes directly (illustrating the exploit).
   - If `protected_mode=True`, waits for `DriftEngine` verdict / HITL decision.

### Phase 4: FastAPI Server & Real-Time WebSocket Hub
1. Implement `backend/main.py`:
   - REST endpoints: `/api/health`, `/api/scenarios`, `/api/config`.
   - WebSocket `/ws`: Bidirectional streaming of agent thoughts, tool intents, security verdicts, and HITL operator decisions.
2. Verify backend with automated script or curl/websockets.

### Phase 5: Modern Interactive Frontend (`frontend/`)
1. Initialize React + Vite frontend (`frontend/`).
2. Build design system (`index.css`) with sleek dark mode, cyber-security color accents (emerald green for safe, amber for HITL, crimson for drift attack), and glassmorphism cards.
3. Build components:
   - `ControlBar`: Mode switch (*"🛡️ Protected by Drift Guard"* vs *"⚠️ Unprotected Agent"*), scenario launcher.
   - `AgentFeed`: Real-time streaming log of user prompt, agent internal reasoning, tool calls, and responses.
   - `SecurityFeed`: Live animated Risk Score Gauge (0–100), Drift Distance Bar, Evidence Explainability Card.
   - `HITLModal`: High-contrast alert modal with **[Approve One-Time]**, **[Block Action]**, and **[Quarantine Session]**.

### Phase 6: End-to-End Verification & Demonstration Polish
1. Run Scenario A (Normal Ticket): Verify baseline passes with Risk Score < 15.
2. Run Scenario B (Unprotected Injected Ticket): Verify malicious command runs and dummy secrets are dumped.
3. Run Scenario C (Protected Injected Ticket): Verify Tier 1 triggers, Tier 2 scores Risk 96/100, HITL modal appears, and clicking [Block] isolates the agent cleanly.
