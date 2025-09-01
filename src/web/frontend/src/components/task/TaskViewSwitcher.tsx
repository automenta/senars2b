import React from 'react';
import {FaList, FaThLarge, FaSortAmountDown, FaChartBar} from 'react-icons/fa';
import styles from './TaskViewSwitcher.module.css';

interface TaskViewSwitcherProps {
    currentView: 'list' | 'board' | 'prioritization' | 'analytics';
    onViewChange: (view: 'list' | 'board' | 'prioritization' | 'analytics') => void;
}

const TaskViewSwitcher: React.FC<TaskViewSwitcherProps> = ({currentView, onViewChange}) => {
    const views = [
        {id: 'list', label: 'List', icon: <FaList/>},
        {id: 'board', label: 'Board', icon: <FaThLarge/>},
        {id: 'prioritization', label: 'Prioritize', icon: <FaSortAmountDown/>},
        {id: 'analytics', label: 'Analytics', icon: <FaChartBar/>}
    ];

    return (
        <div className={styles.viewSwitcher}>
            {views.map((view) => (
                <button
                    key={view.id}
                    className={`${styles.viewButton} ${currentView === view.id ? styles.active : ''}`}
                    onClick={() => onViewChange(view.id as any)}
                    aria-pressed={currentView === view.id}
                    title={view.label}
                >
                    <span className={styles.icon}>{view.icon}</span>
                    <span className={styles.label}>{view.label}</span>
                </button>
            ))}
        </div>
    );
};

export default TaskViewSwitcher;