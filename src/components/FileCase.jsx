import { useState } from 'react';
import { Loader2, Send, Link, FileText } from 'lucide-react';
import { CONTRACTS, writeAndWait, readContract } from '../utils/genlayer';

const CATEGORIES = [
  'Product Not As Described', 'Service Not Delivered', 'Quality Dispute',
  'Freelance Work Dispute', 'Digital Goods Dispute', 'Refund Request',
  'Warranty Claim', 'Contract Breach'
];

export default function FileCase({ wallet, onConnect, showToast, onSuccess }) {
  const [form, setForm] = useState({ defendant: '', category: CATEGORIES[0], amount: '', description: '', evidence: '', evidenceLink: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sender = wallet || '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    if (!form.defendant || !form.description || !form.evidence) { showToast('Fill all required fields', 'error'); return; }

    setLoading(true);
    setStep(0);
    try {
      // Step 1: Register case in core
      setLoadingText('Registering case on-chain...');
      setStep(1);
      const caseId = await writeAndWait(CONTRACTS.CORE, 'register_case', [sender, form.defendant, form.category, form.amount || '0', form.description]);
      
      // Read the case ID
      setStep(2);
      setLoadingText('Filing dispute with evidence...');
      const caseData = await readContract(CONTRACTS.CORE, 'get_platform_stats');
      const cId = 'CJ-' + (caseData ? JSON.parse(caseData).total_cases : '1');

      // Step 2: File dispute in engine
      await writeAndWait(CONTRACTS.DISPUTE, 'file_dispute', [cId, sender, form.defendant, form.category, form.description, form.evidence, form.evidenceLink || '']);

      setStep(3);
      setLoadingText('Dispute filed successfully!');
      showToast('Dispute filed: ' + cId, 'success');
      setForm({ defendant: '', category: CATEGORIES[0], amount: '', description: '', evidence: '', evidenceLink: '' });
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      showToast('Error: ' + (err.message || 'Transaction failed'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="section-card glass" style={{ animation: 'fadeUp 0.5s ease' }}>
      <div className="section-title"><FileText size={20} /> File a New Dispute</div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Defendant Wallet Address *</label>
            <input className="form-input" placeholder="0x..." value={form.defendant} onChange={e => update('defendant', e.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Dispute Category</label>
            <select className="form-select" value={form.category} onChange={e => update('category', e.target.value)} disabled={loading}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Amount Disputed (USD)</label>
          <input className="form-input" type="number" placeholder="e.g. 500" value={form.amount} onChange={e => update('amount', e.target.value)} disabled={loading} />
        </div>

        <div className="form-group">
          <label className="form-label">Dispute Description *</label>
          <textarea className="form-textarea" placeholder="Describe the dispute in detail..." value={form.description} onChange={e => update('description', e.target.value)} disabled={loading} />
        </div>

        <div className="form-group">
          <label className="form-label">Your Evidence *</label>
          <textarea className="form-textarea" placeholder="Provide your evidence, receipts, screenshots, communications..." value={form.evidence} onChange={e => update('evidence', e.target.value)} disabled={loading} />
        </div>

        <div className="form-group">
          <label className="form-label"><Link size={13} /> Evidence URL (optional)</label>
          <input className="form-input" type="url" placeholder="https://..." value={form.evidenceLink} onChange={e => update('evidenceLink', e.target.value)} disabled={loading} />
        </div>

        {loading && (
          <div className="loading-area">
            <Loader2 size={36} className="spin" style={{ color: 'var(--accent-violet)' }} />
            <div className="loading-text">{loadingText}</div>
            <div className="progress-steps">
              <div className={`step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`} />
              <div className={`step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`} />
              <div className={`step ${step >= 3 ? 'done' : ''}`} />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12, width: '100%' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Send size={16} /> File Dispute</>}
        </button>
      </form>
    </div>
  );
}
