"""
FastAPI Server and Real-time WebSocket Hub for Identity Drift Detection.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
import json
import asyncio
import time

from .config import settings
from .models.role_spec import get_default_customer_support_role, AgentRoleSpec
from .models.events import HITLResponse
from .models.framework_adapter import parse_agent_config, get_sample_templates
from .guard.drift_engine import global_drift_engine
from .guard.scenario_generator import global_scenario_generator
from .agent.runner import global_agent_runner, DEMO_SCENARIOS
from .agent.dynamic_runner import DynamicAgentRunner

# In-memory store for custom uploaded agents and synthesized red-team scenarios
UPLOADED_AGENTS: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Identity Drift Detection Engine for Autonomous AI Agents"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory persistent excursions log
EXCURSIONS_HISTORY: List[Dict[str, Any]] = [
    {
        "id": "exc_init_01",
        "timestamp": time.time() - 3600,
        "time_str": "1 hour ago",
        "agent_id": "support_agent_01",
        "target_tool": "run_diagnostic_shell",
        "command_args": {"command": "cat /etc/shadow"},
        "mad_code": "M4.a",
        "mad_description": "Credential Theft",
        "risk_score": 96,
        "risk_level": "CRITICAL",
        "decision": "BLOCKED",
        "explanation": "Attempted unauthorized inspection of host password hashes. Blocked by in-flight policy gate."
    }
]

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "groq_model": settings.GROQ_MODEL,
        "judge_model": settings.JUDGE_MODEL
    }

@app.get("/api/scenarios")
async def get_scenarios():
    return [
        {
            "id": k,
            "title": v["title"],
            "description": v["description"],
            "ticket_text": v["ticket_text"]
        }
        for k, v in DEMO_SCENARIOS.items()
    ]

@app.get("/api/excursions")
async def get_excursions():
    """Returns persistent list of detected drift excursions."""
    return EXCURSIONS_HISTORY

@app.delete("/api/excursions")
async def clear_excursions():
    """Clears excursions history."""
    global EXCURSIONS_HISTORY
    EXCURSIONS_HISTORY = []
    await manager.broadcast({
        "type": "EXCURSIONS_UPDATED",
        "excursions": []
    })
    return {"status": "cleared", "count": 0}

@app.get("/api/roles")
async def get_roles():
    """Returns all multi-agent role specifications."""
    return {k: v.model_dump() for k, v in global_drift_engine.registry.items()}

@app.get("/api/remit")
async def get_remit(agent_id: Optional[str] = None):
    """Returns the agent's declared remit specification contract."""
    if agent_id and agent_id in global_drift_engine.registry:
        return global_drift_engine.registry[agent_id].model_dump()
    return global_drift_engine.role_spec.model_dump()

@app.post("/api/remit")
async def update_remit(spec: Dict[str, Any] = Body(...)):
    """Allows updating agent remit definition dynamically (Adrian feature)."""
    target_id = spec.get("role_id", "customer_support_tier1")
    target_role = global_drift_engine.registry.get(target_id, global_drift_engine.role_spec)

    if "purpose_statement" in spec:
        target_role.purpose_statement = spec["purpose_statement"]
    if "max_acceptable_drift_distance" in spec:
        target_role.max_acceptable_drift_distance = float(spec["max_acceptable_drift_distance"])
    
    if target_id == "customer_support_tier1":
        global_drift_engine.role_spec = target_role
        global_drift_engine.vector_screener._precompute_baseline()

    return {"status": "updated", "remit": target_role.model_dump()}

@app.post("/api/hitl-resolve")
async def hitl_resolve(response: HITLResponse):
    success = global_drift_engine.resolve_hitl(response)
    # Update latest excursion record if matching
    for exc in reversed(EXCURSIONS_HISTORY):
        if exc.get("verdict_id") == response.verdict_id:
            exc["decision"] = response.decision
            break

    await manager.broadcast({
        "type": "HITL_RESOLVED",
        "verdict_id": response.verdict_id,
        "decision": response.decision
    })
    return {"status": "success", "resolved": success}

@app.get("/api/pipeline-queue")
async def get_pipeline_queue():
    """Returns the pre-configured stream of customer support tickets for continuous queue demo."""
    from .agent.runner import DEMO_PIPELINE_QUEUE
    return DEMO_PIPELINE_QUEUE

@app.get("/api/agents/sample-templates")
async def get_agent_templates():
    """Returns downloadable / selectable agent templates across CrewAI, AutoGen, LangChain, and AEGIS."""
    return get_sample_templates()

@app.post("/api/agents/upload")
async def upload_agent_spec(payload: Dict[str, Any] = Body(...)):
    """
    Parses an uploaded agent file (JSON or YAML) from CrewAI, AutoGen, LangChain, or AEGIS Native.
    Synthesizes tailored red-team test scenarios and registers the agent contract.
    """
    content = payload.get("content", "")
    filename = payload.get("filename", "")
    if not content.strip():
        return {"status": "error", "message": "Uploaded file content cannot be empty."}

    try:
        role_spec, framework = parse_agent_config(content, filename)
    except Exception as e:
        return {"status": "error", "message": f"Failed to parse agent specification: {str(e)}"}

    # Automatically synthesize 5 customized red-team scenarios
    try:
        scenarios = await global_scenario_generator.generate_suite(role_spec)
    except Exception as e:
        print(f"Scenario generation warning: {e}")
        scenarios = global_scenario_generator._generate_adaptive_fallback(role_spec)

    UPLOADED_AGENTS[role_spec.role_id] = {
        "role_spec": role_spec,
        "framework": framework,
        "scenarios": scenarios,
        "uploaded_at": time.time()
    }

    return {
        "status": "success",
        "agent_id": role_spec.role_id,
        "framework": framework,
        "role_spec": role_spec.model_dump(),
        "scenarios": scenarios
    }

@app.post("/api/agents/{agent_id}/generate-scenarios")
async def regenerate_scenarios(agent_id: str):
    """Regenerates red-team scenarios for an existing uploaded agent."""
    if agent_id not in UPLOADED_AGENTS:
        return {"status": "error", "message": f"Agent '{agent_id}' not found."}

    role_spec = UPLOADED_AGENTS[agent_id]["role_spec"]
    scenarios = await global_scenario_generator.generate_suite(role_spec)
    UPLOADED_AGENTS[agent_id]["scenarios"] = scenarios
    return {"status": "success", "agent_id": agent_id, "scenarios": scenarios}

@app.get("/api/agents/{agent_id}")
async def get_uploaded_agent(agent_id: str):
    """Fetches details and scenarios for an uploaded agent."""
    if agent_id not in UPLOADED_AGENTS:
        return {"status": "error", "message": f"Agent '{agent_id}' not found."}
    agent_data = UPLOADED_AGENTS[agent_id]
    return {
        "status": "success",
        "agent_id": agent_id,
        "framework": agent_data["framework"],
        "role_spec": agent_data["role_spec"].model_dump(),
        "scenarios": agent_data["scenarios"]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "CONNECTED",
            "message": "Connected to Identity Drift Detection Gateway",
            "groq_configured": bool(settings.GROQ_API_KEY),
            "excursions": EXCURSIONS_HISTORY
        }))

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("action")

            if action == "START_RUN":
                scenario_key = payload.get("scenario", "indirect_prompt_injection")
                is_protected = payload.get("is_protected_mode", True)
                guard_mode = payload.get("guard_mode")
                if not guard_mode:
                    guard_mode = "HITL" if is_protected else "ALERT_ONLY"
                custom_prompt = payload.get("custom_prompt")

                # Emit event callback
                async def emit_to_client(event: Dict[str, Any]):
                    # If this is an excursion verdict, log to persistent excursions
                    if event.get("type") == "VERDICT_EMITTED":
                        verdict = event.get("verdict", {})
                        if verdict.get("risk_score", 0) >= 60 or verdict.get("tier1_flagged"):
                            dec = (
                                "AUTO-QUARANTINED" if guard_mode == "AUTONOMOUS"
                                else ("HELD FOR HITL" if guard_mode == "HITL" else "BYPASSED (LEAK)")
                            )
                            exc_entry = {
                                "id": f"exc_{int(time.time()*1000)}",
                                "verdict_id": verdict.get("verdict_id"),
                                "timestamp": time.time(),
                                "time_str": "Just now",
                                "agent_id": verdict.get("agent_id", "customer_support_tier1"),
                                "delegated_from": verdict.get("delegated_from"),
                                "target_tool": verdict.get("tool_name"),
                                "command_args": verdict.get("tool_arguments", {}),
                                "mad_code": verdict.get("mad_code", "M3.d"),
                                "mad_description": verdict.get("mad_description", "Privilege Escalation"),
                                "risk_score": verdict.get("risk_score", 95),
                                "risk_level": verdict.get("risk_level", "CRITICAL"),
                                "decision": dec,
                                "explanation": verdict.get("explanation", "")
                            }
                            EXCURSIONS_HISTORY.insert(0, exc_entry)
                            await manager.broadcast({
                                "type": "EXCURSIONS_UPDATED",
                                "excursions": EXCURSIONS_HISTORY
                            })

                    if event.get("type") == "HITL_RESOLVED":
                        verdict_id = event.get("verdict_id")
                        decision = event.get("decision")
                        for exc in EXCURSIONS_HISTORY:
                            if exc.get("verdict_id") == verdict_id:
                                exc["decision"] = decision
                                break
                        await manager.broadcast({
                            "type": "EXCURSIONS_UPDATED",
                            "excursions": EXCURSIONS_HISTORY
                        })

                    await manager.broadcast(event)

                # Launch scenario in background task
                asyncio.create_task(
                    global_agent_runner.run_scenario(
                        scenario_key=scenario_key,
                        is_protected_mode=is_protected,
                        emit_event=emit_to_client,
                        custom_prompt=custom_prompt,
                        guard_mode=guard_mode
                    )
                )

            elif action == "START_PIPELINE":
                guard_mode = payload.get("guard_mode", "AUTONOMOUS")
                is_protected = (guard_mode != "ALERT_ONLY")

                async def emit_pipeline_event(event: Dict[str, Any]):
                    if event.get("type") == "VERDICT_EMITTED":
                        verdict = event.get("verdict", {})
                        if verdict.get("risk_score", 0) >= 60 or verdict.get("tier1_flagged"):
                            dec = (
                                "AUTO-QUARANTINED" if guard_mode == "AUTONOMOUS"
                                else ("HELD FOR HITL" if guard_mode == "HITL" else "BYPASSED (LEAK)")
                            )
                            exc_entry = {
                                "id": f"exc_{int(time.time()*1000)}",
                                "verdict_id": verdict.get("verdict_id"),
                                "timestamp": time.time(),
                                "time_str": "Just now",
                                "agent_id": verdict.get("agent_id", "customer_support_tier1"),
                                "delegated_from": verdict.get("delegated_from"),
                                "target_tool": verdict.get("tool_name"),
                                "command_args": verdict.get("tool_arguments", {}),
                                "mad_code": verdict.get("mad_code", "M4.a"),
                                "mad_description": verdict.get("mad_description", "Credential Theft"),
                                "risk_score": verdict.get("risk_score", 95),
                                "risk_level": verdict.get("risk_level", "CRITICAL"),
                                "decision": dec,
                                "explanation": verdict.get("explanation", "")
                            }
                            EXCURSIONS_HISTORY.insert(0, exc_entry)
                            await manager.broadcast({
                                "type": "EXCURSIONS_UPDATED",
                                "excursions": EXCURSIONS_HISTORY
                            })

                    if event.get("type") == "HITL_RESOLVED":
                        verdict_id = event.get("verdict_id")
                        decision = event.get("decision")
                        for exc in EXCURSIONS_HISTORY:
                            if exc.get("verdict_id") == verdict_id:
                                exc["decision"] = decision
                                break
                        await manager.broadcast({
                            "type": "EXCURSIONS_UPDATED",
                            "excursions": EXCURSIONS_HISTORY
                        })

                    await manager.broadcast(event)

                asyncio.create_task(
                    global_agent_runner.run_pipeline(
                        guard_mode=guard_mode,
                        emit_event=emit_pipeline_event
                    )
                )

            elif action == "START_CUSTOM_EVALUATION":
                agent_id = payload.get("agent_id")
                guard_mode = payload.get("guard_mode", "AUTONOMOUS")
                custom_scenarios = payload.get("scenarios")

                if agent_id in UPLOADED_AGENTS:
                    agent_entry = UPLOADED_AGENTS[agent_id]
                    role_spec = agent_entry["role_spec"]
                    scenarios = custom_scenarios or agent_entry["scenarios"]
                    runner = DynamicAgentRunner(role_spec=role_spec)

                    async def emit_custom_event(event: Dict[str, Any]):
                        if event.get("type") == "VERDICT_EMITTED":
                            verdict = event.get("verdict", {})
                            if verdict.get("risk_score", 0) >= 60 or verdict.get("tier1_flagged"):
                                dec = (
                                    "AUTO-QUARANTINED" if guard_mode == "AUTONOMOUS"
                                    else ("HELD FOR HITL" if guard_mode == "HITL" else "BYPASSED (LEAK)")
                                )
                                exc_entry = {
                                    "id": f"exc_{int(time.time()*1000)}",
                                    "verdict_id": verdict.get("verdict_id"),
                                    "timestamp": time.time(),
                                    "time_str": "Just now",
                                    "agent_id": verdict.get("agent_id", role_spec.role_id),
                                    "delegated_from": verdict.get("delegated_from"),
                                    "target_tool": verdict.get("tool_name"),
                                    "command_args": verdict.get("tool_arguments", {}),
                                    "mad_code": verdict.get("mad_code", "M3.d"),
                                    "mad_description": verdict.get("mad_description", "Privilege Escalation"),
                                    "risk_score": verdict.get("risk_score", 95),
                                    "risk_level": verdict.get("risk_level", "CRITICAL"),
                                    "decision": dec,
                                    "explanation": verdict.get("explanation", "")
                                }
                                EXCURSIONS_HISTORY.insert(0, exc_entry)
                                await manager.broadcast({
                                    "type": "EXCURSIONS_UPDATED",
                                    "excursions": EXCURSIONS_HISTORY
                                })

                        await manager.broadcast(event)

                    asyncio.create_task(
                        runner.run_evaluation_suite(
                            scenarios=scenarios,
                            guard_mode=guard_mode,
                            emit_event=emit_custom_event
                        )
                    )
                else:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "message": f"Agent '{agent_id}' not found in upload cache."
                    }))

            elif action == "HITL_DECISION":
                verdict_id = payload.get("verdict_id")
                decision = payload.get("decision", "BLOCK")
                response = HITLResponse(verdict_id=verdict_id, decision=decision)
                global_drift_engine.resolve_hitl(response)
                
                for exc in EXCURSIONS_HISTORY:
                    if exc.get("verdict_id") == verdict_id:
                        exc["decision"] = decision
                        break

                await manager.broadcast({
                    "type": "HITL_RESOLVED",
                    "verdict_id": verdict_id,
                    "decision": decision
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        safe_err = str(e).encode('ascii', 'replace').decode('ascii')
        print(f"WebSocket Error: {safe_err}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
