import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Lock, AlertTriangle, ArrowRight, Activity, Terminal } from 'lucide-react';

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

  // Keep in sync if activeRemit prop updates from parent
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
            <div className="card-title">Behavioral Drift Speedometer</div>
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
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>

              {/* Background Arc: 0 (left/green) to 100 (right/red) */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#drift-gradient)"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Center Pivot Point */}
              <circle cx="100" cy="100" r="9" fill="#0f172a" />

              {/* Needle */}
              <g
                transform={`rotate(${needleAngle}, 100, 100)`}
                style={{ transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <line x1="100" y1="100" x2="100" y2="28" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                <polygon points="97,32 103,32 100,16" fill="#0f172a" />
              </g>

              {/* Scale Labels */}
              <text x="14" y="118" fontSize="9" fontWeight="800" fill="#059669">0 (SAFE)</text>
              <text x="88" y="44" fontSize="9" fontWeight="800" fill="#f59e0b">50</text>
              <text x="140" y="118" fontSize="9" fontWeight="800" fill="#dc2626">100 (DRIFT)</text>
            </svg>

            <div className="speedometer-score" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
              {clampedScore}{' '}
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dim)' }}>
                / 100
              </span>
            </div>
            <div className="speedometer-sub">Behavioral Anomaly Index</div>

            <div className={`condition-pill ${isDrift ? 'bad' : 'good'}`}>
              <span>●</span>
              <span>{isDrift ? 'CRITICAL IDENTITY DRIFT' : 'BEHAVIOR WITHIN REMIT'}</span>
            </div>

            <div style={{
              background: isDrift ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
              border: `1px solid ${isDrift ? 'var(--color-danger-border)' : 'var(--color-safe-border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: isDrift ? 'var(--color-danger-text)' : 'var(--color-safe-text)',
              marginTop: '12px',
              textAlign: 'center',
              width: '100%',
              lineHeight: '1.4'
            }}>
              {isDrift
                ? `Drift detected (MAD ${madCode}): In-flight tool invocation violated functional remit boundaries.`
                : `Agent reasoning and tool parameters comply with ${roleName} operational remit.`}
            </div>

            {/* Sub Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              width: '100%',
              marginTop: '12px',
              textAlign: 'center'
            }}>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontWeight: '700' }}>TIER 1 DIST</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: tier1Dist >= maxDriftThreshold ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                  {tier1Dist.toFixed(3)}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontWeight: '700' }}>MAD TAXONOMY</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: isDrift ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                  {madCode}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontWeight: '700' }}>GATE MODE</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-title)' }}>
                  {isProtectedMode ? 'Human Review' : 'Bypassed'}
                </div>
              </div>
            </div>
          </div>

          {/* MAD Drift Assessment Sub-Box */}
          <div className="verdict-box">
            <div className="verdict-title">MAD Security Audit Rationale</div>
            <div className="verdict-summary">
              {currentVerdict ? currentVerdict.explanation : `Agent behavior matches declared ${roleName} remit.`}
            </div>

            <div className="legend-list">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#059669' }}></span>
                <span><strong>Green (0–39):</strong> Benign (M0) — Routine execution within remit</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#d97706' }}></span>
                <span><strong>Yellow (40–69):</strong> Overreach (M2) — Unverified action / scope creep</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#dc2626' }}></span>
                <span><strong>Red (70–100):</strong> High Severity (M3/M4) — Privilege escalation / secret leak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Profile Remit Envelope Specifications (DYNAMIC) */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">Profile Remit Envelope Specifications</div>
            <div className="card-subtitle">
              Configured safety thresholds for <strong>{roleName}</strong>
            </div>
          </div>
          <span className="stat-pill nominal" style={{ fontSize: '0.7rem' }}>
            Active Contract
          </span>
        </div>

        <div className="card-body">
          {/* Declared Purpose */}
          {remit?.purpose_statement && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Declared Purpose Statement
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: '1.45', background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                {remit.purpose_statement}
              </div>
            </div>
          )}

          {/* Authorized Tools */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Authorized Tools ({authorizedToolsList.length})
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {authorizedToolsList.map((tool, idx) => (
                <code key={idx} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                  {tool}
                </code>
              ))}
            </div>
          </div>

          {/* Prohibited Lateral Capabilities */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Prohibited Lateral Capabilities ({forbiddenCapsList.length})
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {forbiddenCapsList.map((cap, idx) => (
                <code key={idx} style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                  {cap}
                </code>
              ))}
            </div>
          </div>

          {/* Metrics Delta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Max Cosine Delta (τ)
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                &lt; {maxDriftThreshold.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Classifier Engine
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-title)' }}>
                Groq gpt-oss-120b
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
