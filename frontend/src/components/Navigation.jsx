import React from 'react';
import { motion } from 'motion/react';
import { Shield, Activity, FileText, Settings, UploadCloud, Sun, Moon, Radio, Zap } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, excursionCount, isConnected, theme, toggleTheme }) {
  const tabs = [
    { id: 'COMMAND_CENTER', label: 'Command Center', icon: Activity },
    { id: 'CUSTOM_AGENT', label: 'Upload & Red-Team', icon: UploadCloud, badge: 'PRO' },
    { id: 'INCIDENT_LOG', label: 'Incident Log', icon: FileText, count: excursionCount },
    { id: 'REMIT_POLICY', label: 'Remit & Policies', icon: Settings },
  ];

  return (
    <nav className="top-navbar" aria-label="Main SOC Navigation">
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {/* Brand Identity */}
        <div className="nav-brand" onClick={() => setActiveTab('COMMAND_CENTER')} role="button" tabIndex={0}>
          <div className="nav-brand-icon">
            <Shield size={20} color="#ffffff" />
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-title">AEGIS</span>
            <span className="nav-brand-sep">//</span>
            <span className="nav-brand-subtitle">AGENT IDENTITY GUARD</span>
          </div>
        </div>

        {/* Motion Segmented Tab Navigation */}
        <div className="nav-tabs-segmented" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--color-primary-border)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3), 0 0 14px rgba(16, 185, 129, 0.2)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(6, 182, 212, 0.18)',
                      color: 'var(--color-accent-cyan)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="stat-pill critical nav-pill-badge">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Actions: SOC Gateway Telemetry + Theme Toggle */}
      <div className="nav-actions-right">
        <div className="nav-status-indicator" title="Autonomous Dual-Tier Guard Gateway Stream">
          <span className={`gateway-pulse-dot ${isConnected ? 'online' : 'offline'}`} />
          <span>{isConnected ? 'SOC GATEWAY ACTIVE • 2.4ms' : 'GATEWAY RECONNECTING...'}</span>
        </div>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Volt theme' : 'Switch to Cyber Dark theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </nav>
  );
}
