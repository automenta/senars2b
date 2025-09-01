import React from 'react';
import { FaList, FaThLarge, FaProjectDiagram, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
  currentView: 'list' | 'board' | 'timeline' | 'priority' | 'calendar';
  onViewChange: (view: 'list' | 'board' | 'timeline' | 'priority' | 'calendar') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'list', label: 'List', icon: <FaList /> },
    { id: 'board', label: 'Board', icon: <FaThLarge /> },
    { id: 'timeline', label: 'Timeline', icon: <FaProjectDiagram /> },
    { id: 'priority', label: 'Priority', icon: <FaLayerGroup /> },
    { id: 'calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
  ];

  return (
    <div className={styles.viewSwitcher}>
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id as any)}
          className={`${styles.viewButton} ${currentView === view.id ? styles.active : ''}`}
          aria-pressed={currentView === view.id}
          title={`Switch to ${view.label} view`}
        >
          <span className={styles.viewIcon}>{view.icon}</span>
          <span className={styles.viewLabel}>{view.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;