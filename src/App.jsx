import { useState, useEffect } from 'react';
import { Scale, Wallet, Loader2, XCircle, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import './index.css';
import Dashboard from './components/Dashboard';
import FileCase from './components/FileCase';
import CaseBrowser from './components/CaseBrowser';
import EscrowPanel from './components/EscrowPanel';
import { CONTRACTS, readContract } from './utils/genlayer';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'file', label: 'File Dispute', icon: '⚖️' },
  { id: 'cases', label: 'Browse Cases', icon: '📁' },
  { id: 'escrow', label: 'Escrow Vault', icon: '🔒' },
];

export default function App() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const wallet = user?.wallet?.address || activeWallet?.address || null;

  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({ total_users: '0', total_cases: '0', total_verdicts: '0' });
  const [toast, setToast] = useState(null);

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

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <Scale className="brand-icon" size={26} />
          <span className="brand-name">ChainJury</span>
          <span className="brand-tag">Powered by GenLayer</span>
        </div>
        <button 
          className={`wallet-btn ${wallet ? 'connected' : ''}`} 
          onClick={() => wallet ? logout() : login()} 
          disabled={!ready}
          title={wallet ? "Click to Logout" : "Click to Login"}
        >
          <Wallet size={16} />
          {wallet ? truncate(wallet) : 'Connect Wallet'}
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
        {tab === 'file' && <FileCase wallet={wallet} onConnect={() => login()} showToast={showToast} onSuccess={() => { fetchStats(); setTab('cases'); }} />}
        {tab === 'cases' && <CaseBrowser wallet={wallet} showToast={showToast} />}
        {tab === 'escrow' && <EscrowPanel wallet={wallet} onConnect={() => login()} showToast={showToast} />}
      </main>

      <footer className="footer">⚖️ Powered by GenLayer Intelligent Contracts · ChainJury v1.0</footer>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
