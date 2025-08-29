import React from 'react';
import { FaTachometerAlt, FaTasks, FaCogs, FaTerminal, FaBrain } from 'react-icons/fa';

interface SidebarProps {
  onSelectView: (view: string) => void;
  activeView: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectView, activeView }) => {
  const navItems = [
    { name: 'Dashboard', icon: <FaTachometerAlt /> },
    { name: 'Processing', icon: <FaBrain /> },
    { name: 'Tasks', icon: <FaTasks /> },
    { name: 'Configuration', icon: <FaCogs /> },
    { name: 'CLI', icon: <FaTerminal /> },
  ];

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Senars3</h2>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li
            key={item.name}
            className={`sidebar-nav-item ${activeView === item.name ? 'active' : ''}`}
            onClick={() => onSelectView(item.name)}
          >
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
