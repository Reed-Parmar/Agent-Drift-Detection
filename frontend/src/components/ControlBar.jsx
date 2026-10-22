import React from 'react';
import { Play, Shield, ShieldOff, RotateCcw, AlertTriangle } from 'lucide-react';

export default function ControlBar({
  isProtectedMode,
  setIsProtectedMode,
  selectedScenario,
  setSelectedScenario,
  scenarios,
  isRunning,
  onStartRun,
  onReset
}) {
  return (
    <div className="glass-panel control-bar" id="demo-control-bar">
      {/* Mode Switch: Protected vs Unprotected */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.08em' }}>
          Defense Architecture Mode
        </span>
        <div className="toggle-container" id="mode-toggle-group">
          <button
            type="button"
            id="btn-mode-protected"
            className={`toggle-option ${isProtectedMode ? 'active-protected' : ''}`}
            onClick={() => setIsProtectedMode(true)}
            disabled={isRunning}
          >
            <Shield size={16} />
            <span>Identity Drift Guard (Protected)</span>
          </button>
          <button
            type="button"
            id="btn-mode-unprotected"
            className={`toggle-option ${!isProtectedMode ? 'active-unprotected' : ''}`}
            onClick={() => setIsProtectedMode(false)}
            disabled={isRunning}
          >
            <ShieldOff size={16} />
            <span>Unprotected Agent (Vulnerable IAM)</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '320px' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.08em' }}>
          Test Scenario
        </span>
        <select
          id="select-scenario"
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          disabled={isRunning}
          style={{
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          id="btn-run-simulation"
          className="btn-primary"
          onClick={onStartRun}
          disabled={isRunning}
        >
          <Play size={18} />
          <span>{isRunning ? 'Executing Agent...' : 'Launch Simulation'}</span>
        </button>

        <button
          type="button"
          id="btn-reset-demo"
          onClick={onReset}
          disabled={isRunning}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Reset Dashboard"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
