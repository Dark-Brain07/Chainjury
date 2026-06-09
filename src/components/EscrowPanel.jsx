import { useState } from 'react';
import { Loader2, Lock, Search, CheckCircle2, XCircle, Minus } from 'lucide-react';
import { CONTRACTS, readContract, writeAndWait } from '../utils/genlayer';

export default function EscrowPanel({ wallet, onConnect, showToast }) {
  const [tab, setTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ seller: '', amount: '', milestones: '1' });
  const [lookupId, setLookupId] = useState('');
  const [escrowData, setEscrowData] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ escrowId: '', url: '', requirements: '' });
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createEscrow = async (e) => {
    e.preventDefault();
    if (!wallet) { onConnect(); return; }
    setLoading(true);
    try {
      const ms = [];
      const count = parseInt(form.milestones) || 1;
      const perMs = Math.floor(parseInt(form.amount) / count);
      for (let i = 0; i < count; i++) ms.push({ name: `Milestone ${i + 1}`, amount: String(perMs) });
      
      await writeAndWait(CONTRACTS.ESCROW, 'create_escrow', [wallet, form.seller, form.amount, JSON.stringify(ms)]);
      showToast('Escrow created!', 'success');
      setForm({ seller: '', amount: '', milestones: '1' });
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    setLoading(false);
  };

  const lookupEscrow = async () => {
    if (!lookupId) return;
    setLoading(true);
    setEscrowData(null);
    try {
      const r = await readContract(CONTRACTS.ESCROW, 'get_escrow', [lookupId]);
      if (r && r !== 'NOT_FOUND') setEscrowData(JSON.parse(r));
      else showToast('Escrow not found', 'error');
    } catch { showToast('Error fetching escrow', 'error'); }
    setLoading(false);
  };

  const verifyDelivery = async (e) => {
    e.preventDefault();
    if (!wallet) { onConnect(); return; }
    setVerifying(true);
    setVerifyResult(null);
    try {
      await writeAndWait(CONTRACTS.ESCROW, 'verify_delivery', [verifyForm.escrowId, verifyForm.url, verifyForm.requirements]);
      const r = await readContract(CONTRACTS.ESCROW, 'get_escrow', [verifyForm.escrowId]);
      if (r && r !== 'NOT_FOUND') setVerifyResult('Verification complete! Check escrow details.');
      showToast('Delivery verification complete', 'success');
    } catch (e) { showToast('Verification failed: ' + e.message, 'error'); }
    setVerifying(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['create', 'lookup', 'verify'].map(t => (
          <button key={t} className={`nav-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'create' ? '➕' : t === 'lookup' ? '🔍' : '✅'} {t}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="section-card glass">
          <div className="section-title"><Lock size={20} /> Create Escrow Agreement</div>
          <form onSubmit={createEscrow}>
            <div className="form-group">
              <label className="form-label">Seller Wallet Address</label>
              <input className="form-input" placeholder="0x..." value={form.seller} onChange={e => update('seller', e.target.value)} disabled={loading} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Amount (USD)</label>
                <input className="form-input" type="number" placeholder="1000" value={form.amount} onChange={e => update('amount', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Milestones</label>
                <input className="form-input" type="number" min="1" max="10" placeholder="3" value={form.milestones} onChange={e => update('milestones', e.target.value)} disabled={loading} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Creating...</> : <><Lock size={16} /> Create Escrow</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'lookup' && (
        <div className="section-card glass">
          <div className="section-title"><Search size={20} /> Lookup Escrow</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="form-input" placeholder="ESC-1" value={lookupId} onChange={e => setLookupId(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupEscrow()} />
            <button className="btn-primary" onClick={lookupEscrow} disabled={loading} style={{ minWidth: 100 }}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Search'}
            </button>
          </div>
          {escrowData && (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontWeight: 700, color: escrowData.status === 'ACTIVE' ? 'var(--accent-emerald)' : escrowData.status === 'DISPUTED' ? 'var(--accent-rose)' : 'var(--accent-sky)' }}>{escrowData.status}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</div>
                  <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>${escrowData.total_amount}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Milestones</div>
                  <div style={{ fontWeight: 700 }}>{escrowData.milestones?.length || 0}</div>
                </div>
              </div>
              <div className="milestone-list">
                {(escrowData.milestones || []).map((m, i) => (
                  <div key={i} className="milestone-item">
                    <div className={`milestone-dot ${m.status?.toLowerCase() || 'pending'}`} />
                    <div className="milestone-info">
                      <div className="milestone-name">{m.name}</div>
                      <div className="milestone-amount">${m.amount} · {m.status}</div>
                    </div>
                    {m.status === 'RELEASED' && <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />}
                    {m.status === 'REFUNDED' && <XCircle size={16} style={{ color: 'var(--accent-rose)' }} />}
                    {m.status === 'PENDING' && <Minus size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div className="section-card glass">
          <div className="section-title"><CheckCircle2 size={20} /> AI Delivery Verification</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Submit a delivery URL and requirements. GenLayer AI validators will verify if the deliverable matches.</p>
          <form onSubmit={verifyDelivery}>
            <div className="form-group">
              <label className="form-label">Escrow ID</label>
              <input className="form-input" placeholder="ESC-1" value={verifyForm.escrowId} onChange={e => setVerifyForm(p => ({ ...p, escrowId: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery URL</label>
              <input className="form-input" type="url" placeholder="https://..." value={verifyForm.url} onChange={e => setVerifyForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Requirements</label>
              <textarea className="form-textarea" placeholder="Describe what was agreed upon..." value={verifyForm.requirements} onChange={e => setVerifyForm(p => ({ ...p, requirements: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary" disabled={verifying} style={{ width: '100%' }}>
              {verifying ? <><Loader2 size={16} className="spin" /> Verifying...</> : '✅ Verify Delivery'}
            </button>
          </form>
          {verifyResult && <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>{verifyResult}</div>}
        </div>
      )}
    </div>
  );
}
