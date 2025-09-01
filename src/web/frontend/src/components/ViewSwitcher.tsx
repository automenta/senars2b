import React from 'react';
import {FaList, FaThLarge} from 'react-icons/fa';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
    currentView: 'list' | 'board';
    onViewChange: (view: 'list' | 'board') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({currentView, onViewChange}) => {
    return (
        <div className={styles.viewSwitcher}>
            <button
                className={`${styles.viewButton} ${currentView === 'list' ? styles.active : ''}`}
                onClick={() => onViewChange('list')}
                aria-pressed={currentView === 'list'}
                title="List View"
            >
                <FaList/>
            </button>
            <button
                className={`${styles.viewButton} ${currentView === 'board' ? styles.active : ''}`}
                onClick={() => onViewChange('board')}
                aria-pressed={currentView === 'board'}
                title="Board View"
            >
                <FaThLarge/>
            </button>
        </div>
    );
};

export default ViewSwitcher;