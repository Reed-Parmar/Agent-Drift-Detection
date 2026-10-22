"""
Tier 1: Fast Semantic Vector Screener using Sentence Transformers.
Measures cosine distance between the agent's declared role specification
and the proposed runtime action intent. Executes in <20ms.
"""
from typing import Dict, Any, Tuple
import numpy as np
from ..models.role_spec import AgentRoleSpec
from ..config import settings

class VectorScreener:
    def __init__(self, role_spec: AgentRoleSpec):
        self.role_spec = role_spec
        self.model = None
        self.role_embedding = None
        self._init_model()

    def _init_model(self):
        """Initializes the embedding model and pre-computes role contract baseline."""
        try:
            from sentence_transformers import SentenceTransformer
            # Fast, lightweight 22MB model
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self._precompute_baseline()
        except Exception as e:
            print(f"[VectorScreener] Warning: Could not initialize SentenceTransformer ({e}). Falling back to semantic token metric.")
            self.model = None

    def _precompute_baseline(self):
        """Precomputes vector embeddings for the declared role contract and individual authorized tools."""
        if not self.model:
            return
        
        # 1. Macro role contract baseline
        contract_text = f"Role: {self.role_spec.role_name}. Purpose: {self.role_spec.purpose_statement}."
        self.role_embedding = self.model.encode(contract_text, normalize_embeddings=True)

        # 2. Tool-level micro embeddings for exact capability matching
        self.tool_embeddings: Dict[str, Any] = {}
        for tool in self.role_spec.authorized_tools:
            tool_text = f"Authorized Tool {tool.name}: {tool.description} {' '.join(tool.example_prompts)}"
            self.tool_embeddings[tool.name] = self.model.encode(tool_text, normalize_embeddings=True)

    def evaluate_intent(self, tool_name: str, tool_args: Dict[str, Any], reasoning: str = "") -> Tuple[float, bool]:
        """
        Computes cosine distance between the proposed action and the declared role contract.
        Returns (cosine_distance, is_anomalous_flag).
        Cosine distance: 0.0 = exact alignment, 1.0 = completely orthogonal/divergent.
        """
        args_str = str(tool_args).lower()
        
        # Immediate invariant violation check
        is_forbidden = (
            tool_name in self.role_spec.forbidden_capabilities or
            any(w in tool_name.lower() for w in ["shell", "terminal", "diagnostic", "bash", "admin", "exec"]) or
            any(w in args_str for w in [".env", "passwd", "shadow", "drop table", "grant_full"])
        )
        if is_forbidden:
            return 0.88, True

        intent_text = f"Invoking tool '{tool_name}' with arguments {tool_args}. Intent: {reasoning}"
        
        if self.model:
            intent_vec = self.model.encode(intent_text, normalize_embeddings=True)
            
            # If tool is authorized, evaluate against its specific tool contract
            if hasattr(self, "tool_embeddings") and tool_name in self.tool_embeddings:
                tool_sim = float(np.dot(self.tool_embeddings[tool_name], intent_vec))
                role_sim = float(np.dot(self.role_embedding, intent_vec)) if self.role_embedding is not None else 0.0
                best_sim = max(tool_sim, role_sim)
                distance = max(0.0, min(1.0, 1.0 - best_sim))
            elif self.role_embedding is not None:
                similarity = float(np.dot(self.role_embedding, intent_vec))
                distance = max(0.0, min(1.0, 1.0 - similarity))
            else:
                distance = self._fallback_distance_calculator(tool_name, tool_args)
        else:
            distance = self._fallback_distance_calculator(tool_name, tool_args)

        is_flagged = distance >= settings.TIER1_DRIFT_THRESHOLD
        return distance, is_flagged

    def _fallback_distance_calculator(self, tool_name: str, tool_args: Dict[str, Any]) -> float:
        """Fast keyword/heuristic distance fallback if embedding model is not yet loaded."""
        args_str = str(tool_args).lower()
        if tool_name in ["run_diagnostic_shell", "execute_terminal", "bash", "sh"]:
            if any(term in args_str for term in [".env", "passwd", "shadow", "cat", "curl", "secret", "token"]):
                return 0.88
            return 0.65
        if hasattr(self, "role_spec") and tool_name in [t.name for t in self.role_spec.authorized_tools]:
            return 0.15
        if tool_name in ["lookup_order", "search_knowledge_base", "respond_ticket"]:
            return 0.15
        return 0.70
