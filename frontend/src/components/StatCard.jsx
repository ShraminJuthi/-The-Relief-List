import { ArrowUpRight } from 'lucide-react'
export default function StatCard({ label, value, note, icon: Icon, tone = 'blue' }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18}/></div></div><div className="stat-value">{value}</div><div className="stat-note"><ArrowUpRight size={14}/>{note}</div></div>
}
