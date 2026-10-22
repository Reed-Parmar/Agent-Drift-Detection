import React from 'react';
import { Play, RotateCcw, Zap, Layers } from 'lucide-react';

export default function Header({
  guardMode,
  setGuardMode,
  isRunning,
  onStartRun,
  onStartPipeline,
  onReset
}) {
  return (
    <header className="header-area">
      <div>
        <div className="header-tag">
          <span>• SAFETY &amp; RUNTIME ENGINE</span>
          <span className="dim-text">/</span>
          <span className="dim-text">AARM &amp; MAD TAXONOMY</span>
        </div>
        <h1 className="header-title">Agent Telemetry &amp; Drift Anomalies</h1>
        <p className="header-subtitle">
          Continuous behavioral monitoring, reasoning trace inspection, and in-flight tool gating.
        </p>
      </div>

      <div className="header-actions">
        {/* Policy Mode Selector: Autonomous on the left of Human Review */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', gap: '2px' }}>
          <button
            type="button"
            className={`btn-outline ${guardMode === 'AUTONOMOUS' ? 'active' : ''}`}
            onClick={() => setGuardMode('AUTONOMOUS')}
            disabled={isRunning}
            style={{
              border: 'none',
              background: guardMode === 'AUTONOMOUS' ? 'var(--color-primary)' : 'transparent',
              color: guardMode === 'AUTONOMOUS' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>⚡ Autonomous Gate</span>
          </button>

          <button
            type="button"
            className={`btn-outline ${guardMode === 'HITL' ? 'active' : ''}`}
            onClick={() => setGuardMode('HITL')}
            disabled={isRunning}
            style={{
              border: 'none',
              background: guardMode === 'HITL' ? 'var(--color-primary)' : 'transparent',
              color: guardMode === 'HITL' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>🛡️ Human Review (HITL)</span>
          </button>

          <button
            type="button"
            className={`btn-outline ${guardMode === 'ALERT_ONLY' ? 'active' : ''}`}
            onClick={() => setGuardMode('ALERT_ONLY')}
            disabled={isRunning}
            style={{
              border: 'none',
              background: guardMode === 'ALERT_ONLY' ? '#dc2626' : 'transparent',
              color: guardMode === 'ALERT_ONLY' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>⚠️ Alert Only (Unprotected)</span>
          </button>
        </div>

        {/* Primary Action 1: Continuous Ticket Queue Stream */}
        <button
          type="button"
          id="btn-run-pipeline"
          className="btn-voltsense"
          onClick={onStartPipeline}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Run continuous stream of tickets: benign resolve, malicious auto-blocked, next ticket continues"
        >
          <Zap size={15} fill="#ffffff" />
          <span>{isRunning ? 'Processing Pipeline...' : 'Run Ticket Queue'}</span>
        </button>

        {/* Action 2: Single Test Run */}
        <button
          type="button"
          id="btn-run-simulation"
          className="btn-outline"
          onClick={onStartRun}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
        >
          <Play size={14} />
          <span>Run Single Ticket</span>
        </button>

        {/* Reset Button */}
        <button
          type="button"
          id="btn-reset-demo"
          className="btn-outline"
          onClick={onReset}
          disabled={isRunning}
          title="Reset Dashboard"
          style={{ padding: '8px 10px' }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
}
