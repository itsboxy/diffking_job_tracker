import React from 'react';
import { NavLink } from 'react-router-dom';
import { Archive, CalendarDays, ClipboardList, HelpCircle, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';
import Logo from './Logo';

const SideNav: React.FC = () => {
  return (
    <aside className="side-nav">
      <div className="side-nav-header">
        <Logo size={36} showText={false} />
        <div>
          <h2>Diff King</h2>
          <span>Job Tracker</span>
        </div>
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
      </nav>
    </aside>
  );
};

export default SideNav;
