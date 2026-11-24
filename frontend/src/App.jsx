import { useMemo, useState } from 'react'
import { Activity, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Download, FileSpreadsheet, Filter, GitCompareArrows, MoreHorizontal, Plus, Search, ShieldCheck, UploadCloud, Users, X, AlertTriangle } from 'lucide-react'
import Papa from 'papaparse'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatCard from './components/StatCard'
import { loadState, saveState, sources } from './data/demo'
import { USE_MOCK, api } from './services/api'

const titles = {
  dashboard: ['Dashboard', 'Overview of relief beneficiary records'],
  import: ['Import Lists', 'Bring records together from the three source lists'],
  records: ['All Records', 'Review imported beneficiary records'],
  review: ['Duplicate Review', 'Review possible matches and make the final decision'],
  beneficiaries: ['Final Beneficiaries', 'People confirmed for the relief distribution list'],
  reports: ['Reports', 'Export and review your beneficiary data'],
}
const fmt = n => new Intl.NumberFormat('en').format(n)

export default function App() {
  const [state, setState] = useState(loadState)
  const [page, setPage] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filterSource, setFilterSource] = useState('All sources')
  const [activeMatch, setActiveMatch] = useState(null)
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)
  const records = state.records
  const matches = state.matches
  const pending = matches.filter(m => m.status === 'pending')
  const confirmed = matches.filter(m => m.status === 'same')
  const decisions = matches.filter(m => m.status !== 'pending').length
  const beneficiaries = useMemo(() => {
    const grouped = new Map()
    const mergedIds = new Set()
    confirmed.forEach(m => { mergedIds.add(m.a); mergedIds.add(m.b) })
    records.forEach(r => {
      if (grouped.has(r.id)) return
      const related = confirmed.flatMap(m => m.a === r.id ? [m.b] : m.b === r.id ? [m.a] : [])
      const group = [r, ...related.map(id => records.find(x => x.id === id)).filter(Boolean)]
      group.forEach(x => grouped.set(x.id, { id: r.id, records: group }))
    })
    return [...new Map(records.map(r => {
      const group = grouped.get(r.id)?.records || [r]
      return [group.map(x => x.id).sort().join('|'), { id: group[0].id, name: group[0].name, source: [...new Set(group.map(x => x.source))].join(', '), address: group[0].address, count: group.length }]
    })).values()]
  }, [records, confirmed])

  function update(next) { setState(next); saveState(next) }
  function notify(message) { setToast(message); setTimeout(() => setToast(''), 3000) }
  function findRecord(id) { return records.find(r => r.id === id) }
  function decide(match, decision) {
    const next = { ...state, matches: matches.map(m => m.id === match.id ? { ...m, status: decision } : m) }
    update(next); setActiveMatch(null)
    notify(decision === 'same' ? 'Marked as the same person.' : decision === 'different' ? 'Marked as different people.' : 'Marked for more information.')
    if (!USE_MOCK) api.decideMatch(match.id, decision).catch(() => notify('Saved locally; backend decision sync failed.'))
  }
  async function importFile(sourceName, file) {
    if (!file) return
    setUploading(true)
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async result => {
      const rows = result.data.map((r, i) => ({
        id: `UP-${Date.now()}-${i}`, source: sourceName,
        name: r.name || r.Name || r['Full Name'] || r['Beneficiary Name'] || 'Unnamed record',
        age: Number(r.age || r.Age) || null,
        address: r.address || r.Address || r.village || r.Village || r.location || '',
        family: Number(r.family || r['Family Members'] || r['Household Size']) || null,
        relative: r.relative || r.Wife || r['Relative Name'] || '',
      }))
      if (!rows.length) { notify('No rows found in this CSV file.'); setUploading(false); return }
      const next = { ...state, records: [...records, ...rows], imported: [...(state.imported || []), { source: sourceName, file: file.name, count: rows.length }] }
      update(next); setUploading(false); notify(`${rows.length} records imported from ${sourceName}.`)
      if (!USE_MOCK) { try { await api.uploadSource(sourceName, file) } catch { notify('Imported locally; backend upload sync failed.') } }
    }, error: () => { setUploading(false); notify('Could not read this CSV file.') } })
  }
  function exportCsv(rows, filename) {
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }
  const filteredRecords = records.filter(r => (filterSource === 'All sources' || r.source === filterSource) && `${r.name} ${r.address} ${r.id}`.toLowerCase().includes(query.toLowerCase()))
  const [title, subtitle] = titles[page]

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} open={mobileOpen} setOpen={setMobileOpen}/>
    <main className="main-area">
      <Topbar title={title} subtitle={subtitle} onMenu={() => setMobileOpen(true)}/>
      <div className="page-content">
        {page === 'dashboard' && <Dashboard records={records} pending={pending} beneficiaries={beneficiaries} decisions={decisions} setPage={setPage} setActiveMatch={setActiveMatch}/>}
        {page === 'import' && <ImportPage importFile={importFile} uploading={uploading} imported={state.imported || []}/>}
        {page === 'records' && <RecordsPage records={filteredRecords} query={query} setQuery={setQuery} filterSource={filterSource} setFilterSource={setFilterSource} exportCsv={exportCsv}/>}
        {page === 'review' && <ReviewPage matches={matches} findRecord={findRecord} onReview={setActiveMatch}/>}
        {page === 'beneficiaries' && <BeneficiariesPage beneficiaries={beneficiaries} exportCsv={exportCsv}/>}
        {page === 'reports' && <ReportsPage records={records} matches={matches} beneficiaries={beneficiaries} exportCsv={exportCsv}/>}
      </div>
      <footer className="footer"><span>© 2026 The Relief List</span><span><ShieldCheck size={13}/> Human-reviewed beneficiary matching</span></footer>
    </main>
    {activeMatch && <MatchModal match={activeMatch} a={findRecord(activeMatch.a)} b={findRecord(activeMatch.b)} onClose={() => setActiveMatch(null)} onDecide={decide}/>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function Dashboard({ records, pending, beneficiaries, decisions, setPage, setActiveMatch }) {
  const sourcesCount = sources.map(s => ({ ...s, count: records.filter(r => r.source === s.name).length }))
  const latest = pending.slice(0, 3)
  return <div className="stack-lg">
    <section className="welcome-row"><div><div className="eyebrow">RELIEF DISTRIBUTION WORKSPACE</div><h2>Good morning, Ruma <span>👋</span></h2><p>Here’s the latest overview of your beneficiary records.</p></div><button className="btn btn-primary" onClick={() => setPage('import')}><Plus size={17}/> Import records</button></section>
    <div className="stat-grid">
      <StatCard label="Total records" value={fmt(records.length)} note="Across all source lists" icon={Users} tone="blue"/>
      <StatCard label="Possible duplicates" value={fmt(pending.length)} note="Waiting for your review" icon={GitCompareArrows} tone="amber"/>
      <StatCard label="Reviewed decisions" value={fmt(decisions)} note="Human decisions recorded" icon={CheckCircle2} tone="green"/>
      <StatCard label="Beneficiary groups" value={fmt(beneficiaries.length)} note="Current working list" icon={ShieldCheck} tone="purple"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><div><h3>Source list overview</h3><p>Records received from each organisation</p></div><button className="text-btn" onClick={() => setPage('import')}>Manage sources <ArrowRight size={14}/></button></div>
        <div className="source-list">{sourcesCount.map(s => <div className="source-line" key={s.id}><div className={`source-badge ${s.color}`}>{s.short}</div><div className="source-info"><b>{s.name}</b><small>{s.count} records imported</small><div className="bar"><i style={{width: `${records.length ? s.count / records.length * 100 : 0}%`}} className={s.color}/></div></div><strong>{s.count}</strong></div>)}</div>
      </section>
      <section className="panel"><div className="panel-heading"><div><h3>Review progress</h3><p>Human decisions keep the list accurate</p></div><Activity size={19} className="muted"/></div><div className="progress-number">{decisions}<span> / {decisions + pending.length}</span></div><div className="bar large"><i style={{width: `${decisions + pending.length ? decisions / (decisions + pending.length) * 100 : 0}%`}}/></div><div className="progress-legend"><span><i className="legend-green"/> Reviewed</span><span><i className="legend-amber"/> Pending</span></div><button className="btn btn-secondary full-btn" onClick={() => setPage('review')}>Continue reviewing <ArrowRight size={16}/></button></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Needs your attention</h3><p>Possible matches suggested by the system</p></div><button className="text-btn" onClick={() => setPage('review')}>View all <ArrowRight size={14}/></button></div>
      {latest.length ? <div className="table-wrap"><table><thead><tr><th>Record pair</th><th>Sources</th><th>Similarity</th><th>Status</th><th/></tr></thead><tbody>{latest.map(m => <tr key={m.id}><td><b>{m.id}</b><small className="cell-sub">{m.a} ↔ {m.b}</small></td><td>{findSourceName(records,m.a)} + {findSourceName(records,m.b)}</td><td><span className="score">{m.score}%</span></td><td><span className="status pending">Pending review</span></td><td><button className="small-btn" onClick={() => setActiveMatch(m)}>Review</button></td></tr>)}</tbody></table></div> : <Empty text="No pending matches. You are up to date."/>}
    </section>
  </div>
}
function findSourceName(records, id) { return records.find(r => r.id === id)?.source?.replace(' Organisation','') || 'Source' }

function ImportPage({ importFile, uploading, imported }) {
  return <div className="stack-lg"><section className="intro-card"><div className="intro-icon"><UploadCloud size={23}/></div><div><h2>Bring your lists together</h2><p>Upload a CSV file for each source. The system will standardise common fields for review.</p></div></section>
    <div className="upload-grid">{sources.map(s => <div className="panel upload-card" key={s.id}><div className={`source-badge ${s.color}`}>{s.short}</div><h3>{s.name}</h3><p>Upload the beneficiary list received from {s.name.toLowerCase()}.</p><label className="upload-drop"><UploadCloud size={22}/><b>{uploading ? 'Processing file…' : 'Choose CSV file'}</b><small>CSV format · Name, Age, Address, Family Members</small><input type="file" accept=".csv,text/csv" disabled={uploading} onChange={e => importFile(s.name, e.target.files?.[0])}/></label></div>)}</div>
    <section className="panel"><div className="panel-heading"><div><h3>Import history</h3><p>Files added during this session</p></div><FileSpreadsheet size={18} className="muted"/></div>{imported.length ? <div className="table-wrap"><table><thead><tr><th>Source</th><th>File</th><th>Records</th></tr></thead><tbody>{imported.map((x,i)=><tr key={i}><td>{x.source}</td><td>{x.file}</td><td>{x.count}</td></tr>)}</tbody></table></div> : <Empty text="No files imported yet."/>}</section>
    <p className="hint"><CircleHelp size={15}/> This starter frontend reads CSV files in your browser. Excel upload and server-side import will be connected with the backend member.</p>
  </div>
}

function RecordsPage({ records, query, setQuery, filterSource, setFilterSource, exportCsv }) {
  return <div className="stack-lg"><section className="panel"><div className="toolbar"><div className="search-input"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, address or ID…"/></div><select value={filterSource} onChange={e=>setFilterSource(e.target.value)}><option>All sources</option>{sources.map(s=><option key={s.id}>{s.name}</option>)}</select><button className="btn btn-secondary" onClick={()=>exportCsv(records,'relief-records.csv')}><Download size={16}/> Export CSV</button></div>
    <div className="table-wrap"><table><thead><tr><th>Beneficiary</th><th>Age</th><th>Address</th><th>Family size</th><th>Source</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><b>{r.name}</b><small className="cell-sub">{r.id}</small></td><td>{r.age ?? '—'}</td><td>{r.address || '—'}</td><td>{r.family ?? '—'}</td><td><span className="source-tag">{r.source}</span></td></tr>)}</tbody></table>{!records.length && <Empty text="No records match your search."/>}</div></section></div>
}

function ReviewPage({ matches, findRecord, onReview }) {
  const [status, setStatus] = useState('pending')
  const shown = matches.filter(m => status === 'all' || m.status === status)
  return <div className="stack-lg"><section className="review-banner"><div className="review-banner-icon"><GitCompareArrows size={23}/></div><div><h2>Your judgement matters</h2><p>The system suggests possible matches. Review the evidence and make the final decision. A score is not proof that two records belong to the same person.</p></div></section>
    <div className="filter-tabs">{[['pending','Pending'],['same','Same person'],['different','Different people'],['more','Need more info'],['all','All']].map(([v,l])=><button className={status===v?'selected':''} key={v} onClick={()=>setStatus(v)}>{l}<span>{matches.filter(m=>v==='all'||m.status===v).length}</span></button>)}</div>
    <div className="match-list">{shown.map(m=><div className="panel match-card" key={m.id}><div className="match-head"><div><span className="eyebrow">{m.id}</span><h3>{findRecord(m.a)?.name || m.a} <span className="versus">vs</span> {findRecord(m.b)?.name || m.b}</h3></div><div className="score-block"><b>{m.score}%</b><small>Similarity</small></div></div><div className="match-meta"><span>{findRecord(m.a)?.source}</span><ArrowRight size={14}/><span>{findRecord(m.b)?.source}</span><span className={`status ${m.status}`}>{statusLabel(m.status)}</span></div><div className="reason-row">{m.reasons.slice(0,2).map((r,i)=><span key={i}><Check size={14}/>{r}</span>)}</div><div className="match-foot"><small>{m.status==='pending'?'Please review this suggestion.':'Your decision has been saved.'}</small><button className="btn btn-secondary" onClick={()=>onReview(m)}>{m.status==='pending'?'Review records':'View decision'} <ArrowRight size={15}/></button></div></div>)}</div>
    {!shown.length && <Empty text="No matches in this category."/>}
  </div>
}
function statusLabel(s) { return ({pending:'Pending review',same:'Same person',different:'Different people',more:'Need more information'})[s] || s }

function MatchModal({ match, a, b, onClose, onDecide }) {
  if (!a || !b) return null
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><span className="eyebrow">MATCH REVIEW · {match.id}</span><h2>Are these the same person?</h2></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="modal-score"><b>{match.score}%</b><span>System similarity suggestion — not a confirmed identity</span></div><div className="compare-grid">{[a,b].map((r,i)=><div className="compare-card" key={r.id}><span className="source-tag">{r.source}</span><h3>{r.name}</h3><dl><dt>Record ID</dt><dd>{r.id}</dd><dt>Age</dt><dd>{r.age ?? 'Not provided'}</dd><dt>Address</dt><dd>{r.address || 'Not provided'}</dd><dt>Family members</dt><dd>{r.family ?? 'Not provided'}</dd><dt>Relative</dt><dd>{r.relative || 'Not provided'}</dd></dl></div>)}</div><section className="explanation"><h4>Why the system suggested a match</h4>{match.reasons.map((r,i)=><p key={i}><CheckCircle2 size={15}/>{r}</p>)}<p className="caution"><AlertTriangle size={15}/>{match.caution}</p></section><div className="decision-area"><b>Your decision</b><p>Choose the option that best reflects what you know about this household.</p><div className="decision-buttons"><button className="decision same" onClick={()=>onDecide(match,'same')}><CheckCircle2 size={17}/>Same person</button><button className="decision different" onClick={()=>onDecide(match,'different')}><X size={17}/>Different people</button><button className="decision more" onClick={()=>onDecide(match,'more')}><Clock3 size={17}/>Need more info</button></div></div></div></div>
}

function BeneficiariesPage({ beneficiaries, exportCsv }) {
  return <div className="stack-lg"><section className="intro-card green-intro"><div className="intro-icon"><UserCheckIcon/></div><div><h2>Confirmed beneficiary groups</h2><p>Records marked as the same person are grouped together. Pending suggestions are not automatically merged.</p></div><button className="btn btn-primary" onClick={()=>exportCsv(beneficiaries,'final-beneficiaries.csv')}><Download size={16}/> Export list</button></section><section className="panel"><div className="panel-heading"><div><h3>Working beneficiary list</h3><p>{beneficiaries.length} current groups · review decisions control grouping</p></div></div><div className="table-wrap"><table><thead><tr><th>Beneficiary</th><th>Address</th><th>Sources represented</th><th>Records grouped</th></tr></thead><tbody>{beneficiaries.map(b=><tr key={b.id}><td><b>{b.name}</b><small className="cell-sub">{b.id}</small></td><td>{b.address}</td><td>{b.source}</td><td>{b.count}</td></tr>)}</tbody></table></div></section><p className="hint"><ShieldCheck size={15}/> Only records confirmed as the same person are grouped. Review unresolved matches before using this list for distribution.</p></div>
}
function UserCheckIcon() { return <CheckCircle2 size={23}/> }

function ReportsPage({ records, matches, beneficiaries, exportCsv }) {
  const pending = matches.filter(m=>m.status==='pending').length
  return <div className="stack-lg"><section className="intro-card"><div className="intro-icon"><FileSpreadsheet size={23}/></div><div><h2>Distribution preparation report</h2><p>Download a snapshot of the current working data. Check pending reviews before final distribution.</p></div></section><div className="report-grid"><div className="panel report-card"><span>Total records</span><b>{records.length}</b><small>Imported source entries</small></div><div className="panel report-card"><span>Possible matches</span><b>{matches.length}</b><small>{pending} still pending</small></div><div className="panel report-card"><span>Beneficiary groups</span><b>{beneficiaries.length}</b><small>Based on confirmed decisions</small></div></div><section className="panel"><div className="panel-heading"><div><h3>Export data</h3><p>CSV files can be opened in Excel or Google Sheets.</p></div></div><div className="export-options"><button className="export-row" onClick={()=>exportCsv(records,'all-source-records.csv')}><div className="export-icon"><Users size={19}/></div><span><b>All source records</b><small>Every imported entry, preserving source details</small></span><Download size={17}/></button><button className="export-row" onClick={()=>exportCsv(matches,'match-review-decisions.csv')}><div className="export-icon"><GitCompareArrows size={19}/></div><span><b>Match review results</b><small>Suggested pairs, scores and human decisions</small></span><Download size={17}/></button><button className="export-row" onClick={()=>exportCsv(beneficiaries,'final-beneficiary-groups.csv')}><div className="export-icon"><UserCheckIcon/></div><span><b>Beneficiary groups</b><small>Current grouped list for further checking</small></span><Download size={17}/></button></div></section></div>
}
function Empty({ text }) { return <div className="empty"><div><Search size={20}/></div>{text}</div> }
