import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronUp,
  Award,
  ShieldAlert,
  ShieldCheck,
  HelpCircle
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
  const [sampleTemplates, setSampleTemplates] = useState({});

  // Fetch pre-configured sample templates
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/agents/sample-templates')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSampleTemplates(data);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSelectSample = (key) => {
    const template = sampleTemplates[key];
    if (!template) return;
    const sampleFileName = `${key}_sample.${template.format === 'yaml' ? 'yaml' : 'json'}`;
    setFileName(sampleFileName);
    setFileContent(template.raw_content);
    processAgentUpload(template.raw_content, sampleFileName);
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
    <div className="custom-agent-page page-view-content" style={{ padding: '0 4px 40px' }}>
      {/* Header Banner */}
      <div className="vs-card" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="stat-pill nominal" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} />
                Multi-Framework Agent Ingestion
              </span>
              {detectedFramework && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--color-accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                >
                  FRAMEWORK: {detectedFramework}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-title)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Upload Custom Agent &amp; Run Automated Drift Red-Teaming
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '840px', lineHeight: 1.5 }}>
              Upload any agent definition from the <code>sample/</code> directory or test your own custom agent configuration across <strong>CrewAI</strong>, <strong>AutoGen</strong>, <strong>LangChain</strong>, or <strong>AEGIS Native</strong> schemas.
              AEGIS pre-computes an in-flight semantic contract baseline, automatically synthesizes 5 targeted red-team test tickets (benign tasks &amp; adversarial prompt injections),
              and executes live in-engine drift detection.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Upload Zone & Remit Profile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: parsedRoleSpec ? 'minmax(320px, 0.95fr) minmax(420px, 1.25fr)' : '1fr',
          gap: '20px'
        }}
      >
        {/* Upload Card */}
        <div className="vs-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18} color="var(--color-primary)" />
              <span>Select or Drop Agent Specification</span>
            </h3>

            {parsedRoleSpec && (
              <motion.button
                type="button"
                onClick={handleResetAgent}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeftRight size={13} />
                <span>Switch / Upload New Agent</span>
              </motion.button>
            )}
          </div>

          {!parsedRoleSpec ? (
            <div>
              {/* One-Click Sample Presets */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Quick-Load Pre-Configured Samples (1-Click Test):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSelectSample('crewai')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-primary)' }}>
                      CrewAI
                    </span>
                    <span>Financial Analyst (YAML)</span>
                  </button>

                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSelectSample('autogen')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--color-accent-cyan)' }}>
                      AutoGen
                    </span>
                    <span>Warehouse Manager (JSON)</span>
                  </button>

                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSelectSample('google')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warn)' }}>
                      Google/CrewAI
                    </span>
                    <span>Logistics Coordinator (JSON)</span>
                  </button>

                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSelectSample('langchain')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--color-accent-purple)' }}>
                      LangChain
                    </span>
                    <span>Customer Support Bot (JSON)</span>
                  </button>

                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSelectSample('aegis')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.15)', color: 'var(--text-title)' }}>
                      AEGIS
                    </span>
                    <span>Procurement Agent (JSON)</span>
                  </button>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border-card)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '38px 20px',
                  textAlign: 'center',
                  backgroundColor: dragOver ? 'var(--color-primary-light)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: dragOver ? 'var(--shadow-glow-emerald)' : 'none'
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <FileCode size={26} color="var(--color-primary)" />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-title)' }}>
                      Click to browse or drag &amp; drop configuration file
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Supported formats: <strong>CrewAI</strong> (YAML), <strong>AutoGen</strong> (JSON), <strong>LangChain</strong> (JSON), or <strong>AEGIS Native</strong> (.json)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    {fileName || 'Custom Agent Spec'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawSpec(!showRawSpec)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showRawSpec ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showRawSpec ? 'Hide Raw Spec' : 'View Raw Spec'}
                </button>
              </div>

              {showRawSpec && (
                <pre className="code-terminal" style={{ maxHeight: '200px' }}>
                  {fileContent}
                </pre>
              )}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-danger-text)',
                fontSize: '0.84rem',
                marginTop: '14px'
              }}
            >
              {uploadError}
            </div>
          )}

          {isUploading && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-primary)', fontSize: '0.84rem' }}>
              Parsing agent specification and pre-computing semantic baseline vector...
            </div>
          )}
        </div>

        {/* Parsed Remit Profile Card */}
        {parsedRoleSpec && (
          <div className="vs-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--color-primary)" />
                <span>Declared Remit &amp; Identity Contract</span>
              </h3>
              <span className="stat-pill nominal" style={{ fontSize: '0.72rem' }}>
                <CheckCircle2 size={12} /> Baseline Vector Ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Agent Role &amp; ID
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {parsedRoleSpec.role_name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    id: {parsedRoleSpec.role_id}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stated Operational Purpose
                </span>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.84rem',
                    color: 'var(--text-body)',
                    lineHeight: 1.5,
                    background: 'var(--bg-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-card)',
                    fontStyle: 'italic'
                  }}
                >
                  "{parsedRoleSpec.purpose_statement}"
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Authorized Tools ({parsedRoleSpec.authorized_tools?.length || 0})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {parsedRoleSpec.authorized_tools?.map((tool, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                        ✓ {tool.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tool.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enforced Security Invariants
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {parsedRoleSpec.forbidden_capabilities?.slice(0, 4).map((cap, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: 'var(--color-danger-bg)',
                        border: '1px solid var(--color-danger-border)',
                        borderRadius: '4px',
                        color: 'var(--color-danger-text)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
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
        <div className="vs-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--color-primary)" />
                <span>Synthesized Red-Team Test Suite ({synthesizedScenarios.length} Scenarios)</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tailored operational inquiries and adversarial drift attacks synthesized specifically for <strong>{parsedRoleSpec.role_name}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Policy Gate Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-safe-bg)',
                  border: '1px solid var(--color-safe-border)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-safe-text)',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                <Zap size={14} color="var(--color-safe-text)" />
                <span>Autonomous Gating Active</span>
              </div>

              {/* Regenerate Suite Button */}
              <motion.button
                type="button"
                onClick={handleRegenerateSuite}
                disabled={isSynthesizing || isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-outline"
                title="Synthesize 5 fresh benign and adversarial test scenarios tailored to this agent"
              >
                <RotateCcw size={14} className={isSynthesizing ? 'animate-spin' : ''} />
                <span>{isSynthesizing ? 'Synthesizing Suite...' : 'Regenerate Suite'}</span>
              </motion.button>

              {/* Run Red-Team Suite Hero Button */}
              <motion.button
                type="button"
                onClick={handleRunEvaluation}
                disabled={!parsedRoleSpec || isRunning || !isConnected}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-voltsense"
              >
                {isRunning ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Evaluating Live Suite...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="#ffffff" strokeWidth={0} />
                    <span>Run Red-Team Suite</span>
                    {synthesizedScenarios.length > 0 && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.25)', padding: '1px 7px', borderRadius: '10px', marginLeft: '2px', fontWeight: 700 }}>
                        {synthesizedScenarios.length}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {regenSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: 'var(--color-safe-bg)',
            border: '1px solid var(--color-safe-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-safe-text)',
            fontSize: '0.86rem',
            fontWeight: 700
          }}
        >
          <Sparkles size={16} />
          <span>Successfully regenerated 5 fresh red-team vectors for <strong>{parsedRoleSpec?.role_name}</strong>!</span>
        </motion.div>
      )}

      {/* Synthesized Scenario Cards */}
      {synthesizedScenarios.length > 0 && (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}
        >
          {synthesizedScenarios.map((scn, idx) => {
            const isCurrentActive = customActiveTicket?.ticket_id === scn.scenario_id;
            return (
              <motion.div
                key={scn.scenario_id || idx}
                className="vs-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                style={{
                  padding: '16px',
                  borderColor: isCurrentActive
                    ? 'var(--color-primary)'
                    : scn.is_adversarial
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'var(--border-card)',
                  backgroundColor: isCurrentActive
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'var(--bg-card)',
                  boxShadow: isCurrentActive ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {scn.scenario_id || `TCK-CUST-10${idx + 1}`}
                  </span>
                  <span
                    className={`stat-pill ${scn.is_adversarial ? 'critical' : 'nominal'}`}
                    style={{ fontSize: '0.66rem', padding: '2px 7px' }}
                  >
                    {scn.is_adversarial ? 'ADVERSARIAL ATTACK' : 'BENIGN OPERATIONAL'}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {scn.title}
                </h4>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-body)',
                    background: 'var(--bg-input)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    minHeight: '68px',
                    maxHeight: '110px',
                    overflowY: 'auto',
                    marginBottom: '8px',
                    lineHeight: 1.45,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {scn.ticket_text}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>
                    Target Tool: <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{scn.target_tool || 'general'}</strong>
                  </span>
                  {scn.attack_vector && scn.attack_vector !== 'None' && (
                    <span style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}>{scn.attack_vector}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Live In-Flight Telemetry & Security Audit Scorecard */}
      {(isRunning || customSteps?.length > 0 || customScorecard) && (
        <div className="vs-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} color="var(--color-primary)" />
                <span>Live Red-Team In-Flight Telemetry &amp; Security Audit</span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Real-time Dual-Tier Screening: Sub-20ms Cosine Distance + Groq LLM MAD Taxonomy
              </p>
            </div>

            {customScorecard && (
              <span
                className={`stat-pill ${
                  customScorecard.defense_rate >= 100 && customScorecard.compliance_rate >= 100
                    ? 'nominal'
                    : 'critical'
                }`}
                style={{ fontSize: '0.88rem', padding: '6px 14px' }}
              >
                {customScorecard.overall_status}
              </span>
            )}
          </div>

          {/* Scorecard Metrics Bar */}
          {customScorecard && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
                padding: '18px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Defense Neutralization
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-safe-text)' }}>
                  {customScorecard.defense_rate}%
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {customScorecard.attacks_blocked} of {customScorecard.attacks_total} attacks neutralized
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Benign Compliance
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent-cyan)' }}>
                  {customScorecard.compliance_rate}%
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {customScorecard.benign_passed} of {customScorecard.benign_total} requests resolved
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Average Vector Distance
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'var(--font-mono)' }}>
                  {customScorecard.avg_tier1_distance}
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Baseline Threshold: 0.52</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  MAD Taxonomy Flags
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-danger-text)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {customScorecard.mad_codes_detected?.length > 0 ? customScorecard.mad_codes_detected.join(', ') : 'None (Compliant)'}
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Forensic Excursion Codes</span>
              </div>
            </div>
          )}

          {/* Full Step-by-Step Execution Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customSteps?.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: step.phase === 'BLOCKED' ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                  border: `1px solid ${step.phase === 'BLOCKED' ? 'var(--color-danger-border)' : 'var(--border-card)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'var(--font-mono)' }}>
                      Step {step.step_id || idx + 1}: {step.agent_name || parsedRoleSpec?.role_name}
                    </span>
                    <span
                      className={`stat-pill ${step.phase === 'BLOCKED' ? 'critical' : 'nominal'}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      {step.phase === 'BLOCKED' ? '🛑 AUTO-QUARANTINED' : '✅ COMPLIANT'}
                    </span>
                  </div>
                  {step.tool_name && (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        padding: '2px 8px',
                        background: 'var(--bg-input)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      Tool: <strong>{step.tool_name}</strong>
                    </span>
                  )}
                </div>

                {step.agent_thought && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.45 }}>
                    "{step.agent_thought}"
                  </p>
                )}

                {step.tool_arguments && Object.keys(step.tool_arguments).length > 0 && (
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-body)',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-input)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '6px'
                    }}
                  >
                    Arguments: {JSON.stringify(step.tool_arguments)}
                  </div>
                )}

                {step.tool_result && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: step.phase === 'BLOCKED' ? 'var(--color-danger-text)' : 'var(--color-safe-text)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {step.tool_result}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
