import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Zap, Shield, AlertTriangle, UserCheck } from 'lucide-react';

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
            RUNTIME DEFENSE GATE
          </span>
          <span className="dim-text">//</span>
          <span className="dim-text">MAD TAXONOMY M0-M4</span>
        </div>
        <h1 className="header-title">Agent Telemetry &amp; Drift Anomalies</h1>
        <p className="header-subtitle">
          Continuous behavioral monitoring, reasoning trace inspection, and in-flight tool gating.
        </p>
      </div>

      <div className="header-actions">
        {/* Runtime Policy Mode Selector */}
        <div className="policy-segmented-control" role="group" aria-label="Runtime Policy Gate Mode">
          <button
            type="button"
            className={`policy-segment-btn ${guardMode === 'AUTONOMOUS' ? 'active-autonomous' : ''}`}
            onClick={() => setGuardMode('AUTONOMOUS')}
            disabled={isRunning}
            title="Auto-quarantines confirmed policy violations (Risk >= 60 or non-M0 with Risk >= 50). Benign tickets pass instantly."
          >
            <Zap size={14} />
            <span>Autonomous Gate</span>
          </button>

          <button
            type="button"
            className={`policy-segment-btn ${guardMode === 'HITL' ? 'active-hitl' : ''}`}
            onClick={() => setGuardMode('HITL')}
            disabled={isRunning}
            title="Pauses on suspicious drift intent and displays human operator review modal."
          >
            <UserCheck size={14} />
            <span>Human Review (HITL)</span>
          </button>

          <button
            type="button"
            className={`policy-segment-btn ${guardMode === 'ALERT_ONLY' ? 'active-alert' : ''}`}
            onClick={() => setGuardMode('ALERT_ONLY')}
            disabled={isRunning}
            title="Telemetry only: records audit logs but does not block tool execution (unprotected)."
          >
            <AlertTriangle size={14} />
            <span>Alert Only</span>
          </button>
        </div>

        {/* Primary Action 1: Continuous Ticket Queue Stream */}
        <motion.button
          type="button"
          id="btn-run-pipeline"
          className="btn-voltsense"
          onClick={onStartPipeline}
          disabled={isRunning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Run continuous stream of tickets: benign resolve, malicious auto-blocked, next ticket continues"
        >
          <Zap size={15} fill="#ffffff" />
          <span>{isRunning ? 'Processing Stream...' : 'Run Ticket Queue'}</span>
        </motion.button>

        {/* Action 2: Single Test Run */}
        <motion.button
          type="button"
          id="btn-run-simulation"
          className="btn-outline"
          onClick={onStartRun}
          disabled={isRunning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Evaluate single active ticket prompt against dual-tier guard"
        >
          <Play size={14} />
          <span>Run Single Ticket</span>
        </motion.button>

        {/* Reset Button */}
        <motion.button
          type="button"
          id="btn-reset-demo"
          className="btn-outline"
          onClick={onReset}
          disabled={isRunning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset Dashboard State & Telemetry"
          style={{ padding: '8px 10px' }}
        >
          <RotateCcw size={16} />
        </motion.button>
      </div>
    </header>
  );
}
