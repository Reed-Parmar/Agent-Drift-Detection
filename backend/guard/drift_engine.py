"""
Drift Engine Orchestrator:
Coordinates Tier 1 Vector Screener, Tier 2 LLM-as-a-Judge, and Live HITL Operator Resolutions.
"""
from typing import Dict, Any, Optional
import asyncio
from ..models.role_spec import AgentRoleSpec, get_default_customer_support_role, get_multiagent_registry
from ..models.events import SecurityVerdict, HITLResponse, MitigationAction, RiskLevel
from .vector_screener import VectorScreener
from .llm_judge import LLMJudge

class DriftEngine:
    def __init__(self, role_spec: Optional[AgentRoleSpec] = None):
        self.role_spec = role_spec or get_default_customer_support_role()
        self.registry = get_multiagent_registry()
        self.vector_screener = VectorScreener(self.role_spec)
        self.llm_judge = LLMJudge(self.role_spec)
        # Pending HITL decisions: verdict_id -> asyncio.Future[HITLResponse]
        self._pending_hitl: Dict[str, asyncio.Future] = {}

    async def evaluate_intent(
        self,
        step_id: int,
        tool_name: str,
        tool_args: Dict[str, Any],
        context_prompt: str,
        reasoning: str = "",
        is_protected_mode: bool = True,
        agent_id: str = "customer_support_tier1",
        delegated_from: Optional[str] = None,
        guard_mode: Optional[str] = None
    ) -> SecurityVerdict:
        """
        Evaluates an Action-Intent event through the dual-tier pipeline with multi-agent provenance.
        Supports 3 operational modes:
        - AUTONOMOUS: In-flight auto-remediation (blocks malicious action without operator delay)
        - HITL: Pauses execution and registers human-in-the-loop operator review
        - ALERT_ONLY: Unprotected mode (logs telemetry warning but executes payload)
        """
        # Tier 1: Fast Vector Cosine Distance
        distance, flagged = self.vector_screener.evaluate_intent(tool_name, tool_args, reasoning)

        # Tier 2: LLM-as-a-Judge
        verdict = await self.llm_judge.evaluate_action(
            step_id=step_id,
            tool_name=tool_name,
            tool_args=tool_args,
            context_prompt=context_prompt,
            reasoning=reasoning,
            tier1_distance=distance,
            tier1_flagged=flagged
        )

        verdict.agent_id = agent_id
        verdict.delegated_from = delegated_from

        # Normalize mode
        mode = guard_mode or ("HITL" if is_protected_mode else "ALERT_ONLY")

        if mode == "ALERT_ONLY":
            verdict.requires_human_approval = False
            verdict.mitigation_action = MitigationAction.ALLOW
            if verdict.risk_score >= 70:
                verdict.explanation = f"[ALERT ONLY MODE]: Drift anomaly detected ({verdict.risk_score}/100, MAD {verdict.mad_code}). Tool invocation permitted because in-flight gate is bypassed."
        elif mode == "AUTONOMOUS":
            # True policy violation: risk >= 60, or non-M0 MAD code, or confirmed high-drift tool
            is_violation = (verdict.risk_score >= 60) or (verdict.mad_code not in ["M0", ""]) or (verdict.tier1_flagged and verdict.risk_score >= 50)
            if is_violation:
                verdict.requires_human_approval = False
                verdict.mitigation_action = MitigationAction.BLOCK
                verdict.explanation = (
                    f"⚡ [AUTONOMOUS REMEDIATION]: Drift policy violation detected (MAD {verdict.mad_code}, Risk {verdict.risk_score}/100). "
                    f"Action automatically neutralized and quarantined by autonomous policy gate without operator latency."
                )
            else:
                verdict.requires_human_approval = False
                verdict.mitigation_action = MitigationAction.ALLOW
        else: # HITL
            is_violation = (verdict.risk_score >= 60) or (verdict.mad_code not in ["M0", ""]) or (verdict.tier1_flagged and verdict.risk_score >= 50)
            verdict.requires_human_approval = is_violation

        return verdict

    def register_hitl_waiter(self, verdict_id: str) -> asyncio.Future:
        """Creates a future to wait for human operator intervention."""
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._pending_hitl[verdict_id] = future
        return future

    def resolve_hitl(self, response: HITLResponse) -> bool:
        """Resolves a pending HITL operator decision from the frontend."""
        if response.verdict_id in self._pending_hitl:
            future = self._pending_hitl.pop(response.verdict_id)
            if not future.done():
                future.set_result(response)
                return True
        return False

# Global drift engine instance
global_drift_engine = DriftEngine()
