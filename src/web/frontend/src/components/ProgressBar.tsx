import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    percentage?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({percentage = 0}) => (
    <div className={styles.container}>
        <div className={styles.bar} style={{width: `${percentage}%`}}/>
    </div>
);

export default ProgressBar;
