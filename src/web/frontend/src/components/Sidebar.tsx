import React from 'react';
import { FaTachometerAlt, FaTasks, FaCogs, FaTerminal, FaBrain } from 'react-icons/fa';
import { useStore } from '../store';

const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useStore();
  const navItems = [
    { name: 'Dashboard', icon: <FaTachometerAlt /> },
    { name: 'Processing', icon: <FaBrain /> },
    { name: 'Tasks', icon: <FaTasks /> },
    { name: 'Configuration', icon: <FaCogs /> },
    { name: 'CLI', icon: <FaTerminal /> },
  ];

  const handleSelect = (view: string) => {
    setActiveView(view);
  };

  const handleKeyDown = (event: React.KeyboardEvent, view: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleSelect(view);
    }
  };

  return (
    <nav className="sidebar" aria-label="Main Navigation">
      <h2 className="sidebar-title">Senars3</h2>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li
            key={item.name}
            className={`sidebar-nav-item ${activeView === item.name ? 'active' : ''}`}
            onClick={() => handleSelect(item.name)}
            onKeyDown={(e) => handleKeyDown(e, item.name)}
            role="button"
            aria-pressed={activeView === item.name}
            tabIndex={0}
          >
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
