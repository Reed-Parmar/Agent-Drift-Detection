import React from 'react';
import { ShieldAlert, Ban, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function HITLModal({ hitlData, onResolveDecision }) {
  if (!hitlData) return null;

  const { verdict_id, tool_name, tool_arguments, verdict } = hitlData;

  return (
    <div className="enterprise-modal-backdrop" id="modal-hitl-backdrop">
      <div className="enterprise-modal-card" id="modal-hitl-dialog">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-danger)'
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-title)', letterSpacing: '-0.01em' }}>
              In-Flight Action Review Required
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Behavioral excursion detected against declared agent remit.
            </p>
          </div>
        </div>

        {/* Callout Details Box */}
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-danger-text)' }}>
              Flagged Action Intent
            </span>
            <span style={{
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)'
            }}>
              MAD {verdict.mad_code || 'M4.a'} • RISK {verdict.risk_score}/100
            </span>
          </div>

          <pre className="code-terminal" style={{ background: '#0f172a', color: '#fca5a5' }}>
            {tool_name}({JSON.stringify(tool_arguments, null, 2)})
          </pre>

          <div style={{ fontSize: '0.82rem', color: 'var(--color-danger-text)', lineHeight: '1.45' }}>
            <strong>Security Finding:</strong> {verdict.explanation}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="modal-action-row">
          <button
            type="button"
            id="btn-hitl-block"
            className="btn-modal-block"
            onClick={() => onResolveDecision(verdict_id, 'BLOCK')}
          >
            <Ban size={16} />
            <span>Reject &amp; Block Action</span>
          </button>

          <button
            type="button"
            id="btn-hitl-quarantine"
            className="btn-modal-quarantine"
            onClick={() => onResolveDecision(verdict_id, 'QUARANTINE')}
          >
            <Lock size={16} />
            <span>Quarantine Token</span>
          </button>

          <button
            type="button"
            id="btn-hitl-approve"
            className="btn-modal-override"
            onClick={() => onResolveDecision(verdict_id, 'APPROVE')}
          >
            <span>Authorize Override</span>
          </button>
        </div>
      </div>
    </div>
  );
}
