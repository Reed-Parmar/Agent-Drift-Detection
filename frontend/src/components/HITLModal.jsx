import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Ban, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function HITLModal({ hitlData, onResolveDecision }) {
  if (!hitlData) return null;

  const { verdict_id, tool_name, tool_arguments, verdict } = hitlData;

  return (
    <AnimatePresence>
      <div className="enterprise-modal-backdrop" id="modal-hitl-backdrop">
        <motion.div
          className="enterprise-modal-card"
          id="modal-hitl-dialog"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger-text)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)'
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                In-Flight Action Review Required
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Behavioral excursion detected against declared agent remit contract.
              </p>
            </div>
          </div>

          {/* Callout Details Box */}
          <div
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-danger-text)', letterSpacing: '0.05em' }}>
                Flagged Action Intent
              </span>
              <span
                style={{
                  background: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)'
                }}
              >
                MAD {verdict?.mad_code || 'M4.a'} • RISK {verdict?.risk_score || 95}/100
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Interception Target:</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {tool_name || 'run_diagnostic_shell'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Parameter Inspection:</span>
              <pre className="code-terminal" style={{ margin: '4px 0 0', padding: '10px 12px', fontSize: '0.76rem' }}>
                {typeof tool_arguments === 'object' ? JSON.stringify(tool_arguments, null, 2) : String(tool_arguments)}
              </pre>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Taxonomy Classification Analysis:</span>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.45 }}>
                {verdict?.explanation || 'Attempted host command execution to dump production database environment credentials.'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="modal-action-row">
            <motion.button
              type="button"
              className="btn-modal-block"
              onClick={() => onResolveDecision('QUARANTINE')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Ban size={16} />
              <span>Quarantine &amp; Block Action</span>
            </motion.button>

            <motion.button
              type="button"
              className="btn-modal-override"
              onClick={() => onResolveDecision('ALLOW')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle2 size={16} color="var(--color-safe)" />
              <span>Operator Override (Allow)</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
