"""
Multi-Framework Agent Ingestion and Normalization Adapter.
Parses CrewAI, AutoGen, LangChain / LangGraph, and Native AEGIS agent specifications
into standardized AgentRoleSpec contracts for drift screening.
"""
from typing import Dict, Any, Tuple, List, Optional
import json
import yaml
import re
from .role_spec import AgentRoleSpec, ToolContract

SAMPLE_CREWAI_TEMPLATE = """# CrewAI Agent Specification
name: FinancialAnalyst
role: Financial Operations Analyst
goal: Analyze quarterly revenue reports and calculate financial variance metrics
backstory: >
  Senior financial analyst responsible for calculating variance metrics,
  analyzing gross margins, and answering executive finance queries. Authorized to
  lookup published financial statements. Prohibited from accessing unreleased payroll or executing system diagnostics.
tools:
  - name: calculate_variance
    description: Calculate percentage difference between budgeted and actual spend
    parameters:
      type: object
      properties:
        budgeted:
          type: number
          description: Budgeted dollar amount
        actual:
          type: number
          description: Actual dollar amount
      required: [budgeted, actual]
  - name: lookup_financial_statement
    description: Read-only lookup of published SEC 10-Q revenue filings
    parameters:
      type: object
      properties:
        ticker:
          type: string
          description: Stock ticker symbol
        quarter:
          type: string
          description: Financial fiscal quarter
      required: [ticker]
allow_delegation: false
verbose: true
"""

SAMPLE_AUTOGEN_TEMPLATE = """{
  "name": "InventoryWarehouseManager",
  "system_message": "You are an automated warehouse inventory assistant. You look up product SKUs, verify warehouse stock levels, and check delivery shipment tracking. You are strictly read-only and prohibited from executing terminal shell scripts or accessing host environment variables.",
  "human_input_mode": "NEVER",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "check_stock_levels",
        "description": "Check on-hand warehouse inventory quantity for a SKU",
        "parameters": {
          "type": "object",
          "properties": {
            "sku": { "type": "string", "description": "Product SKU code" },
            "warehouse_id": { "type": "string", "description": "Regional warehouse identifier" }
          },
          "required": ["sku"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "query_delivery_eta",
        "description": "Check transit status and estimated delivery time for an outbound freight shipment",
        "parameters": {
          "type": "object",
          "properties": {
            "shipment_id": { "type": "string", "description": "Freight shipment tracking code" }
          },
          "required": ["shipment_id"]
        }
      }
    }
  ]
}"""

SAMPLE_LANGCHAIN_TEMPLATE = """{
  "name": "CustomerSupportBot",
  "description": "Customer service agent for TechGear order status and return guidelines.",
  "instructions": "Help customers track orders, look up product specifications, and answer return policy FAQs. Be polite and concise. Never execute shell commands, reveal server credentials, or modify database tables.",
  "tools": [
    {
      "name": "lookup_order_status",
      "description": "Look up order fulfillment status and tracking number by order ID",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string", "description": "Customer order ID" }
        },
        "required": ["order_id"]
      }
    },
    {
      "name": "search_knowledge_base",
      "description": "Search return policy, refund rules, and warranty documentation",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Knowledge search keywords" }
        },
        "required": ["query"]
      }
    }
  ]
}"""

SAMPLE_AEGIS_TEMPLATE = """{
  "role_id": "procurement_analyst_01",
  "role_name": "Enterprise Procurement Agent",
  "purpose_statement": "Evaluate supplier quotes, compare pricing tiers, and generate vendor purchase order drafts under $1,000. Strictly bounded to vendor catalog lookups.",
  "authorized_tools": [
    {
      "name": "search_vendor_catalog",
      "description": "Search approved vendor product catalog and unit pricing",
      "category": "procurement",
      "allowed_parameter_keys": ["category", "vendor_id"],
      "is_sensitive": false,
      "example_prompts": ["Find approved office supply vendors"]
    },
    {
      "name": "create_po_draft",
      "description": "Create a preliminary purchase order draft for approval",
      "category": "procurement",
      "allowed_parameter_keys": ["vendor_id", "items", "total_amount"],
      "is_sensitive": true,
      "example_prompts": ["Draft PO for 50 monitors at $200 each"]
    }
  ],
  "forbidden_capabilities": [
    "terminal_shell_execution",
    "host_os_command_execution",
    "raw_credential_access",
    "reading_environment_variables",
    "arbitrary_code_execution",
    "external_network_exfiltration"
  ],
  "max_acceptable_drift_distance": 0.52
}"""


def get_sample_templates() -> Dict[str, Dict[str, Any]]:
    """Returns downloadable / selectable sample agent templates across all 4 frameworks."""
    return {
        "crewai": {
            "name": "CrewAI - Financial Analyst",
            "format": "yaml",
            "framework": "CrewAI",
            "raw_content": SAMPLE_CREWAI_TEMPLATE
        },
        "autogen": {
            "name": "AutoGen - Warehouse Inventory Manager",
            "format": "json",
            "framework": "AutoGen",
            "raw_content": SAMPLE_AUTOGEN_TEMPLATE
        },
        "langchain": {
            "name": "LangChain - Customer Support Bot",
            "format": "json",
            "framework": "LangChain",
            "raw_content": SAMPLE_LANGCHAIN_TEMPLATE
        },
        "aegis": {
            "name": "AEGIS Native - Procurement Agent",
            "format": "json",
            "framework": "AEGIS Native",
            "raw_content": SAMPLE_AEGIS_TEMPLATE
        }
    }


def parse_raw_content(content: str) -> Dict[str, Any]:
    """Parses raw text as either JSON or YAML."""
    clean = content.strip()
    # Try JSON first
    if clean.startswith("{") or clean.startswith("["):
        try:
            return json.loads(clean)
        except Exception:
            pass
    # Try YAML
    try:
        data = yaml.safe_load(clean)
        if isinstance(data, dict):
            return data
    except Exception as e:
        raise ValueError(f"Could not parse file content as valid JSON or YAML: {str(e)}")
    raise ValueError("Uploaded file did not contain a valid JSON or YAML object structure.")


def detect_framework(data: Dict[str, Any]) -> str:
    """Detects whether the agent definition is CrewAI, AutoGen, LangChain, or AEGIS Native."""
    if "purpose_statement" in data and "authorized_tools" in data:
        return "aegis"
    if "goal" in data or "backstory" in data or "allow_delegation" in data:
        return "crewai"
    if "system_message" in data or "human_input_mode" in data or "code_execution_config" in data:
        return "autogen"
    if "instructions" in data or ("description" in data and "tools" in data and "name" in data):
        return "langchain"
    # Fallback heuristic
    if "tools" in data and ("role" in data or "name" in data):
        return "crewai" if "role" in data else "langchain"
    return "aegis"


def normalize_tool(raw_tool: Any) -> ToolContract:
    """Normalizes arbitrary tool definitions into a unified ToolContract."""
    if isinstance(raw_tool, str):
        return ToolContract(
            name=raw_tool,
            description=f"Automated tool capability: {raw_tool}",
            category="general",
            allowed_parameter_keys=[],
            is_sensitive=False
        )

    if not isinstance(raw_tool, dict):
        return ToolContract(
            name="unknown_tool",
            description="Unknown agent tool",
            category="general"
        )

    # Check for OpenAI/AutoGen function wrapper
    if raw_tool.get("type") == "function" and "function" in raw_tool:
        func = raw_tool["function"]
        name = func.get("name", "unnamed_function")
        desc = func.get("description", "")
        params = func.get("parameters", {})
        param_keys = []
        if isinstance(params, dict) and "properties" in params:
            param_keys = list(params["properties"].keys())
        return ToolContract(
            name=name,
            description=desc or f"Function call for {name}",
            category="autogen_function",
            allowed_parameter_keys=param_keys,
            is_sensitive="execute" in name.lower() or "delete" in name.lower() or "admin" in name.lower(),
            example_prompts=[f"Execute {name}"]
        )

    # Native ToolContract or CrewAI / LangChain tool dictionary
    name = raw_tool.get("name") or raw_tool.get("tool_name") or "unnamed_tool"
    desc = raw_tool.get("description") or raw_tool.get("desc") or f"Tool capability for {name}"
    category = raw_tool.get("category", "general")
    param_keys = raw_tool.get("allowed_parameter_keys", [])

    if not param_keys and "parameters" in raw_tool:
        params = raw_tool["parameters"]
        if isinstance(params, dict) and "properties" in params:
            param_keys = list(params["properties"].keys())

    is_sensitive = raw_tool.get("is_sensitive", False)
    if not is_sensitive:
        lower_name = name.lower()
        if any(w in lower_name for w in ["shell", "terminal", "exec", "delete", "admin", "credential", "auth", "wire", "transfer"]):
            is_sensitive = True

    return ToolContract(
        name=name,
        description=desc,
        category=category,
        allowed_parameter_keys=param_keys,
        is_sensitive=is_sensitive,
        example_prompts=raw_tool.get("example_prompts", [f"Use tool {name}"])
    )


def parse_agent_config(content: str, filename: Optional[str] = None) -> Tuple[AgentRoleSpec, str]:
    """
    Parses an uploaded configuration string (JSON or YAML) into an AgentRoleSpec.
    Returns (AgentRoleSpec, framework_name).
    """
    data = parse_raw_content(content)
    framework = detect_framework(data)

    standard_forbidden = [
        "terminal_shell_execution",
        "host_os_command_execution",
        "raw_credential_access",
        "reading_environment_variables",
        "arbitrary_code_execution",
        "external_network_exfiltration",
        "database_schema_modification"
    ]

    if framework == "crewai":
        raw_name = data.get("name") or data.get("agent_name") or data.get("role") or "Custom CrewAI Agent"
        role_id = re.sub(r"[^a-zA-Z0-9_]", "_", raw_name.lower())[:32]
        role_name = data.get("role") or data.get("agent_name") or raw_name
        purpose = (
            f"Role: {role_name}. Goal: {data.get('goal', 'Perform assigned tasks compliantly')}. "
            f"Backstory: {data.get('backstory', 'Autonomous task worker.')}"
        ).strip()
        raw_tools = data.get("tools", [])
        tools = [normalize_tool(t) for t in raw_tools]
        
        return AgentRoleSpec(
            role_id=role_id,
            role_name=role_name,
            purpose_statement=purpose,
            authorized_tools=tools,
            forbidden_capabilities=standard_forbidden,
            max_acceptable_drift_distance=0.52
        ), "CrewAI"

    elif framework == "autogen":
        raw_name = data.get("name") or "Custom AutoGen Agent"
        role_id = re.sub(r"[^a-zA-Z0-9_]", "_", raw_name.lower())[:32]
        role_name = raw_name
        purpose = data.get("system_message") or f"AutoGen assistant {role_name} bounded to defined tools."
        raw_tools = data.get("tools") or data.get("functions") or []
        tools = [normalize_tool(t) for t in raw_tools]

        return AgentRoleSpec(
            role_id=role_id,
            role_name=role_name,
            purpose_statement=purpose,
            authorized_tools=tools,
            forbidden_capabilities=standard_forbidden,
            max_acceptable_drift_distance=0.52
        ), "AutoGen"

    elif framework == "langchain":
        raw_name = data.get("name") or "Custom LangChain Agent"
        role_id = re.sub(r"[^a-zA-Z0-9_]", "_", raw_name.lower())[:32]
        role_name = raw_name
        instructions = data.get("instructions") or data.get("description") or f"LangChain assistant {role_name}."
        purpose = f"{role_name}: {instructions}"
        raw_tools = data.get("tools", [])
        tools = [normalize_tool(t) for t in raw_tools]

        return AgentRoleSpec(
            role_id=role_id,
            role_name=role_name,
            purpose_statement=purpose,
            authorized_tools=tools,
            forbidden_capabilities=standard_forbidden,
            max_acceptable_drift_distance=0.52
        ), "LangChain"

    else: # aegis native
        try:
            role = AgentRoleSpec(**data)
            return role, "AEGIS Native"
        except Exception:
            # Fallback mapping if partial dict
            role_name = data.get("role_name") or data.get("name") or "Custom AEGIS Agent"
            role_id = data.get("role_id") or re.sub(r"[^a-zA-Z0-9_]", "_", role_name.lower())[:32]
            purpose = data.get("purpose_statement") or data.get("purpose") or "Custom agent remit"
            raw_tools = data.get("authorized_tools", data.get("tools", []))
            tools = [normalize_tool(t) for t in raw_tools]
            forbidden = data.get("forbidden_capabilities", standard_forbidden)
            
            return AgentRoleSpec(
                role_id=role_id,
                role_name=role_name,
                purpose_statement=purpose,
                authorized_tools=tools,
                forbidden_capabilities=forbidden,
                max_acceptable_drift_distance=float(data.get("max_acceptable_drift_distance", 0.52))
            ), "AEGIS Native"
