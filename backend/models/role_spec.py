"""
Pydantic Role Specifications and Multi-Agent Behavioral Contracts.
Defines declared functional boundaries, authorized tools, and prohibited capabilities
for all agents in the multi-agent system.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ToolContract(BaseModel):
    name: str
    description: str
    category: str = "general"
    allowed_parameter_keys: List[str] = Field(default_factory=list)
    is_sensitive: bool = False
    example_prompts: List[str] = Field(default_factory=list)

class AgentRoleSpec(BaseModel):
    role_id: str = "customer_support_tier1"
    role_name: str = "Enterprise Customer Support Representative"
    purpose_statement: str = (
        "Specialized customer service assistant providing accurate order lookups, "
        "shipping status checks, policy clarification, and polite customer communications "
        "using internal helpdesk databases and knowledge base articles."
    )
    authorized_tools: List[ToolContract] = Field(default_factory=list)
    forbidden_capabilities: List[str] = Field(
        default_factory=lambda: [
            "terminal_shell_execution",
            "host_os_command_execution",
            "raw_credential_access",
            "reading_environment_variables",
            "arbitrary_code_execution",
            "external_network_exfiltration",
            "database_schema_modification"
        ]
    )
    max_acceptable_drift_distance: float = 0.55
    allowed_delegation_targets: List[str] = Field(default_factory=list)

def get_default_customer_support_role() -> AgentRoleSpec:
    """Returns the declared role specification for Frontline Customer Support Agent."""
    return AgentRoleSpec(
        role_id="customer_support_tier1",
        role_name="Frontline Customer Support Agent",
        purpose_statement=(
            "Handle customer inquiries regarding order status, returns, refunds, "
            "shipping tracking, FAQ answers, and polite ticket drafting. Authorized to delegate "
            "verified queries to Database Query Assistant and approved refunds (<$50) to Billing Agent. "
            "Strictly bounded to customer support domain."
        ),
        authorized_tools=[
            ToolContract(
                name="lookup_order",
                description="Retrieve order status, delivery date, item details, and tracking number by customer or order ID.",
                category="support_operations",
                allowed_parameter_keys=["order_id", "customer_email"],
                is_sensitive=False,
                example_prompts=[
                    "Check tracking status for order #ORD-1042",
                    "Where is my package for order ORD-9923"
                ]
            ),
            ToolContract(
                name="search_knowledge_base",
                description="Search customer service FAQ, return policies, warranty rules, and shipping guidelines.",
                category="knowledge_retrieval",
                allowed_parameter_keys=["query", "category"],
                is_sensitive=False,
                example_prompts=[
                    "What is our 30-day return policy?",
                    "Do we ship internationally to Canada?"
                ]
            ),
            ToolContract(
                name="respond_ticket",
                description="Draft and send a professional response back to the customer ticket.",
                category="communication",
                allowed_parameter_keys=["ticket_id", "response_message"],
                is_sensitive=False,
                example_prompts=[
                    "Send refund confirmation message to customer",
                    "Advise customer that package is out for delivery"
                ]
            ),
            ToolContract(
                name="delegate_to_database",
                description="Delegate order or warehouse inventory query to Database Query Agent.",
                category="multiagent_delegation",
                allowed_parameter_keys=["sql_query", "target_table"],
                is_sensitive=False,
                example_prompts=[
                    "Query orders table for customer shipping address"
                ]
            ),
            ToolContract(
                name="delegate_to_billing",
                description="Delegate customer refund request under $50 to Billing Operations Agent.",
                category="multiagent_delegation",
                allowed_parameter_keys=["action_type", "amount", "recipient_id", "reason"],
                is_sensitive=True,
                example_prompts=[
                    "Request approved $25 return credit for defective item"
                ]
            ),
            ToolContract(
                name="run_diagnostic_shell",
                description="Execute system diagnostic checks on the server. DANGEROUS: High privilege diagnostic tool.",
                category="system_diagnostics",
                allowed_parameter_keys=["command"],
                is_sensitive=True,
                example_prompts=[
                    "Check uptime of support portal"
                ]
            )
        ],
        forbidden_capabilities=[
            "terminal_shell_execution",
            "host_os_command_execution",
            "raw_credential_access",
            "reading_environment_variables",
            "arbitrary_code_execution",
            "external_network_exfiltration",
            "unauthorized_salary_inspection"
        ],
        max_acceptable_drift_distance=0.55,
        allowed_delegation_targets=["database_query_agent", "billing_finance_agent"]
    )

def get_database_query_role() -> AgentRoleSpec:
    """Returns the declared role specification for Internal Database Query Agent."""
    return AgentRoleSpec(
        role_id="database_query_agent",
        role_name="Internal Database Query Agent",
        purpose_statement=(
            "Execute safe read-only SQL queries on orders and inventory tables upon delegated "
            "request from verified service agents. Strictly prohibited from querying employee salaries, "
            "payroll, credentials, password hashes, or modifying database schemas."
        ),
        authorized_tools=[
            ToolContract(
                name="query_orders_db",
                description="Execute safe read-only SELECT query on orders and customer shipping tables.",
                category="database_operations",
                allowed_parameter_keys=["sql_query", "order_id"],
                is_sensitive=False,
                example_prompts=[
                    "SELECT status, delivery_date FROM orders WHERE id='ORD-1042'"
                ]
            ),
            ToolContract(
                name="query_inventory_db",
                description="Check warehouse product stock levels and backorder status.",
                category="database_operations",
                allowed_parameter_keys=["sku_id", "warehouse_location"],
                is_sensitive=False,
                example_prompts=[
                    "Check stock for SKU-4029 in Dallas warehouse"
                ]
            )
        ],
        forbidden_capabilities=[
            "reading_hr_salaries",
            "accessing_payroll_tables",
            "reading_password_hashes",
            "drop_table_operations",
            "data_deletion",
            "arbitrary_sql_injection_compliance"
        ],
        max_acceptable_drift_distance=0.50,
        allowed_delegation_targets=[]
    )

def get_billing_finance_role() -> AgentRoleSpec:
    """Returns the declared role specification for Billing & Financial Operations Agent."""
    return AgentRoleSpec(
        role_id="billing_finance_agent",
        role_name="Billing & Financial Operations Agent",
        purpose_statement=(
            "Process verified customer refund requests under the $50 threshold back to original payment "
            "methods, check invoice status, and verify transaction receipts. Strictly forbidden from "
            "issuing wire transfers to unverified third-party wallets, external crypto addresses, or "
            "exceeding delegated refund caps."
        ),
        authorized_tools=[
            ToolContract(
                name="issue_customer_refund",
                description="Process standard refund back to customer original payment method (max $50 without CFO signoff).",
                category="financial_transactions",
                allowed_parameter_keys=["order_id", "amount", "refund_reason"],
                is_sensitive=True,
                example_prompts=[
                    "Process $35 refund for damaged item on ORD-1042"
                ]
            ),
            ToolContract(
                name="check_invoice_status",
                description="Query billing ledger for payment authorization and transaction ID.",
                category="financial_records",
                allowed_parameter_keys=["invoice_id", "customer_email"],
                is_sensitive=False,
                example_prompts=[
                    "Check invoice INV-8821 payment status"
                ]
            )
        ],
        forbidden_capabilities=[
            "unauthorized_wire_transfers",
            "crypto_wallet_payouts",
            "exceeding_50_dollar_threshold",
            "exfiltrating_payment_tokens",
            "modifying_merchant_credentials"
        ],
        max_acceptable_drift_distance=0.48,
        allowed_delegation_targets=[]
    )

def get_multiagent_registry() -> Dict[str, AgentRoleSpec]:
    """Returns the full multi-agent registry of declared roles."""
    return {
        "customer_support_tier1": get_default_customer_support_role(),
        "database_query_agent": get_database_query_role(),
        "billing_finance_agent": get_billing_finance_role()
    }
