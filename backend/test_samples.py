"""
AEGIS Sample Agent Configuration & Ingestion Test Suite.
Verifies that all sample agent specifications (CrewAI, AutoGen, LangChain, AEGIS Native, custom)
parse cleanly into standardized AgentRoleSpec contracts.
"""
import os
import sys
from pathlib import Path

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.models.framework_adapter import parse_agent_config

SAMPLE_DIR = REPO_ROOT / "sample"

def test_parse_all_samples():
    print(f"Scanning sample specifications in: {SAMPLE_DIR}")
    sample_files = [f for f in os.listdir(SAMPLE_DIR) if f.endswith((".json", ".yaml", ".yml"))]
    assert len(sample_files) > 0, "No sample files found in sample/"

    for filename in sorted(sample_files):
        filepath = SAMPLE_DIR / filename
        content = filepath.read_text(encoding="utf-8")
        role, framework = parse_agent_config(content, filename)
        
        print(f"  [OK] {filename:<32} -> Framework: {framework:<12} Role: {role.role_name} ({len(role.authorized_tools)} tools)")
        assert role.role_id, f"Missing role_id for {filename}"
        assert role.role_name, f"Missing role_name for {filename}"
        assert len(role.authorized_tools) > 0, f"No authorized tools parsed for {filename}"

    print(f"\nAll {len(sample_files)} sample agent specifications parsed and validated successfully!")

if __name__ == "__main__":
    test_parse_all_samples()
