# AEGIS: Agent Identity Drift Detection & Multi-Agent Governance

AEGIS is an enterprise runtime security guard that intercepts, evaluates, and neutralizes agent identity drift and indirect prompt injections before tool execution.

---

## 1. Architecture & Tech Stack

```
Agent Action Intent (Tool + Args + CoT Reasoning)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Tier 1: Vector Screener   Tier 2: Groq LLM Judge
 (SentenceTransformers     (gpt-oss-120b with Adrian
  Macro/Micro Baselines)    MAD Taxonomy M0-M4)
        └─────────┬─────────┘
                  ▼
        Drift Engine / Runtime Gate
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
Autonomous     HITL Modal   Alert Only
(Auto-Block)   (Wait / UI)  (Telemetry)
```

* **Backend (`backend/`):** Python 3.11, FastAPI, WebSockets (`/ws`), Pydantic v2.
  * `backend/guard/vector_screener.py`: Dual-tier embeddings (macro contract + per-tool micro baselines).
  * `backend/guard/llm_judge.py`: Groq LLM Judge (`openai/gpt-oss-120b`) with deterministic fallback mapping to the Adrian MAD taxonomy.
  * `backend/guard/drift_engine.py`: Runtime gate enforcement (`AUTONOMOUS`, `HITL`, `ALERT_ONLY`).
  * `backend/guard/scenario_generator.py`: Dynamic 5-scenario red-team test suite synthesizer.
  * `backend/models/framework_adapter.py`: Zero-shot normalization of CrewAI, AutoGen, LangChain, and AEGIS agent configs.
* **Frontend (`frontend/`):** React 18, Vite, Vanilla CSS + VoltSense enterprise green/dark theme, Lucide React icons.

---

## 2. Development & Test Commands

* **Backend Dev Server:**
  ```powershell
  python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
  ```
* **Frontend Dev Server:**
  ```powershell
  cd frontend ; npm run dev -- --host 127.0.0.1 --port 5173
  ```
* **Frontend Production Build:**
  ```powershell
  cd frontend ; npm run build
  ```
* **Batch Verification Script:**
  Validate all sample agents across CrewAI, AutoGen, LangChain, and AEGIS Native:
  ```powershell
  python -c "from backend.models.framework_adapter import parse_agent_config; print('OK')"
  ```

---

## 3. Core Invariants & Agent Guidelines

1. **Git Policy:** **NEVER** run `git push` without the user's explicit, unambiguous instruction in the current turn.
2. **Autonomous Gate Invariant:** In `AUTONOMOUS` mode, never quarantine or block an action that invokes a declared authorized tool with `Risk < 50` and `MAD M0`. Quarantine is strictly reserved for confirmed policy violations (`Risk >= 60` or non-M0 violations with `Risk >= 50`).
3. **Multi-Framework Ingestion:** Any agent JSON or YAML placed in `sample/` or uploaded by a user must parse cleanly into an `AgentRoleSpec` without requiring prior AEGIS-specific formatting.
4. **Reference Directories:**
   * Keep `.env` and sensitive tokens out of version control (tracked via `.env.example`).

---

## 4. Key Documentation Pointers

* [`README.md`](README.md): Hackathon project overview, architecture diagram, and live demo steps.
* [`sample/README.md`](sample/README.md): Specification and guide for supported agent framework schemas.
* [`docs/custom_agent_upload_plan.md`](docs/custom_agent_upload_plan.md): Architectural spec for agent upload & automated red-team evaluation.
