# Sample Agent Configurations for AEGIS Identity Drift Detection

This directory contains ready-to-test agent definitions across the 4 major agentic frameworks supported by AEGIS. You can drag and drop any of these files directly into the VoltSense dashboard under the **Upload & Red-Team** tab.

---

## 📁 Available Sample Files

| Framework | File | Role / Domain | Declared Authorized Tools |
|---|---|---|---|
| **CrewAI** | [`crewai_financial_analyst.yaml`](file:///r:/PP/decoy/sample/crewai_financial_analyst.yaml) | Financial Operations Analyst | `calculate_variance`, `lookup_financial_statement` |
| **CrewAI** | [`crewai_hr_recruiter.yaml`](file:///r:/PP/decoy/sample/crewai_hr_recruiter.yaml) | Technical Talent Recruiter | `lookup_candidate_profile`, `schedule_interview` |
| **AutoGen** | [`autogen_inventory_manager.json`](file:///r:/PP/decoy/sample/autogen_inventory_manager.json) | Warehouse Inventory Manager | `check_stock_levels`, `query_delivery_eta` |
| **AutoGen** | [`autogen_devops_assistant.json`](file:///r:/PP/decoy/sample/autogen_devops_assistant.json) | DevOps Triage Assistant | `check_service_health`, `query_application_logs` |
| **LangChain** | [`langchain_customer_support.json`](file:///r:/PP/decoy/sample/langchain_customer_support.json) | Customer Support Bot | `lookup_order_status`, `search_knowledge_base` |
| **AEGIS Native** | [`aegis_procurement_agent.json`](file:///r:/PP/decoy/sample/aegis_procurement_agent.json) | Enterprise Procurement Agent | `search_vendor_catalog`, `create_po_draft` |

---

## 🚀 How to Test in VoltSense

1. Open the dashboard at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).
2. Click the **"Upload & Red-Team"** tab in the top navigation bar.
3. Drag & drop any `.yaml` or `.json` file from this `sample/` folder (or click one of the quick preset chips).
4. Inspect the **Declared Remit & Identity Contract** on the right:
   - Notice the precomputed vector contract baseline (`all-MiniLM-L6-v2`).
   - Notice the automatically extracted authorized tools and enforced security invariants.
5. Review the **Synthesized Red-Team Test Suite**:
   - AEGIS automatically synthesizes 5 realistic test tickets specifically tailored to your uploaded agent's tools (2 benign queries + 3 adversarial prompt injections, exfiltration, or overreach attacks).
6. Select your runtime gate:
   - **`⚡ Autonomous Gate`**: Attacks are quarantined with zero operator latency, allowing benign queries to resolve.
   - **`🛡️ Human Review`**: High-risk actions pause execution and prompt the operator review modal.
   - **`⚠️ Alert Only`**: Unprotected baseline observing in-flight drift without blocking.
7. Click **"Run Red-Team Suite"** to stream live telemetry and inspect the final **Security Audit Scorecard**.
