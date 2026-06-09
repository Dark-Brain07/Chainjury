import { useState, useEffect } from 'react';
import { Scale, Wallet, Loader2, XCircle, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import './index.css';
import Dashboard from './components/Dashboard';
import FileCase from './components/FileCase';
import CaseBrowser from './components/CaseBrowser';
import EscrowPanel from './components/EscrowPanel';
import { CONTRACTS, readContract } from './utils/genlayer';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'file', label: 'File Dispute', icon: '⚖️' },
  { id: 'cases', label: 'Browse Cases', icon: '📁' },
  { id: 'escrow', label: 'Escrow Vault', icon: '🔒' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [wallet, setWallet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [stats, setStats] = useState({ total_users: '0', total_cases: '0', total_verdicts: '0' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const h = (a) => { if (a.length === 0) setWallet(null); else setWallet(a[0]); };
      window.ethereum.on('accountsChanged', h);
      return () => window.ethereum.removeListener('accountsChanged', h);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const r = await readContract(CONTRACTS.CORE, 'get_platform_stats');
      if (r) setStats(JSON.parse(r));
    } catch {}
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const truncate = (a) => a ? a.slice(0, 6) + '...' + a.slice(-4) : '';

  const connectWallet = async () => {
    if (!window.ethereum) { alert('Install MetaMask or Rabby'); return; }
    setShowModal(false);
    setConnecting(true);
    try {
      try { await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] }); } catch {}
      const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accs.length > 0) setWallet(accs[0]);
    } catch {}
    setConnecting(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <Scale className="brand-icon" size={26} />
          <span className="brand-name">ChainJury</span>
          <span className="brand-tag">Powered by GenLayer</span>
        </div>
        <button className={`wallet-btn ${wallet ? 'connected' : ''}`} onClick={() => wallet ? setShowModal(true) : connectWallet()} disabled={connecting}>
          {connecting ? <Loader2 className="spin" size={16} /> : <Wallet size={16} />}
          {connecting ? 'Connecting...' : wallet ? truncate(wallet) : 'Connect Wallet'}
        </button>
      </header>

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {tab === 'dashboard' && <Dashboard stats={stats} onRefresh={fetchStats} />}
        {tab === 'file' && <FileCase wallet={wallet} onConnect={() => setShowModal(true)} showToast={showToast} onSuccess={() => { fetchStats(); setTab('cases'); }} />}
        {tab === 'cases' && <CaseBrowser wallet={wallet} showToast={showToast} />}
        {tab === 'escrow' && <EscrowPanel wallet={wallet} onConnect={() => setShowModal(true)} showToast={showToast} />}
      </main>

      <footer className="footer">⚖️ Powered by GenLayer Intelligent Contracts · ChainJury v1.0</footer>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box glass" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>{wallet ? 'Wallet Connected' : 'Connect Wallet'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><XCircle size={22} /></button>
            </div>
            {wallet ? (
              <>
                <div className="connected-box">
                  <div className="avatar">{wallet.substring(2, 4).toUpperCase()}</div>
                  <div className="addr-info"><div className="addr-label">Connected</div><div className="addr-value">{truncate(wallet)}</div></div>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                </div>
                <div className="modal-actions">
                  <button className="modal-action-btn" onClick={async () => { try { await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] }); const a = await window.ethereum.request({ method: 'eth_requestAccounts' }); if (a.length) setWallet(a[0]); } catch {} setShowModal(false); }}><RefreshCw size={14} /> Switch</button>
                  <button className="modal-action-btn danger" onClick={() => { setWallet(null); setShowModal(false); }}><LogOut size={14} /> Disconnect</button>
                </div>
              </>
            ) : (
              <div className="wallet-list">
                <button className="wallet-item" onClick={connectWallet}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" width="32" height="32" />
                  <div className="wallet-item-info"><span className="wallet-item-name">MetaMask</span><span className="wallet-item-sub">Browser extension</span></div>
                </button>
                <button className="wallet-item" onClick={connectWallet}>
                  <div className="wallet-item-icon" style={{background:'linear-gradient(135deg,#7a81ff,#6366f1)'}}>R</div>
                  <div className="wallet-item-info"><span className="wallet-item-name">Rabby Wallet</span><span className="wallet-item-sub">Browser extension</span></div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
