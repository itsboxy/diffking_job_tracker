import React from 'react';
import { NavLink } from 'react-router-dom';
import { Archive, BookOpen, CalendarDays, ClipboardList, HelpCircle, Layers, LayoutDashboard, Search, Settings as SettingsIcon, Wrench } from 'lucide-react';
import Logo from './Logo';

const SideNav: React.FC = () => {
  return (
    <aside className="side-nav">
      <div className="side-nav-header">
        <Logo size={36} showText={true} />
      </div>
      <nav className="side-nav-links">
        <NavLink to="/" exact className="side-nav-link" activeClassName="active">
          <ClipboardList className="icon" />
          Home
        </NavLink>
        <NavLink to="/track" className="side-nav-link" activeClassName="active">
          <LayoutDashboard className="icon" />
          Jobs
        </NavLink>
        <NavLink to="/queries" className="side-nav-link" activeClassName="active">
          <HelpCircle className="icon" />
          Queries
        </NavLink>
        <NavLink to="/calendar" className="side-nav-link" activeClassName="active">
          <CalendarDays className="icon" />
          Calendar
        </NavLink>
        <NavLink to="/archive" className="side-nav-link" activeClassName="active">
          <Archive className="icon" />
          Archived
        </NavLink>
        <NavLink to="/settings" className="side-nav-link" activeClassName="active">
          <SettingsIcon className="icon" />
          Settings
        </NavLink>

        <div className="side-nav-section-label">
          <BookOpen className="icon" />
          Handbook
        </div>
        <NavLink to="/handbook/repair" className="side-nav-link side-nav-sublink" activeClassName="active">
          <Wrench className="icon" />
          Repair
        </NavLink>
        <NavLink to="/handbook/fabrication" className="side-nav-link side-nav-sublink" activeClassName="active">
          <Layers className="icon" />
          Fabrication
        </NavLink>
        <NavLink to="/bearing-search" className="side-nav-link side-nav-sublink" activeClassName="active">
          <Search className="icon" />
          Bearing Search
        </NavLink>
      </nav>
    </aside>
  );
};

export default SideNav;
