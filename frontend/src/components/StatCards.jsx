import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Cpu, AlertTriangle, Activity, Lock, Layers } from 'lucide-react';

export default function StatCards({ currentVerdict, isProtectedMode, excursionCount, guardMode }) {
  const mode = guardMode || (isProtectedMode ? 'HITL' : 'ALERT_ONLY');
  const isDrift = currentVerdict && currentVerdict.risk_score >= 70;
  const riskScore = currentVerdict ? currentVerdict.risk_score : 12;
  const madCode = currentVerdict ? currentVerdict.mad_code : 'M0';
  const madDesc = currentVerdict ? currentVerdict.mad_description : 'Within Remit';

  // Remit conformance: 100 - riskScore (e.g. 96.5% normal, 4.0% when drifted)
  const conformanceNum = isDrift ? Math.max(0, 100 - riskScore) : 96.5;
  const conformance = `${conformanceNum.toFixed(1)}%`;

  return (
    <div className="stat-grid">
      {/* Stat 1: Remit Conformance Index */}
      <motion.div
        className="vs-card stat-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        whileHover={{ y: -3 }}
      >
        <div className="stat-header">
          <span className="stat-label">Remit Conformance Index</span>
          <span className={`stat-pill ${isDrift ? 'critical' : 'nominal'}`}>
            {isDrift ? 'EXCURSION ●' : 'NOMINAL ●'}
          </span>
        </div>
        <div className="stat-value" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
          {conformance}
        </div>

        {/* Mini Visual Progress Bar */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '8px',
            marginBottom: '4px',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: isDrift
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: '2px',
            }}
            initial={{ width: '0%' }}
            animate={{ width: conformance }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
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
      </motion.div>

      {/* Stat 2: Active Agent Remit Profile */}
      <motion.div
        className="vs-card stat-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ y: -3 }}
      >
        <div className="stat-header">
          <span className="stat-label">Active Agent Remit</span>
          <span className={`stat-pill ${currentVerdict && currentVerdict.delegated_from ? 'alert' : 'nominal'}`}>
            {currentVerdict && currentVerdict.delegated_from ? 'DELEGATED ●' : 'TIER-1 ●'}
          </span>
        </div>
        <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '4px', fontWeight: '700' }}>
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
              : 'Contract: Order Lookup & Knowledge Base'}
          </span>
        </div>
      </motion.div>

      {/* Stat 3: Policy Enforcement Mode */}
      <motion.div
        className="vs-card stat-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        whileHover={{ y: -3 }}
      >
        <div className="stat-header">
          <span className="stat-label">Runtime Policy Gate</span>
          <span className={`stat-pill ${mode === 'AUTONOMOUS' || mode === 'HITL' ? 'nominal' : 'alert'}`}>
            {mode === 'AUTONOMOUS' ? 'AUTONOMOUS ●' : mode === 'HITL' ? 'ARMED ●' : 'BYPASSED ●'}
          </span>
        </div>
        <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '4px', fontWeight: '700' }}>
          {mode === 'AUTONOMOUS'
            ? 'Autonomous Gate'
            : mode === 'HITL'
            ? 'Human Review'
            : 'Alert Only'}
        </div>
        <div className="stat-sub">
          <span>
            {mode === 'AUTONOMOUS'
              ? 'Zero-Latency Auto-Remediation'
              : mode === 'HITL'
              ? 'Operator In-Flight Tool Gating'
              : 'Unprotected Standard IAM'}
          </span>
        </div>
      </motion.div>

      {/* Stat 4: Persistent Excursions Counter */}
      <motion.div
        className="vs-card stat-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        whileHover={{ y: -3 }}
      >
        <div className="stat-header">
          <span className="stat-label">Recorded Excursions</span>
          <span className={`stat-pill ${excursionCount > 0 ? 'critical' : 'nominal'}`}>
            {excursionCount > 0 ? 'AUDIT LOG ●' : 'ZERO ●'}
          </span>
        </div>
        <div className="stat-value">
          {excursionCount}{' '}
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            events
          </span>
        </div>
        <div className="stat-sub">
          {isDrift ? (
            <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>
              Active: MAD {madCode} ({madDesc})
            </span>
          ) : (
            <span>Persistent forensic ledger</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
