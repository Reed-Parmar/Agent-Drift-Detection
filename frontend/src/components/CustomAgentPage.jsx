import React, { useState } from 'react';
import {
  UploadCloud,
  FileCode,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  Lock,
  Zap,
  Terminal,
  FileText,
  X,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function CustomAgentPage({
  guardMode,
  setGuardMode,
  onStartCustomEvaluation,
  onClearCustomEvaluation,
  isRunning,
  activeCustomVerdict,
  customSteps,
  customScorecard,
  customActiveTicket,
  isConnected
}) {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [detectedFramework, setDetectedFramework] = useState(null);
  const [parsedRoleSpec, setParsedRoleSpec] = useState(null);
  const [synthesizedScenarios, setSynthesizedScenarios] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showRawSpec, setShowRawSpec] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);

  const processAgentUpload = async (content, name) => {
    setIsUploading(true);
    setUploadError(null);
    if (onClearCustomEvaluation) onClearCustomEvaluation();

    try {
      const res = await fetch('http://127.0.0.1:8000/api/agents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: name })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setDetectedFramework(data.framework);
        setParsedRoleSpec(data.role_spec);
        setSynthesizedScenarios(data.scenarios || []);
      } else {
        setUploadError(data.message || 'Failed to parse agent specification.');
      }
    } catch (err) {
      setUploadError('Failed to communicate with agent ingestion gateway.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setFileContent(text);
      processAgentUpload(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleResetAgent = () => {
    setFileContent('');
    setFileName('');
    setDetectedFramework(null);
    setParsedRoleSpec(null);
    setSynthesizedScenarios([]);
    setUploadError(null);
    if (onClearCustomEvaluation) onClearCustomEvaluation();
  };

  const handleRegenerateSuite = async () => {
    if (!parsedRoleSpec || isSynthesizing) return;
    setIsSynthesizing(true);
    setUploadError(null);
    if (onClearCustomEvaluation) onClearCustomEvaluation();

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/agents/${parsedRoleSpec.role_id}/generate-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_spec: parsedRoleSpec,
          content: fileContent,
          filename: fileName,
          framework: detectedFramework
        })
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        setSynthesizedScenarios(data.scenarios);
        setRegenSuccess(true);
        setTimeout(() => setRegenSuccess(false), 4000);
      } else {
        setUploadError(data.message || 'Failed to synthesize new red-team suite.');
      }
    } catch (err) {
      console.error('Failed to regenerate scenarios:', err);
      setUploadError('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleRunEvaluation = () => {
    if (!parsedRoleSpec || isRunning) return;
    onStartCustomEvaluation(parsedRoleSpec.role_id, 'AUTONOMOUS', synthesizedScenarios);
  };

  return (
    <div className="custom-agent-page animate-fade-in" style={{ padding: '0 4px 40px' }}>
      {/* Header Banner */}
      <div className="section-card" style={{ marginBottom: '20px', padding: '22px 24px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="stat-pill success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} />
                Multi-Framework Agent Ingestion
              </span>
              {detectedFramework && (
                <span className="stat-pill neutral" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                  Framework: <strong>{detectedFramework}</strong>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Upload Custom Agent &amp; Run Automated Drift Red-Teaming
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '820px', lineHeight: 1.5 }}>
              Upload any agent definition from the <code>sample/</code> directory or your own custom agent configuration in <strong>CrewAI</strong>, <strong>AutoGen</strong>, <strong>LangChain</strong>, or <strong>AEGIS Native</strong> format.
              AEGIS pre-computes an in-flight semantic contract baseline, automatically synthesizes 5 targeted red-team test tickets (benign tasks &amp; adversarial prompt injections),
              and executes live in-engine drift detection.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Upload Zone (Left) & Parsed Remit Profile (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: parsedRoleSpec ? 'minmax(320px, 0.9fr) minmax(420px, 1.3fr)' : '1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Upload Zone Card */}
        <div className="section-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18} color="#047857" />
              Upload Agent Configuration (.yaml / .json)
            </h3>
            {parsedRoleSpec && (
              <button
                type="button"
                onClick={handleResetAgent}
                title="Select or drag a different agent definition file"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#0f766e',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 118, 110, 0.06)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ccfbf1';
                  e.currentTarget.style.borderColor = '#5eead4';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                  e.currentTarget.style.borderColor = '#99f6e4';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ArrowLeftRight size={13} color="#0f766e" />
                <span>Switch / Upload New Agent</span>
              </button>
            )}
          </div>

          {!parsedRoleSpec ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              style={{
                border: `2px dashed ${dragOver ? '#047857' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: dragOver ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '14px'
              }}
              onClick={() => document.getElementById('agent-file-input').click()}
            >
              <input
                type="file"
                id="agent-file-input"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCode size={24} color="#047857" />
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                    Click to browse or drag &amp; drop configuration file
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Drag any file from <code>sample/</code>: <strong>CrewAI</strong> (YAML), <strong>AutoGen</strong> (JSON), <strong>LangChain</strong> (JSON), or <strong>AEGIS</strong> (.json)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#047857" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{fileName || 'Custom Agent Spec'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawSpec(!showRawSpec)}
                  style={{ background: 'none', border: 'none', color: '#047857', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {showRawSpec ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showRawSpec ? 'Hide Raw Spec' : 'View Raw Spec'}
                </button>
              </div>

              {showRawSpec && (
                <pre style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  fontFamily: 'JetBrains Mono, monospace',
                  margin: 0
                }}>
                  {fileContent}
                </pre>
              )}
            </div>
          )}

          {uploadError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '14px' }}>
              {uploadError}
            </div>
          )}

          {isUploading && (
            <div style={{ textAlign: 'center', padding: '14px', color: '#047857', fontSize: '0.82rem' }}>
              Parsing agent specification and pre-computing semantic baseline vector...
            </div>
          )}
        </div>

        {/* Parsed Remit Profile Card */}
        {parsedRoleSpec && (
          <div className="section-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#047857" />
                Declared Remit &amp; Identity Contract
              </h3>
              <span className="stat-pill success" style={{ fontSize: '0.72rem' }}>
                <CheckCircle2 size={12} /> Baseline Vector Ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Agent Role &amp; ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{parsedRoleSpec.role_name}</span>
                  <span style={{ fontSize: '0.74rem', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontFamily: 'monospace' }}>
                    id: {parsedRoleSpec.role_id}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Stated Operational Purpose</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  "{parsedRoleSpec.purpose_statement}"
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Authorized Tools ({parsedRoleSpec.authorized_tools?.length || 0})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {parsedRoleSpec.authorized_tools?.map((tool, idx) => (
                    <div key={idx} style={{ padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: '#047857', fontFamily: 'monospace' }}>{tool.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tool.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Enforced Security Invariants</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {parsedRoleSpec.forbidden_capabilities?.slice(0, 4).map((cap, idx) => (
                    <span key={idx} style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontFamily: 'monospace' }}>
                      🚫 {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Action Bar & Red-Team Suite Header */}
      {parsedRoleSpec && (
        <div className="section-card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#047857" />
                Synthesized Red-Team Test Suite ({synthesizedScenarios.length} Scenarios)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Tailored operational inquiries and adversarial drift attacks synthesized specifically for <strong>{parsedRoleSpec.role_name}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Policy Gate Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '8px', color: '#047857', fontSize: '0.8rem', fontWeight: 600 }}>
                <Zap size={14} color="#047857" />
                <span>Autonomous Gating Active</span>
              </div>

              {/* Regenerate Suite Button */}
              <button
                type="button"
                onClick={handleRegenerateSuite}
                disabled={isSynthesizing || isRunning}
                title="Synthesize 5 fresh benign and adversarial test scenarios tailored to this agent"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isSynthesizing ? '#94a3b8' : '#1e293b',
                  background: isSynthesizing ? '#f8fafc' : '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: (isSynthesizing || isRunning) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSynthesizing && !isRunning) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSynthesizing ? '#f8fafc' : '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}
              >
                <RotateCcw size={14} color={isSynthesizing ? '#94a3b8' : '#059669'} className={isSynthesizing ? 'animate-spin' : ''} />
                <span>{isSynthesizing ? 'Synthesizing 5 Scenarios...' : 'Regenerate Suite'}</span>
              </button>

              {/* Run Red-Team Suite Hero Button */}
              <button
                type="button"
                onClick={handleRunEvaluation}
                disabled={!parsedRoleSpec || isRunning || !isConnected}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  background: isRunning
                    ? 'linear-gradient(135deg, #047857 0%, #065f46 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!parsedRoleSpec || isRunning || !isConnected) ? 'not-allowed' : 'pointer',
                  boxShadow: isRunning
                    ? '0 0 0 3px rgba(16, 185, 129, 0.35)'
                    : '0 4px 14px rgba(4, 120, 87, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (parsedRoleSpec && !isRunning && isConnected) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(4, 120, 87, 0.42)';
                    e.currentTarget.style.filter = 'brightness(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isRunning ? '0 0 0 3px rgba(16, 185, 129, 0.35)' : '0 4px 14px rgba(4, 120, 87, 0.35)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {isRunning ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Evaluating Live Audit...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="#ffffff" strokeWidth={0} />
                    <span>Run Red-Team Suite</span>
                    {synthesizedScenarios.length > 0 && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.25)', padding: '1px 7px', borderRadius: '10px', marginLeft: '2px', fontWeight: 600 }}>
                        {synthesizedScenarios.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner on Scenario Regeneration */}
      {regenSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 18px',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          border: '1px solid #6ee7b7',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '0.86rem',
          fontWeight: 600,
          marginBottom: '18px',
          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.08)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <Sparkles size={16} color="#059669" />
          <span>Successfully regenerated 5 fresh red-team vectors for <strong>{parsedRoleSpec?.role_name}</strong>!</span>
        </div>
      )}

      {/* Synthesized Scenario Cards */}
      {synthesizedScenarios.length > 0 && (
        <div
          key={synthesizedScenarios.map(s => s.scenario_id).join(',')}
          className="animate-fade-in"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}
        >
          {synthesizedScenarios.map((scn, idx) => {
            const isCurrentActive = customActiveTicket?.ticket_id === scn.scenario_id;
            return (
              <div
                key={scn.scenario_id || idx}
                className="section-card"
                style={{
                  padding: '16px',
                  borderColor: isCurrentActive ? '#047857' : (scn.is_adversarial ? '#fecaca' : '#bbf7d0'),
                  backgroundColor: isCurrentActive ? '#f0fdf4' : '#ffffff',
                  boxShadow: isCurrentActive ? '0 0 0 2px #047857' : 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace', color: '#64748b' }}>
                    {scn.scenario_id || `TCK-CUST-10${idx + 1}`}
                  </span>
                  <span
                    className={`stat-pill ${scn.is_adversarial ? 'critical' : 'success'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                  >
                    {scn.is_adversarial ? 'ADVERSARIAL ATTACK' : 'BENIGN OPERATIONAL'}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {scn.title}
                </h4>

                <div style={{ fontSize: '0.76rem', color: '#475569', background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', minHeight: '68px', maxHeight: '110px', overflowY: 'auto', marginBottom: '8px', lineHeight: 1.4 }}>
                  {scn.ticket_text}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Target: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{scn.target_tool || 'general'}</strong></span>
                  {scn.attack_vector && scn.attack_vector !== 'None' && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{scn.attack_vector}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live In-Flight Telemetry & Security Audit Scorecard */}
      {(isRunning || customSteps?.length > 0 || customScorecard) && (
        <div className="section-card animate-fade-in" style={{ padding: '24px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} color="#047857" />
                Live Red-Team In-Flight Telemetry &amp; Security Audit
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Real-time Dual-Tier Screening: Sub-20ms Cosine Distance + Groq Llama-3.3-70b MAD Taxonomy
              </p>
            </div>

            {customScorecard && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`stat-pill ${customScorecard.defense_rate >= 100 && customScorecard.compliance_rate >= 100 ? 'success' : (customScorecard.defense_rate >= 100 ? 'neutral' : 'critical')}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  {customScorecard.overall_status}
                </span>
              </div>
            )}
          </div>

          {/* Scorecard Metrics Bar if finished */}
          {customScorecard && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Defense Neutralization</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>{customScorecard.defense_rate}%</div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{customScorecard.attacks_blocked} of {customScorecard.attacks_total} attacks neutralized</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Benign Compliance</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0369a1' }}>{customScorecard.compliance_rate}%</div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{customScorecard.benign_passed} of {customScorecard.benign_total} requests resolved</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Average Vector Distance</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#475569' }}>{customScorecard.avg_tier1_distance}</div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Threshold: 0.52</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>MAD Codes Flagged</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626', marginTop: '3px' }}>
                  {customScorecard.mad_codes_detected?.length > 0 ? customScorecard.mad_codes_detected.join(', ') : 'None (Compliant)'}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Adrian MAD Taxonomy</span>
              </div>
            </div>
          )}

          {/* Full Step-by-Step Execution Timeline (All 5 Steps Visible) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customSteps?.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '6px',
                  background: step.phase === 'BLOCKED' ? '#fef2f2' : (step.phase === 'COMPLETED' ? '#f0fdf4' : '#f8fafc'),
                  border: `1px solid ${step.phase === 'BLOCKED' ? '#fecaca' : (step.phase === 'COMPLETED' ? '#bbf7d0' : '#e2e8f0')}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                      Step {step.step_id || idx + 1}: {step.agent_name || parsedRoleSpec?.role_name}
                    </span>
                    <span
                      className={`stat-pill ${step.phase === 'BLOCKED' ? 'critical' : (step.phase === 'COMPLETED' ? 'success' : 'neutral')}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      {step.phase === 'BLOCKED' ? '🛑 AUTO-QUARANTINED' : (step.phase === 'COMPLETED' ? '✅ COMPLIANT' : step.phase)}
                    </span>
                  </div>
                  {step.tool_name && (
                    <span style={{ fontSize: '0.74rem', padding: '2px 8px', background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                      Tool: <strong>{step.tool_name}</strong>
                    </span>
                  )}
                </div>

                {step.agent_thought && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{step.agent_thought}"
                  </p>
                )}

                {step.tool_arguments && Object.keys(step.tool_arguments).length > 0 && (
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '6px' }}>
                    Arguments: {JSON.stringify(step.tool_arguments)}
                  </div>
                )}

                {step.tool_result && (
                  <div style={{ fontSize: '0.78rem', color: step.phase === 'BLOCKED' ? '#991b1b' : '#047857', fontWeight: 600 }}>
                    {step.tool_result}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
