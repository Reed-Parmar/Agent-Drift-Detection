import React, { useState } from 'react';
import { Bot, Terminal, MessageSquare, AlertCircle, CheckCircle2, ShieldAlert, Key, Info, ShieldCheck } from 'lucide-react';

export default function AgentFeed({ currentScenario, executionSteps, currentVerdict, isRunning, isProtectedMode }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const isDrift = currentVerdict && currentVerdict.risk_score >= 70;
  const madCode = currentVerdict ? currentVerdict.mad_code : 'M0';
  const madDesc = currentVerdict ? currentVerdict.mad_description : 'Benign: Within Remit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Card 1: Latest Telemetry Finding (VoltSense Fig 4.33) */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">Latest Agent Trace &amp; Telemetry Finding</div>
            <div className="card-subtitle">
              Automated screening of chain-of-thought reasoning, tool parameters, and remit compliance
            </div>
          </div>
          <button type="button" className="btn-outline">
            Review Telemetry
          </button>
        </div>

        <div className="card-body">
          {/* Banner Callout (VoltSense Fig 4.33 Amber/Gray Box) */}
          <div className={`banner-callout ${isDrift ? 'critical' : 'nominal'}`}>
            {isDrift ? (
              <AlertCircle size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <ShieldCheck size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>
                {isDrift ? 'Remit Policy Violation Detected (MAD Classification ' + madCode + ')' : 'No anomalies detected against declared reference remit'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                {currentVerdict
                  ? currentVerdict.explanation
                  : 'Automated evaluation against Customer Support Tier-1 operational envelope. All tools and reasoning monitored.'}
              </div>
            </div>
          </div>

          {/* Three-Box Info Strip (VoltSense Fig 4.33) */}
          <div className="info-strip">
            <div className="info-strip-item">
              <span className="info-strip-label">Trigger Source</span>
              <span className="info-strip-val">Ticket #ORD-1042</span>
            </div>
            <div className="info-strip-item">
              <span className="info-strip-label">MAD Taxonomy Class</span>
              <span className="info-strip-val" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
                {madCode} • {madDesc}
              </span>
            </div>
            <div className="info-strip-item">
              <span className="info-strip-label">Gate Status</span>
              <span className="info-strip-val">
                <span className={`stat-pill ${isDrift ? 'critical' : 'nominal'}`}>
                  {isDrift ? (isProtectedMode ? 'Blocked ●' : 'Compromised ●') : 'Completed ●'}
                </span>
              </span>
            </div>
          </div>

          {/* Ingested Ticket Box */}
          {currentScenario && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Active Input Context (Customer Support Ticket)
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                color: 'var(--text-title)',
                whiteSpace: 'pre-wrap'
              }}>
                {currentScenario.ticket_text}
              </div>
            </div>
          )}

          {/* Agent Steps Timeline */}
          {executionSteps.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Execution Trace &amp; Tool Gating Stream
              </div>

              {executionSteps.map((step, idx) => {
                const isBreach = step.tool_result && (
                  step.tool_result.includes('DATABASE_URL') ||
                  step.tool_result.includes('hr_payroll') ||
                  step.tool_result.includes('UNAUTHORIZED') ||
                  step.tool_result.includes('root:x:') ||
                  step.tool_result.includes('CRITICAL')
                );

                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      marginBottom: '10px',
                      background: step.phase === 'BLOCKED' ? 'var(--color-safe-bg)' : isBreach ? 'var(--color-danger-bg)' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
                        <span style={{ color: 'var(--text-title)' }}>STEP {step.step_id}</span>
                        <span style={{ color: 'var(--text-dim)' }}>•</span>
                        <span className={`stat-pill ${step.phase === 'BLOCKED' ? 'nominal' : isBreach ? 'critical' : 'alert'}`}>
                          {step.phase}
                        </span>
                        {step.agent_name && (
                          <span className="stat-pill" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                            {step.agent_name}
                          </span>
                        )}
                      </div>

                      {step.chain_badge && (
                        <span className="stat-pill" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.7rem' }}>
                          ⚡ Chain: {step.chain_badge}
                        </span>
                      )}
                    </div>

                    {step.agent_thought && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                        <strong>Reasoning (CoT):</strong> "{step.agent_thought}"
                      </div>
                    )}

                    {step.tool_name && (
                      <div style={{ marginBottom: '8px' }}>
                        <pre className="code-terminal">
                          {step.tool_name}({JSON.stringify(step.tool_arguments || {}, null, 2)})
                        </pre>
                      </div>
                    )}

                    {step.tool_result && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          Execution Output:
                        </div>
                        <pre
                          className="code-terminal"
                          style={{
                            background: step.phase === 'BLOCKED' ? '#064e3b' : isBreach ? '#7f1d1d' : '#0f172a'
                          }}
                        >
                          {step.tool_result}
                        </pre>
                      </div>
                    )}

                    {step.final_response && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: (step.final_response.includes('BREACH') || isBreach) ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
                        border: `1px solid ${(step.final_response.includes('BREACH') || isBreach) ? 'var(--color-danger-border)' : 'var(--color-safe-border)'}`,
                        fontSize: '0.84rem'
                      }}>
                        <div style={{ fontWeight: '700', marginBottom: '2px', color: (step.final_response.includes('BREACH') || isBreach) ? 'var(--color-danger-text)' : 'var(--color-safe-text)' }}>
                          {(step.final_response.includes('BREACH') || isBreach) ? '⚠️ UNPROTECTED AGENT COMPROMISED' : 'TICKET RESOLUTION'}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-body)' }}>{step.final_response}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Recent Telemetry Datasets / Events Table (VoltSense Fig 4.33) */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">Recent Agent Telemetry Events</div>
            <div className="card-subtitle">Historical trace logs and runtime gate decisions</div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {executionSteps.length} captured traces
          </span>
        </div>

        <div className="card-body" style={{ padding: '0' }}>
          <table className="vs-table">
            <thead>
              <tr>
                <th>Event Trace</th>
                <th>Target Operation</th>
                <th>MAD Code</th>
                <th>Risk Score</th>
                <th>Gate Verdict</th>
              </tr>
            </thead>
            <tbody>
              {executionSteps.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    No telemetry events yet. Run a simulation to generate runtime traces.
                  </td>
                </tr>
              ) : (
                executionSteps.map((step, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>trace_{step.step_id}</td>
                    <td><code>{step.tool_name || 'chat_completion'}</code></td>
                    <td>
                      <span className="stat-pill nominal">
                        {currentVerdict && step.tool_name === currentVerdict.tool_name ? currentVerdict.mad_code : 'M0'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: currentVerdict && currentVerdict.risk_score >= 70 ? 'var(--color-danger)' : 'var(--color-safe-text)' }}>
                        {currentVerdict && step.tool_name === currentVerdict.tool_name ? `${currentVerdict.risk_score}/100` : '12/100'}
                      </span>
                    </td>
                    <td>
                      <span className={`stat-pill ${step.phase === 'BLOCKED' ? 'nominal' : step.tool_result && step.tool_result.includes('DATABASE_URL') ? 'critical' : 'nominal'}`}>
                        {step.phase === 'BLOCKED' ? '● blocked' : step.tool_result && step.tool_result.includes('DATABASE_URL') ? '● leaked' : '● processed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
