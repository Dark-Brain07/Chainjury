import { useState } from 'react';
import { Loader2, Search, Gavel, ExternalLink, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { CONTRACTS, readContract, writeAndWait } from '../utils/genlayer';

export default function CaseBrowser({ wallet, showToast }) {
  const [caseId, setCaseId] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [defenseText, setDefenseText] = useState('');
  const [defenseLink, setDefenseLink] = useState('');
  const [defending, setDefending] = useState(false);

  const lookupCase = async () => {
    if (!caseId) return;
    setLoading(true);
    setCaseData(null);
    setVerdict(null);
    try {
      const r = await readContract(CONTRACTS.DISPUTE, 'get_dispute', [caseId]);
      if (r && r !== 'NOT_FOUND') {
        setCaseData(JSON.parse(r));
      } else {
        showToast('Case not found', 'error');
      }
    } catch { showToast('Error fetching case', 'error'); }
    setLoading(false);
  };

  const submitDefense = async () => {
    if (!defenseText) { showToast('Enter defense evidence', 'error'); return; }
    setDefending(true);
    try {
      await writeAndWait(CONTRACTS.DISPUTE, 'submit_defense', [caseId, defenseText, defenseLink]);
      showToast('Defense submitted!', 'success');
      await lookupCase();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    setDefending(false);
  };

  const resolveDispute = async () => {
    setResolving(true);
    setVerdict(null);
    try {
      await writeAndWait(CONTRACTS.DISPUTE, 'resolve_dispute', [caseId]);
      const r = await readContract(CONTRACTS.DISPUTE, 'get_dispute', [caseId]);
      if (r && r !== 'NOT_FOUND') {
        const d = JSON.parse(r);
        setCaseData(d);
        setVerdict({ verdict: d.verdict, scores: d.scores, reasoning: d.reasoning });
      }
      showToast('AI Verdict rendered!', 'success');
    } catch (e) { showToast('Resolution failed: ' + e.message, 'error'); }
    setResolving(false);
  };

  const getVerdictClass = (v) => {
    if (!v) return '';
    if (v.includes('PLAINTIFF')) return 'plaintiff';
    if (v.includes('DEFENDANT')) return 'defendant';
    return 'draw';
  };

  return (
    <div>
      <div className="section-card glass">
        <div className="section-title"><Search size={20} /> Look Up Case</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" placeholder="Enter Case ID (e.g. CJ-1)" value={caseId} onChange={e => setCaseId(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupCase()} />
          <button className="btn-primary" onClick={lookupCase} disabled={loading} style={{ minWidth: 120 }}>
            {loading ? <Loader2 size={16} className="spin" /> : <><Search size={16} /> Search</>}
          </button>
        </div>
      </div>

      {caseData && (
        <div className="section-card glass" style={{ marginTop: 16, animation: 'fadeUp 0.4s ease' }}>
          <div className="section-title"><Gavel size={20} /> Case {caseData.case_id}</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{caseData.category}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
              <span className={`case-status status-${caseData.status === 'RESOLVED' ? 'resolved' : caseData.status === 'UNDER_REVIEW' ? 'review' : 'open'}`}>{caseData.status}</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>DESCRIPTION</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)' }}>{caseData.description}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: 4 }}>PLAINTIFF EVIDENCE</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{caseData.plaintiff_evidence || '—'}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: 4 }}>DEFENDANT EVIDENCE</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{caseData.defendant_evidence || 'Awaiting response...'}</div>
            </div>
          </div>

          {/* Defense submission */}
          {caseData.status === 'AWAITING_RESPONSE' && (
            <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-active)', background: 'var(--accent-violet-dim)', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.88rem' }}>Submit Defense</div>
              <textarea className="form-textarea" placeholder="Enter your defense evidence..." value={defenseText} onChange={e => setDefenseText(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="form-input" placeholder="Evidence URL (optional)" value={defenseLink} onChange={e => setDefenseLink(e.target.value)} style={{ marginBottom: 8 }} />
              <button className="btn-primary" onClick={submitDefense} disabled={defending}>
                {defending ? <><Loader2 size={14} className="spin" /> Submitting...</> : 'Submit Defense'}
              </button>
            </div>
          )}

          {/* Resolve button */}
          {caseData.status === 'UNDER_REVIEW' && !verdict && (
            <button className="btn-primary" onClick={resolveDispute} disabled={resolving} style={{ width: '100%' }}>
              {resolving ? <><Loader2 size={16} className="spin" /> AI Jury Deliberating...</> : <><Scale size={16} /> Trigger AI Resolution</>}
            </button>
          )}

          {/* Verdict display */}
          {(verdict || caseData.status === 'RESOLVED') && (
            <div className={`verdict-banner ${getVerdictClass(verdict?.verdict || caseData.verdict)}`}>
              <div className="verdict-icon">{(verdict?.verdict || caseData.verdict)?.includes('PLAINTIFF') ? <CheckCircle2 size={40} /> : (verdict?.verdict || caseData.verdict)?.includes('DEFENDANT') ? <AlertTriangle size={40} /> : <Scale size={40} />}</div>
              <div className="verdict-text">{(verdict?.verdict || caseData.verdict)?.replace(/_/g, ' ')}</div>
              {(verdict?.scores || caseData.scores) && (
                <div className="score-bars">
                  <div className="score-bar plaintiff"><div className="score-label">Plaintiff</div><div className="score-value">{(verdict?.scores || caseData.scores).plaintiff}</div></div>
                  <div className="score-bar defendant"><div className="score-label">Defendant</div><div className="score-value">{(verdict?.scores || caseData.scores).defendant}</div></div>
                </div>
              )}
              <div className="verdict-reasoning">{verdict?.reasoning || caseData.reasoning}</div>
              {CONTRACTS.DISPUTE !== 'DEPLOY_ME' && (
                <a href={`https://explorer-studio.genlayer.com/address/${CONTRACTS.DISPUTE}`} target="_blank" rel="noreferrer" className="evidence-link">
                  View on GenLayer Explorer <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {!caseData && !loading && (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <Gavel size={48} />
          <p>Search for a case by ID to view details, submit defense, or trigger AI resolution.</p>
        </div>
      )}
    </div>
  );
}
