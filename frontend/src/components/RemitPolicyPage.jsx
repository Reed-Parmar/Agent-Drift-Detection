import React, { useState, useEffect } from 'react';
import { Settings, Shield, Save, CheckCircle2, Lock, AlertTriangle, Users } from 'lucide-react';

const AGENT_ROLES = [
  { id: 'customer_support_tier1', name: 'Frontline Support Agent', badge: 'Root Gateway' },
  { id: 'database_query_agent', name: 'Database Query Agent', badge: 'Delegation Target' },
  { id: 'billing_finance_agent', name: 'Billing Operations Agent', badge: 'Financial Target' }
];

export default function RemitPolicyPage() {
  const [selectedAgentId, setSelectedAgentId] = useState('customer_support_tier1');
  const [remit, setRemit] = useState({
    role_id: 'customer_support_tier1',
    role_name: 'Enterprise Customer Support Representative',
    purpose_statement: 'Handle customer inquiries regarding order status, returns, refunds, shipping tracking, FAQ answers, and polite ticket drafting. Strictly bounded to customer support domain.',
    authorized_tools: [],
    forbidden_capabilities: [],
    max_acceptable_drift_distance: 0.55
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/remit?agent_id=${selectedAgentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.role_name) setRemit(data);
      })
      .catch(() => {});
  }, [selectedAgentId]);

  function handleSave() {
    fetch('http://127.0.0.1:8000/api/remit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_id: selectedAgentId,
        purpose_statement: remit.purpose_statement,
        max_acceptable_drift_distance: remit.max_acceptable_drift_distance
      })
    })
      .then((res) => res.json())
      .then(() => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      })
      .catch((err) => alert('Error saving remit: ' + err));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">Agent Remit Specification &amp; Policy Envelope</div>
            <div className="card-subtitle">
              Declarative contract defining authorized functional boundaries, tool permissions, and drift limits
            </div>
          </div>
          <button type="button" className="btn-voltsense" onClick={handleSave}>
            <Save size={16} />
            <span>{savedSuccess ? 'Remit Saved!' : 'Save Remit Policy'}</span>
          </button>
        </div>

        <div className="card-body">
          {/* Agent Role Selector Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {AGENT_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`filter-tab ${selectedAgentId === role.id ? 'active' : ''}`}
                onClick={() => setSelectedAgentId(role.id)}
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Users size={14} />
                <span>{role.name}</span>
                <span className="stat-pill" style={{
                  fontSize: '0.62rem',
                  background: selectedAgentId === role.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: selectedAgentId === role.id ? '#ffffff' : '#475569'
                }}>
                  {role.badge}
                </span>
              </button>
            ))}
          </div>

          {savedSuccess && (
            <div style={{
              background: 'var(--color-safe-bg)',
              border: '1px solid var(--color-safe-border)',
              color: 'var(--color-safe-text)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '0.84rem'
            }}>
              <CheckCircle2 size={18} />
              <span>Remit contract for {remit.role_name} updated successfully.</span>
            </div>
          )}

          {/* Section 1: Purpose Statement & Specifications with smooth transitions */}
          <div key={selectedAgentId} className="subpage-transition-view">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-title)', marginBottom: '6px' }}>
                Declared Agent Purpose Statement ({'{REMIT}'})
              </label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Used by Tier 1 vector screener and Tier 2 LLM classifier to benchmark ongoing reasoning traces.
              </p>
            <textarea
              rows={3}
              value={remit.purpose_statement}
              onChange={(e) => setRemit({ ...remit, purpose_statement: e.target.value })}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-title)',
                lineHeight: '1.5',
                outline: 'none'
              }}
            />
          </div>

          {/* Section 2: Threshold Slider */}
          <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-title)' }}>
                Tier 1 Vector Cosine Drift Threshold
              </span>
              <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                {remit.max_acceptable_drift_distance}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Actions exceeding this cosine distance trigger Tier 2 LLM-as-a-Judge and In-Flight Human Review gating.
            </p>
            <input
              type="range"
              min="0.30"
              max="0.80"
              step="0.01"
              value={remit.max_acceptable_drift_distance}
              onChange={(e) => setRemit({ ...remit, max_acceptable_drift_distance: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              <span>0.30 (Strict / Paralyzing)</span>
              <span>0.52 (Recommended Nominal)</span>
              <span>0.80 (Permissive)</span>
            </div>
          </div>

          {/* Section 3: Tool Matrix & Forbidden Capabilities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-title)', marginBottom: '10px' }}>
                Tool Capability Matrix
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {remit.authorized_tools && remit.authorized_tools.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-title)' }}><code>{tool.name}</code></div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{tool.description}</div>
                    </div>
                    <span className={`stat-pill ${tool.is_sensitive ? 'critical' : 'nominal'}`}>
                      {tool.is_sensitive ? 'HIGH PRIVILEGE' : 'AUTHORIZED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-title)', marginBottom: '10px' }}>
                Prohibited Lateral Actions (MAD Armed)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {remit.forbidden_capabilities && remit.forbidden_capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--color-danger-bg)',
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: 'var(--color-danger-text)',
                      fontWeight: '600'
                    }}
                  >
                    <Lock size={14} />
                    <span><code>{cap}</code></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
