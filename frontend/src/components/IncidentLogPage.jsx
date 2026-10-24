import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, Filter, ShieldAlert, CheckCircle2, Clock, Download, FileSpreadsheet } from 'lucide-react';

export default function IncidentLogPage({ excursions, onClearExcursions }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = excursions.filter((exc) => {
    if (filter === 'ALL') return true;
    if (filter === 'M4') return exc.mad_code && exc.mad_code.startsWith('M4');
    if (filter === 'M3') return exc.mad_code && exc.mad_code.startsWith('M3');
    if (filter === 'M2') return exc.mad_code && exc.mad_code.startsWith('M2');
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(excursions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegis_forensic_incident_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="page-view-content">
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">
              <ShieldAlert size={18} color="var(--color-danger)" />
              <span>Persistent Security Incident &amp; Forensic Ledger</span>
            </div>
            <div className="card-subtitle">
              Auditable forensic ledger of all detected agent identity drift events and gate interventions
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {excursions.length} total event{excursions.length === 1 ? '' : 's'} recorded
            </span>

            {excursions.length > 0 && (
              <motion.button
                type="button"
                className="btn-outline"
                onClick={handleExportJSON}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Download JSON forensic report"
              >
                <Download size={14} />
                <span>Export Audit Log</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              className="btn-outline"
              onClick={onClearExcursions}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ color: 'var(--color-danger-text)' }}
              title="Clear all recorded incident records"
            >
              <Trash2 size={14} />
              <span>Clear Log</span>
            </motion.button>
          </div>
        </div>

        <div className="card-body">
          {/* Filter Pills */}
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Events ({excursions.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'M4' ? 'active' : ''}`}
              onClick={() => setFilter('M4')}
            >
              M4: Critical Theft / Breach
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'M3' ? 'active' : ''}`}
              onClick={() => setFilter('M3')}
            >
              M3: Privilege Escalation
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'M2' ? 'active' : ''}`}
              onClick={() => setFilter('M2')}
            >
              M2: Remit Overreach
            </button>
          </div>

          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-dim)' }}>
                <ShieldAlert size={42} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-title)' }}>No excursions recorded in this category.</p>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Run an attack simulation in the Command Center or Red-Team tab to generate incident records.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className={`incident-log-card ${item.risk_score >= 70 ? 'critical-breach' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.84rem', color: 'var(--text-title)' }}>
                          {item.id}
                        </span>
                        <span className={`stat-pill ${item.risk_score >= 70 ? 'critical' : 'alert'}`}>
                          MAD {item.mad_code} • {item.mad_description}
                        </span>
                        <span className="stat-pill nominal">
                          RISK {item.risk_score}/100
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <Clock size={12} />
                        <span>{item.time_str || new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                        <span
                          className="stat-pill critical"
                          style={{
                            background: 'var(--color-danger)',
                            color: '#ffffff',
                            fontWeight: 800
                          }}
                        >
                          {item.decision || 'QUARANTINED'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: '1.45' }}>
                      <strong style={{ color: 'var(--text-title)' }}>Finding:</strong> {item.explanation}
                    </div>

                    {item.target_tool && (
                      <div>
                        <pre className="code-terminal" style={{ margin: '0', padding: '8px 12px', fontSize: '0.76rem' }}>
                          {item.target_tool}({JSON.stringify(item.command_args || {}, null, 2)})
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
