import { LayoutDashboard, UploadCloud, Users, GitCompareArrows, UserCheck, FileDown, HeartHandshake, Menu, X } from 'lucide-react'

const items = [
  ['Dashboard', 'dashboard', LayoutDashboard],
  ['Import Lists', 'import', UploadCloud],
  ['All Records', 'records', Users],
  ['Duplicate Review', 'review', GitCompareArrows],
  ['Final Beneficiaries', 'beneficiaries', UserCheck],
  ['Reports', 'reports', FileDown],
]
export default function Sidebar({ page, setPage, open, setOpen }) {
  return <>
    {open && <div className="mobile-scrim" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><HeartHandshake size={22}/></div><div><b>The Relief List</b><small>Beneficiary workspace</small></div><button className="icon-btn mobile-close" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{items.map(([label, id, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setOpen(false) }}><Icon size={18}/><span>{label}</span>{id === 'review' && <i className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><HeartHandshake size={17}/></div><b>People first</b><p>Suggestions support decisions. A person always confirms a match.</p></div><div className="user-row"><div className="avatar">RU</div><div><b>Ruma</b><small>Relief coordinator</small></div><span className="online-dot"/></div></div>
    </aside>
  </>
}
