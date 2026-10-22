import React from 'react';
import { Shield, Activity, FileText, Settings, Radio, UploadCloud } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, excursionCount, isConnected }) {
  return (
    <nav className="top-navbar" aria-label="Main Navigation">
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
        <div className="nav-brand">
          <div className="nav-brand-icon">
            <Shield size={18} color="#ffffff" />
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-title">AEGIS</span>
            <span className="nav-brand-sep">//</span>
            <span className="nav-brand-subtitle">AGENT IDENTITY GUARD</span>
          </div>
        </div>

        <div className="nav-tabs-segmented" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'COMMAND_CENTER'}
            className={`nav-tab-btn ${activeTab === 'COMMAND_CENTER' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMAND_CENTER')}
          >
            <Activity size={15} />
            <span>Command Center</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'CUSTOM_AGENT'}
            className={`nav-tab-btn ${activeTab === 'CUSTOM_AGENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('CUSTOM_AGENT')}
          >
            <UploadCloud size={15} />
            <span>Upload &amp; Red-Team</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'INCIDENT_LOG'}
            className={`nav-tab-btn ${activeTab === 'INCIDENT_LOG' ? 'active' : ''}`}
            onClick={() => setActiveTab('INCIDENT_LOG')}
          >
            <FileText size={15} />
            <span>Incident Log</span>
            {excursionCount > 0 && (
              <span className="stat-pill critical nav-pill-badge">
                {excursionCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'REMIT_POLICY'}
            className={`nav-tab-btn ${activeTab === 'REMIT_POLICY' ? 'active' : ''}`}
            onClick={() => setActiveTab('REMIT_POLICY')}
          >
            <Settings size={15} />
            <span>Remit &amp; Policies</span>
          </button>
        </div>
      </div>

      <div className="nav-status-indicator">
        <span className={`gateway-pulse-dot ${isConnected ? 'online' : 'offline'}`} />
        <span className="nav-status-label">{isConnected ? 'GATEWAY CONNECTED' : 'GATEWAY OFFLINE'}</span>
      </div>
    </nav>
  );
}
