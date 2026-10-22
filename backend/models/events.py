from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum
import time

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MitigationAction(str, Enum):
    ALLOW = "ALLOW"
    CHALLENGE_HITL = "CHALLENGE_HITL"
    BLOCK = "BLOCK"
    QUARANTINE = "QUARANTINE"

class PolicyMode(str, Enum):
    ALERT = "ALERT"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    BLOCK = "BLOCK"

# Adrian-aligned MAD (Malicious Activity Detection) Taxonomy Codes
class MADCode(str, Enum):
    M0 = "M0"          # Benign / Within Remit
    M2_A = "M2.a"      # Overreach / Scope Expansion Beyond Remit
    M2_D = "M2.d"      # Following Injected Instructions Over Policy
    M2_F = "M2.f"      # Dispatch Without Constraint Check
    M3_A = "M3.a"      # Safeguard Bypass
    M3_C = "M3.c"      # Data Exfiltration Intent
    M3_D = "M3.d"      # Privilege Escalation
    M3_F = "M3.f"      # Active Exploitation / Injection Compliance
    M4_A = "M4.a"      # Serious Privacy Breach / Credential Theft
    M4_D = "M4.d"      # Destructive Action

class ActionIntentEvent(BaseModel):
    session_id: str
    step_id: int
    agent_id: str = "customer_support_tier1"
    delegated_from: Optional[str] = None
    chain_depth: int = 1
    tool_name: str
    tool_arguments: Dict[str, Any]
    reasoning_trace: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class SecurityVerdict(BaseModel):
    verdict_id: str
    step_id: int
    agent_id: str = "customer_support_tier1"
    delegated_from: Optional[str] = None
    tool_name: str
    risk_score: int  # 0 to 100
    risk_level: RiskLevel
    mad_code: str = "M0"
    mad_description: str = "Benign: Within Remit"
    tier1_cosine_distance: float
    tier1_flagged: bool
    explanation: str
    mitigation_action: MitigationAction
    requires_human_approval: bool
    reasoning_trace: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class HITLResponse(BaseModel):
    verdict_id: str
    decision: str  # "APPROVE", "BLOCK", "QUARANTINE"
    operator_comment: Optional[str] = "Operator decision via Dashboard"
    timestamp: float = Field(default_factory=time.time)

class AgentExecutionStep(BaseModel):
    step_id: int
    phase: str  # "THINKING", "INTENT_PROPOSED", "EVALUATING_DRIFT", "HITL_PENDING", "TOOL_EXECUTED", "COMPLETED", "BLOCKED"
    agent_id: str = "customer_support_tier1"
    agent_name: str = "Customer Support Agent"
    delegated_from: Optional[str] = None
    agent_thought: Optional[str] = None
    tool_name: Optional[str] = None
    tool_arguments: Optional[Dict[str, Any]] = None
    tool_result: Optional[str] = None
    verdict: Optional[SecurityVerdict] = None
    final_response: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)
