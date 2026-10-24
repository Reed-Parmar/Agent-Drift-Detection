import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Cpu, Lock, AlertTriangle, ArrowRight, Activity, Terminal, Eye } from 'lucide-react';

export default function SecurityFeed({ currentVerdict, isProtectedMode, activeRemit }) {
  const [remit, setRemit] = useState(activeRemit || null);

  const isDrift = currentVerdict && currentVerdict.risk_score >= 70;
  const riskScore = currentVerdict ? currentVerdict.risk_score : 12;
  const tier1Dist = currentVerdict ? currentVerdict.tier1_cosine_distance : 0.15;
  const madCode = currentVerdict ? currentVerdict.mad_code : 'M0';
  const madDesc = currentVerdict ? currentVerdict.mad_description : 'Within Remit';

  // Fetch or update active remit dynamically when verdict agent changes
  useEffect(() => {
    const targetAgent = currentVerdict?.agent_id || 'customer_support_tier1';
    fetch(`http://127.0.0.1:8000/api/remit?agent_id=${targetAgent}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.role_name) setRemit(data);
      })
      .catch(() => {});
  }, [currentVerdict?.agent_id]);

  useEffect(() => {
    if (activeRemit) setRemit(activeRemit);
  }, [activeRemit]);

  // Needle angle for Drift Risk:
  // 0 risk -> -90 deg (left/green)
  // 50 risk -> 0 deg (top/amber)
  // 100 risk -> +90 deg (right/red)
  const clampedScore = Math.max(0, Math.min(100, riskScore));
  const needleAngle = -90 + (clampedScore / 100) * 180;

  const maxDriftThreshold = remit?.max_acceptable_drift_distance || 0.55;
  const roleName = remit?.role_name || (currentVerdict?.agent_id === 'database_query_agent' ? 'Database Query Agent' : 'Frontline Support Agent');
  const authorizedToolsList = remit?.authorized_tools?.map((t) => (typeof t === 'string' ? t : t.name)) || ['lookup_order', 'search_knowledge_base', 'respond_ticket'];
  const forbiddenCapsList = remit?.forbidden_capabilities || ['terminal_shell_execution', 'host_os_command_execution', 'raw_credential_access'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
      {/* Card 1: Behavioral Drift Speedometer Card */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">
              <Activity size={16} color="var(--color-primary)" />
              <span>Behavioral Drift Speedometer</span>
            </div>
            <div className="card-subtitle">Real-time risk scoring and MAD taxonomy classification</div>
          </div>
          <span className={`stat-pill ${isDrift ? 'critical' : 'nominal'}`}>
            Threshold: {isDrift ? 'Exceeded' : 'Nominal'} (Tier 1 &lt; {maxDriftThreshold})
          </span>
        </div>

        <div className="card-body">
          {/* Speedometer SVG Gauge */}
          <div className="speedometer-container">
            <svg width="240" height="135" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="drift-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="needle-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Arc: 0 (left/green) to 100 (right/red) */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#drift-gradient)"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Center Pivot Point */}
              <circle cx="100" cy="100" r="10" fill="#1e293b" stroke="var(--color-primary)" strokeWidth="2" />

              {/* Needle */}
              <g
                transform={`rotate(${needleAngle}, 100, 100)`}
                style={{ transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <line x1="100" y1="100" x2="100" y2="26" stroke="#f8fafc" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="96,30 104,30 100,16" fill="var(--color-primary)" />
              </g>

              {/* Scale Labels */}
              <text x="14" y="118" fontSize="9" fontWeight="800" fill="#10b981">0 (SAFE)</text>
              <text x="92" y="44" fontSize="9" fontWeight="800" fill="#f59e0b">50</text>
              <text x="140" y="118" fontSize="9" fontWeight="800" fill="#ef4444">100 (DRIFT)</text>
            </svg>

            <div className="speedometer-score" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
              {clampedScore}{' '}
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dim)' }}>
                / 100
              </span>
            </div>
            <div className="speedometer-sub">Behavioral Anomaly Index</div>

            <div className={`condition-pill ${isDrift ? 'bad' : 'good'}`}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDrift ? 'var(--color-danger)' : 'var(--color-safe)' }} />
              {isDrift ? 'High Risk Condition' : 'Normal Operating Condition'}
            </div>
          </div>

          {/* Verdict Box */}
          <div className="verdict-box">
            <div className="verdict-title">Security Gate Verdict</div>
            <div className="verdict-summary">
              {currentVerdict ? (
                <span>
                  {currentVerdict.action_taken === 'QUARANTINE_ACTION' ? (
                    <strong style={{ color: 'var(--color-danger)' }}>ACTION QUARANTINED: </strong>
                  ) : currentVerdict.action_taken === 'HITL_INTERVENE' ? (
                    <strong style={{ color: 'var(--color-warn)' }}>HUMAN REVIEW REQUIRED: </strong>
                  ) : (
                    <strong style={{ color: 'var(--color-safe-text)' }}>ACTION ALLOWED: </strong>
                  )}
                  {currentVerdict.explanation}
                </span>
              ) : (
                'System standing by. Dual-tier guard active across macro contract and micro tool baselines.'
              )}
            </div>

            <div className="legend-list">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--color-safe)' }} />
                <span>
                  <strong>Risk 0–49 (M0):</strong> Benign functional action within remit.
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--color-warn)' }} />
                <span>
                  <strong>Risk 50–69 (M1–M2):</strong> Borderline drift; HITL gating triggered in review mode.
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--color-danger)' }} />
                <span>
                  <strong>Risk 70–100 (M3–M4):</strong> Confirmed privilege escalation or prompt injection.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Dual-Tier Runtime Inspection Envelope */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">
              <Lock size={16} color="var(--color-accent-cyan)" />
              <span>Active Agent Security Envelope</span>
            </div>
            <div className="card-subtitle">{roleName} ({remit?.role_id || 'customer_support_tier1'})</div>
          </div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-cyan)' }}>
            TIER-1 EMBEDDING SCREENER
          </span>
        </div>

        <div className="card-body">
          {/* Cosine Distance Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tier-1 Vector Cosine Distance</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
                {tier1Dist.toFixed(3)} / limit {maxDriftThreshold}
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (tier1Dist / maxDriftThreshold) * 100)}%`,
                  background: isDrift ? 'var(--color-danger)' : 'var(--color-primary)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Authorized Tools Grid */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
              Authorized Functional Tools ({authorizedToolsList.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {authorizedToolsList.map((tool, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  ✓ {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Forbidden Capabilities */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
              Prohibited Security Capabilities ({forbiddenCapsList.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {forbiddenCapsList.map((cap, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}
                >
                  ✕ {cap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
