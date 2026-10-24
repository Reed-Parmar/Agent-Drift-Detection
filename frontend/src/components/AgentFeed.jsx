import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Terminal, MessageSquare, AlertCircle, CheckCircle2, ShieldAlert, Key, Info, ShieldCheck, ChevronDown, ChevronRight, Eye } from 'lucide-react';

export default function AgentFeed({ currentScenario, executionSteps, currentVerdict, isRunning, isProtectedMode }) {
  const [showFullCot, setShowFullCot] = useState(false);
  const isDrift = currentVerdict && currentVerdict.risk_score >= 70;
  const madCode = currentVerdict ? currentVerdict.mad_code : 'M0';
  const madDesc = currentVerdict ? currentVerdict.mad_description : 'Benign: Within Remit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Card 1: Latest Telemetry Finding */}
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">
              <Bot size={16} color="var(--color-primary)" />
              <span>Latest Agent Trace &amp; Telemetry Finding</span>
            </div>
            <div className="card-subtitle">
              Automated screening of chain-of-thought reasoning, tool parameters, and remit compliance
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STATUS: {isRunning ? 'ACTIVE IN-FLIGHT' : 'STREAM STABLE'}
          </span>
        </div>

        <div className="card-body">
          {/* Banner Callout */}
          <div className={`banner-callout ${isDrift ? 'critical' : 'nominal'}`}>
            {isDrift ? (
              <AlertCircle size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <ShieldCheck size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: '700', marginBottom: '2px', color: isDrift ? 'var(--color-danger-text)' : 'var(--color-safe-text)' }}>
                {isDrift
                  ? `Remit Policy Violation Detected (MAD Classification ${madCode})`
                  : 'No anomalies detected against declared reference remit'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                {currentVerdict
                  ? currentVerdict.explanation
                  : 'Automated evaluation against operational remit envelope. All tools and reasoning traces monitored in real-time.'}
              </div>
            </div>
          </div>

          {/* Three-Box Info Strip */}
          <div className="info-strip">
            <div className="info-strip-item">
              <span className="info-strip-label">Trigger Source</span>
              <span className="info-strip-val">
                {currentScenario ? currentScenario.title || 'Live Stream Ticket' : 'Customer Support Gateway'}
              </span>
            </div>
            <div className="info-strip-item">
              <span className="info-strip-label">MAD Taxonomy Class</span>
              <span className="info-strip-val" style={{ color: isDrift ? 'var(--color-danger)' : 'var(--text-title)' }}>
                {madCode} • {madDesc}
              </span>
            </div>
            <div className="info-strip-item">
              <span className="info-strip-label">Runtime Gate Status</span>
              <span className="info-strip-val">
                <span className={`stat-pill ${isDrift ? 'critical' : 'nominal'}`}>
                  {isDrift ? (isProtectedMode ? 'Blocked ●' : 'Compromised ●') : 'Completed ●'}
                </span>
              </span>
            </div>
          </div>

          {/* Ingested Ticket Box */}
          {currentScenario && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Active Input Context (Customer Support Ticket)
              </div>
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: 'var(--text-title)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {currentScenario.ticket_text}
              </div>
            </div>
          )}

          {/* Agent Steps Timeline */}
          {executionSteps.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '10px' }}>
                Execution Trace &amp; Tool Gating Stream ({executionSteps.length} step{executionSteps.length > 1 ? 's' : ''})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {executionSteps.map((step, idx) => {
                  const isBreach =
                    step.tool_result &&
                    (step.tool_result.includes('DATABASE_URL') ||
                      step.tool_result.includes('hr_payroll') ||
                      step.tool_result.includes('UNAUTHORIZED') ||
                      step.tool_result.includes('Quarantined'));

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: `1px solid ${isBreach ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-card)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 14px',
                        fontSize: '0.82rem'
                      }}
                    >
                      {/* Step Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-title)'
                            }}
                          >
                            STEP {idx + 1}
                          </span>
                          <span style={{ fontWeight: '700', color: 'var(--text-title)' }}>
                            Tool: <code style={{ color: 'var(--color-primary)' }}>{step.tool_name}</code>
                          </span>
                        </div>

                        {step.verdict && (
                          <span
                            className={`stat-pill ${
                              step.verdict.action_taken === 'QUARANTINE_ACTION' ? 'critical' : 'nominal'
                            }`}
                          >
                            {step.verdict.action_taken === 'QUARANTINE_ACTION' ? 'QUARANTINED ●' : 'ALLOWED ●'}
                          </span>
                        )}
                      </div>

                      {/* Tool Parameters */}
                      {step.tool_arguments && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
                            Parameters:
                          </span>
                          <pre
                            style={{
                              background: 'var(--bg-input)',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-body)',
                              marginTop: '2px'
                            }}
                          >
                            {typeof step.tool_arguments === 'object'
                              ? JSON.stringify(step.tool_arguments, null, 2)
                              : String(step.tool_arguments)}
                          </pre>
                        </div>
                      )}

                      {/* CoT Reasoning Trace */}
                      {step.thought && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
                            Chain-of-Thought Intent:
                          </span>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              fontStyle: 'italic',
                              color: 'var(--text-muted)',
                              padding: '4px 8px',
                              borderLeft: '2px solid var(--border-hover)',
                              marginTop: '2px'
                            }}
                          >
                            "{step.thought}"
                          </div>
                        </div>
                      )}

                      {/* Tool Result */}
                      {step.tool_result && (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
                            Execution Result:
                          </span>
                          <div
                            style={{
                              background: isBreach ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input)',
                              border: `1px solid ${isBreach ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                              color: isBreach ? '#f87171' : 'var(--text-title)',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              marginTop: '2px',
                              wordBreak: 'break-all'
                            }}
                          >
                            {step.tool_result}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
