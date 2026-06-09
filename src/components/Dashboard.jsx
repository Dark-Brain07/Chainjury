import { Users, Gavel, Shield, TrendingUp, RefreshCw } from 'lucide-react';

export default function Dashboard({ stats, onRefresh }) {
  const cards = [
    { label: 'Registered Users', value: stats.total_users, color: 'violet', icon: <Users size={22} /> },
    { label: 'Total Cases Filed', value: stats.total_cases, color: 'amber', icon: <Gavel size={22} /> },
    { label: 'AI Verdicts Rendered', value: stats.total_verdicts, color: 'emerald', icon: <Shield size={22} /> },
    { label: 'Resolution Rate', value: stats.total_cases !== '0' ? Math.round((parseInt(stats.total_verdicts) / parseInt(stats.total_cases)) * 100) + '%' : '—', color: 'sky', icon: <TrendingUp size={22} /> },
  ];

  return (
    <div>
      <section className="hero">
        <div className="hero-badge">⚖️ Decentralized AI Arbitration</div>
        <h1>Trustless Dispute Resolution for Digital Commerce</h1>
        <p>File disputes, submit evidence, and receive AI-powered verdicts backed by GenLayer's consensus protocol. No intermediaries. No bias. Just on-chain justice.</p>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-secondary" onClick={onRefresh} style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
          <RefreshCw size={13} /> Refresh Stats
        </button>
      </div>

      <div className="stats-grid">
        {cards.map((c, i) => (
          <div key={i} className={`stat-card glass ${c.color}`}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-number">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="section-card glass">
        <div className="section-title"><Shield size={20} /> How ChainJury Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { step: '01', title: 'File a Dispute', desc: 'Submit your case with evidence and supporting links. AI verifies sources automatically.' },
            { step: '02', title: 'Defendant Responds', desc: 'The opposing party submits their defense and counter-evidence on-chain.' },
            { step: '03', title: 'AI Jury Evaluates', desc: 'GenLayer validators independently analyze evidence and reach consensus.' },
            { step: '04', title: 'Verdict Rendered', desc: 'Binding on-chain verdict with scores, reasoning, and automatic escrow resolution.' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: "'JetBrains Mono', monospace", opacity: 0.4 }}>{s.step}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
