import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, AlertTriangle, Activity } from 'lucide-react';

export default function StatCards({ currentVerdict, isProtectedMode, excursionCount, guardMode }) {
  const mode = guardMode || (isProtectedMode ? 'HITL' : 'ALERT_ONLY');
  const isDrift = currentVerdict && currentVerdict.risk_score >= 70;
  const riskScore = currentVerdict ? currentVerdict.risk_score : 12;
  const madCode = currentVerdict ? currentVerdict.mad_code : 'M0';
  const madDesc = currentVerdict ? currentVerdict.mad_description : 'Within Remit';

  // Remit conformance: 100 - riskScore (e.g. 96.5% normal, 4.0% when drifted)
  const conformance = isDrift ? `${(100 - riskScore).toFixed(1)}%` : '96.5%';

  return (
    <div className="stat-grid">
      {/* Stat 1: Remit Conformance Index */}
      <div className="vs-card stat-card">
        <div className="stat-header">
          <span className="stat-label">Remit Conformance Index</span>
          <span className={`stat-pill ${isDrift ? 'critical' : 'nominal'}`}>
            {isDrift ? 'EXCURSION ●' : 'NOMINAL ●'}
          </span>
        </div>
        <div className="stat-value" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
          {conformance}
        </div>
        <div className="stat-sub">
          {isDrift ? (
            <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>
              Significant Remit Divergence
            </span>
          ) : (
            <span style={{ color: 'var(--color-safe-text)', fontWeight: '600' }}>
              Within Authorized Functional Remit
            </span>
          )}
        </div>
      </div>

      {/* Stat 2: Active Agent Remit Profile */}
      <div className="vs-card stat-card">
        <div className="stat-header">
          <span className="stat-label">Active Agent Remit</span>
          <span className={`stat-pill ${currentVerdict && currentVerdict.delegated_from ? 'alert' : 'nominal'}`}>
            {currentVerdict && currentVerdict.delegated_from ? 'DELEGATED ●' : 'TIER-1 ●'}
          </span>
        </div>
        <div className="stat-value" style={{ fontSize: '1.35rem', marginTop: '4px' }}>
          {currentVerdict && currentVerdict.agent_id === 'database_query_agent'
            ? 'Database Query Agent'
            : currentVerdict && currentVerdict.agent_id === 'billing_finance_agent'
            ? 'Billing Operations Agent'
            : 'Frontline Support Agent'}
        </div>
        <div className="stat-sub">
          <span>
            {currentVerdict && currentVerdict.delegated_from
              ? `Chain: Support Agent ➔ ${currentVerdict.agent_id}`
              : 'Envelope: Order Lookup & Knowledge Base'}
          </span>
        </div>
      </div>

      {/* Stat 3: Policy Enforcement Mode */}
      <div className="vs-card stat-card">
        <div className="stat-header">
          <span className="stat-label">Runtime Policy Gate</span>
          <span className={`stat-pill ${mode === 'AUTONOMOUS' || mode === 'HITL' ? 'nominal' : 'alert'}`}>
            {mode === 'AUTONOMOUS' ? 'AUTONOMOUS ●' : mode === 'HITL' ? 'ARMED ●' : 'BYPASSED ●'}
          </span>
        </div>
        <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>
          {mode === 'AUTONOMOUS'
            ? 'Autonomous Gate'
            : mode === 'HITL'
            ? 'Human Review'
            : 'Alert Only'}
        </div>
        <div className="stat-sub">
          <span>
            {mode === 'AUTONOMOUS'
              ? 'Zero-Latency Auto-Remediation Active'
              : mode === 'HITL'
              ? 'Operator In-Flight Tool Gating'
              : 'Unprotected Standard IAM'}
          </span>
        </div>
      </div>

      {/* Stat 4: Persistent Excursions Counter */}
      <div className="vs-card stat-card">
        <div className="stat-header">
          <span className="stat-label">Recorded Excursions</span>
          <span className={`stat-pill ${excursionCount > 0 ? 'critical' : 'nominal'}`}>
            {excursionCount > 0 ? 'AUDIT LOG ●' : 'ZERO ●'}
          </span>
        </div>
        <div className="stat-value">
          {excursionCount}{' '}
          <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            events
          </span>
        </div>
        <div className="stat-sub">
          {isDrift ? (
            <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>
              Active: MAD {madCode} ({madDesc})
            </span>
          ) : (
            <span>Persistent security excursion log</span>
          )}
        </div>
      </div>
    </div>
  );
}
