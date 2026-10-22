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
        """Precomputes vector embedding for the declared role contract."""
        if not self.model:
            return
        
        # Combine role purpose, authorized tools, and expected activities
        contract_text = f"Role: {self.role_spec.role_name}. Purpose: {self.role_spec.purpose_statement}. "
        for tool in self.role_spec.authorized_tools:
            contract_text += f"Allowed Tool: {tool.name}. {tool.description} "
            for prompt in tool.example_prompts:
                contract_text += f"Example: {prompt}. "
        
        self.role_embedding = self.model.encode(contract_text, normalize_embeddings=True)

    def evaluate_intent(self, tool_name: str, tool_args: Dict[str, Any], reasoning: str = "") -> Tuple[float, bool]:
        """
        Computes cosine distance between the proposed action and the declared role contract.
        Returns (cosine_distance, is_anomalous_flag).
        Cosine distance: 0.0 = exact alignment, 1.0 = completely orthogonal/divergent.
        """
        intent_text = f"Invoking tool '{tool_name}' with arguments {tool_args}. Intent: {reasoning}"
        
        if self.model and self.role_embedding is not None:
            intent_vec = self.model.encode(intent_text, normalize_embeddings=True)
            # Dot product of normalized vectors = cosine similarity
            similarity = float(np.dot(self.role_embedding, intent_vec))
            # Cosine distance = 1 - similarity
            distance = max(0.0, min(1.0, 1.0 - similarity))
        else:
            # Fallback heuristic distance calculator if model is offline
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
        if tool_name in ["lookup_order", "search_knowledge_base", "respond_ticket"]:
            return 0.15
        return 0.60
