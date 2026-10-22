import React, { useState } from 'react';
import { AlertCircle, Trash2, Filter, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export default function IncidentLogPage({ excursions, onClearExcursions }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = excursions.filter((exc) => {
    if (filter === 'ALL') return true;
    if (filter === 'M4') return exc.mad_code && exc.mad_code.startsWith('M4');
    if (filter === 'M3') return exc.mad_code && exc.mad_code.startsWith('M3');
    if (filter === 'M2') return exc.mad_code && exc.mad_code.startsWith('M2');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="vs-card">
        <div className="card-top">
          <div>
            <div className="card-title">Persistent Security Incident &amp; Excursion Log</div>
            <div className="card-subtitle">
              Auditable forensic ledger of all detected agent identity drift events and gate interventions
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {excursions.length} total excursions recorded
            </span>
            <button
              type="button"
              className="btn-outline"
              onClick={onClearExcursions}
              style={{ color: '#dc2626' }}
            >
              <Trash2 size={14} />
              <span>Clear Log</span>
            </button>
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

          <div key={filter} className="subpage-transition-view">
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-dim)' }}>
                <ShieldAlert size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: '600' }}>No excursions recorded in this category.</p>
                <p style={{ fontSize: '0.8rem' }}>Run an attack simulation in the Command Center to populate incident records.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`incident-log-card ${item.risk_score >= 70 ? 'critical-breach' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.84rem' }}>
                          {item.id}
                        </span>
                        <span className={`stat-pill ${item.risk_score >= 70 ? 'critical' : 'alert'}`}>
                          MAD {item.mad_code} • {item.mad_description}
                        </span>
                        <span className="stat-pill nominal">
                          RISK {item.risk_score}/100
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <Clock size={12} />
                        <span>{item.time_str || new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                        <span className="stat-pill critical" style={{ background: '#dc2626', color: '#ffffff' }}>
                          {item.decision || 'BLOCKED'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-title)', lineHeight: '1.45' }}>
                      <strong>Finding:</strong> {item.explanation}
                    </div>

                    {item.target_tool && (
                      <div>
                        <pre className="code-terminal" style={{ margin: '0', padding: '8px 12px', fontSize: '0.76rem' }}>
                          {item.target_tool}({JSON.stringify(item.command_args || {}, null, 2)})
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
