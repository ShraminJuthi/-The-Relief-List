import { Bell, Menu, Search } from 'lucide-react'
export default function Topbar({ title, subtitle, onMenu }) {
  return <header className="topbar"><button className="icon-btn menu-toggle" onClick={onMenu}><Menu size={20}/></button><div className="top-title"><h1>{title}</h1><p>{subtitle}</p></div><div className="top-actions"><div className="search-pill"><Search size={16}/><span>Search records</span><kbd>⌘ K</kbd></div><button className="icon-btn notification"><Bell size={18}/><i/></button><div className="avatar">RU</div></div></header>
}
